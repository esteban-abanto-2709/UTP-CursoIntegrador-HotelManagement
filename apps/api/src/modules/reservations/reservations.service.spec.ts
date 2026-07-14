import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: any;
  let guests: any;
  let audit: any;
  let mail: any;

  const flatInclude = {
    room: { number: '101', type: { name: 'SINGLE' } },
    status: { name: 'PENDING' },
    payment: null,
    guest: {
      id: 1,
      nationalId: '12345678',
      fullName: 'Juan Pérez',
      email: null,
      phone: null,
    },
  };

  beforeEach(() => {
    prisma = {
      room: { findUnique: jest.fn(), update: jest.fn() },
      reservation: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      discount: { findMany: jest.fn() },
      paymentMethod: { findUnique: jest.fn() },
      roomCharge: { aggregate: jest.fn() },
      payment: { create: jest.fn() },
      paymentDiscount: { createMany: jest.fn() },
      $transaction: jest.fn(),
    };
    guests = { upsertByNationalId: jest.fn() };
    audit = { log: jest.fn() };
    mail = { sendReceipt: jest.fn() };

    service = new ReservationsService(
      prisma,
      guests,
      audit,
      {} as any,
      {} as any,
      mail,
    );
  });

  describe('create — validación de fechas', () => {
    const baseDto = {
      roomId: 1,
      nationalId: '12345678',
      fullName: 'Juan Pérez',
    } as any;

    it('rechaza checkOut igual al checkIn', async () => {
      await expect(
        service.create(
          { ...baseDto, checkIn: '2026-07-14', checkOut: '2026-07-14' },
          1,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.reservation.create).not.toHaveBeenCalled();
    });

    it('rechaza checkOut anterior al checkIn', async () => {
      await expect(
        service.create(
          { ...baseDto, checkIn: '2026-07-14', checkOut: '2026-07-10' },
          1,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza habitación inexistente', async () => {
      prisma.room.findUnique.mockResolvedValue(null);
      await expect(
        service.create(
          { ...baseDto, checkIn: '2026-07-14', checkOut: '2026-07-16' },
          1,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create — overbooking (assertNoOverlap)', () => {
    const dto = {
      roomId: 1,
      nationalId: '12345678',
      fullName: 'Juan Pérez',
      checkIn: '2026-07-14',
      checkOut: '2026-07-16',
    } as any;

    beforeEach(() => {
      prisma.room.findUnique.mockResolvedValue({ id: 1, price: 100 });
    });

    it('rechaza con 409 si la habitación ya tiene una reserva que se solapa', async () => {
      prisma.reservation.findFirst.mockResolvedValue({
        id: 99,
        room: { number: '101' },
      });

      await expect(service.create(dto, 1)).rejects.toThrow(ConflictException);
      expect(prisma.reservation.create).not.toHaveBeenCalled();
    });

    it('la consulta de solape solo considera reservas PENDING o ACTIVE', async () => {
      prisma.reservation.findFirst.mockResolvedValue(null);
      guests.upsertByNationalId.mockResolvedValue({ id: 1 });
      prisma.reservation.create.mockResolvedValue({ id: 5, ...flatInclude });

      await service.create(dto, 1);

      const where = prisma.reservation.findFirst.mock.calls[0][0].where;
      expect(where.status).toEqual({ name: { in: ['PENDING', 'ACTIVE'] } });
      expect(where.checkIn).toEqual({ lt: new Date('2026-07-16') });
      expect(where.checkOut).toEqual({ gt: new Date('2026-07-14') });
    });

    it('crea la reserva cuando no hay solape', async () => {
      prisma.reservation.findFirst.mockResolvedValue(null);
      guests.upsertByNationalId.mockResolvedValue({ id: 1 });
      prisma.reservation.create.mockResolvedValue({ id: 5, ...flatInclude });

      const result = await service.create(dto, 1);

      expect(prisma.reservation.create).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(5);
      expect(audit.log).toHaveBeenCalledWith(
        1,
        'CREATE',
        'Reservation',
        5,
        undefined,
        expect.anything(),
      );
    });
  });

  describe('checkOut — cálculo de totales', () => {
    const paymentCreateData = () => prisma.payment.create.mock.calls[0][0].data;

    beforeEach(() => {
      // Reserva activa de 3 noches a S/ 100 la noche
      prisma.reservation.findUnique.mockResolvedValue({
        id: 7,
        roomId: 1,
        checkIn: new Date('2026-07-10'),
        checkOut: new Date('2026-07-13'),
        rateSnapshot: new Prisma.Decimal(100),
        status: { name: 'ACTIVE' },
        room: { id: 1, number: '101', price: new Prisma.Decimal(100) },
      });
      prisma.paymentMethod.findUnique.mockResolvedValue({ id: 1, name: 'CASH' });
      prisma.payment.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 1, ...data }),
      );
      prisma.reservation.update.mockResolvedValue({
        id: 7,
        ...flatInclude,
        status: { name: 'COMPLETED' },
      });
      prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
    });

    it('sin cargos ni descuentos: grandTotal = noches × tarifa', async () => {
      prisma.roomCharge.aggregate.mockResolvedValue({ _sum: { amount: null } });

      await service.checkOut(7, { paymentMethod: 'CASH' } as any, 1);

      const data = paymentCreateData();
      expect(data.roomTotal.toNumber()).toBe(300);
      expect(data.chargesTotal.toNumber()).toBe(0);
      expect(data.subtotal.toNumber()).toBe(300);
      expect(data.discountAmount.toNumber()).toBe(0);
      expect(data.grandTotal.toNumber()).toBe(300);
    });

    it('con cargos y descuento: grandTotal = (roomTotal + cargos) − descuento', async () => {
      prisma.roomCharge.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(50) },
      });
      prisma.discount.findMany.mockResolvedValue([
        { id: 1, name: 'Promo', percentage: new Prisma.Decimal(10), isActive: true },
      ]);

      await service.checkOut(
        7,
        { paymentMethod: 'CASH', discountIds: [1] } as any,
        1,
      );

      // subtotal = 300 + 50 = 350; descuento 10% = 35; total = 315
      const data = paymentCreateData();
      expect(data.subtotal.toNumber()).toBe(350);
      expect(data.discountAmount.toNumber()).toBe(35);
      expect(data.grandTotal.toNumber()).toBe(315);
      expect(prisma.paymentDiscount.createMany).toHaveBeenCalled();
    });

    it('rechaza un descuento inactivo', async () => {
      prisma.roomCharge.aggregate.mockResolvedValue({ _sum: { amount: null } });
      prisma.discount.findMany.mockResolvedValue([
        { id: 1, name: 'Vencido', percentage: new Prisma.Decimal(10), isActive: false },
      ]);

      await expect(
        service.checkOut(7, { paymentMethod: 'CASH', discountIds: [1] } as any, 1),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('rechaza check-out de una reserva que no está ACTIVE', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        id: 7,
        status: { name: 'PENDING' },
        room: {},
      });

      await expect(
        service.checkOut(7, { paymentMethod: 'CASH' } as any, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('una estadía menor a un día cuenta como 1 noche', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        id: 7,
        roomId: 1,
        checkIn: new Date('2026-07-10T14:00:00Z'),
        checkOut: new Date('2026-07-10T18:00:00Z'),
        rateSnapshot: new Prisma.Decimal(100),
        status: { name: 'ACTIVE' },
        room: { id: 1, number: '101', price: new Prisma.Decimal(100) },
      });
      prisma.roomCharge.aggregate.mockResolvedValue({ _sum: { amount: null } });

      await service.checkOut(7, { paymentMethod: 'CASH' } as any, 1);

      expect(paymentCreateData().roomTotal.toNumber()).toBe(100);
    });
  });
});
