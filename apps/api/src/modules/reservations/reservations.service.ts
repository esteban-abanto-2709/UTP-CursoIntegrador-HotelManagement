import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { FilterReservationsDto } from './dto/filter-reservations.dto';
import { CheckoutReservationDto } from './dto/checkout-reservation.dto';
import { GuestsService } from '../guests/guests.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private guests: GuestsService,
    private audit: AuditService,
  ) {}

  private readonly reservationInclude = {
    room: { select: { number: true, type: { select: { name: true } } } },
    guest: {
      select: {
        id: true,
        nationalId: true,
        fullName: true,
        email: true,
        phone: true,
      },
    },
    payment: {
      select: { grandTotal: true, paymentMethod: { select: { name: true } } },
    },
    creator: {
      select: { id: true, username: true, firstName: true, lastName: true },
    },
  } satisfies Prisma.ReservationInclude;

  private flattenReservation<
    R extends {
      room: { type: { name: string } | null };
      payment: { paymentMethod: { name: string } | null } | null;
    },
  >(reservation: R) {
    return {
      ...reservation,
      room: { ...reservation.room, type: reservation.room.type?.name ?? null },
      payment: reservation.payment
        ? {
            ...reservation.payment,
            paymentMethod: reservation.payment.paymentMethod?.name ?? null,
          }
        : null,
    };
  }

  async create(dto: CreateReservationDto, employeeId: number) {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    if (checkOut <= checkIn) {
      throw new BadRequestException(
        'La fecha de salida debe ser posterior a la de entrada',
      );
    }

    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
    });

    if (!room) {
      throw new NotFoundException(`Habitación ${dto.roomId} no encontrada`);
    }

    await this.assertNoOverlap(dto.roomId, checkIn, checkOut);

    const guest = await this.guests.upsertByNationalId({
      nationalId: dto.nationalId,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
    });

    const created = await this.prisma.reservation.create({
      data: {
        guestId: guest.id,
        checkIn,
        checkOut,
        roomId: dto.roomId,
        // Snapshot del precio: si luego cambia la tarifa del cuarto, esta reserva no se altera
        pricePerNight: room.price,
        createdBy: employeeId,
      },
      include: this.reservationInclude,
    });

    await this.audit.log(
      employeeId,
      'CREATE',
      'Reservation',
      created.id,
      undefined,
      created,
    );

    return this.flattenReservation(created);
  }

  private async assertNoOverlap(
    roomId: number,
    checkIn: Date,
    checkOut: Date,
    excludeReservationId?: number,
  ) {
    const conflicto = await this.prisma.reservation.findFirst({
      where: {
        roomId,
        status: { in: ['PENDING', 'ACTIVE'] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
        ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
      },
      include: { room: { select: { number: true } } },
    });

    if (conflicto) {
      throw new ConflictException(
        `La habitación ${conflicto.room.number} ya está reservada para esas fechas`,
      );
    }
  }

  async findAll(filters: FilterReservationsDto) {
    const where: Prisma.ReservationWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.roomId) {
      where.roomId = Number(filters.roomId);
    }
    if (filters.from) {
      where.checkOut = { gte: new Date(filters.from) };
    }
    if (filters.to) {
      where.checkIn = { lte: new Date(filters.to) };
    }

    const reservations = await this.prisma.reservation.findMany({
      where,
      include: this.reservationInclude,
      orderBy: { checkIn: 'asc' },
    });

    return reservations.map((r) => this.flattenReservation(r));
  }

  async findOne(id: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: this.reservationInclude,
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    return this.flattenReservation(reservation);
  }

  async update(id: number, dto: UpdateReservationDto, employeeId: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    if (reservation.status !== 'PENDING') {
      throw new BadRequestException(
        'Solo se pueden editar reservas pendientes',
      );
    }

    const checkIn = dto.checkIn ? new Date(dto.checkIn) : reservation.checkIn;
    const checkOut = dto.checkOut
      ? new Date(dto.checkOut)
      : reservation.checkOut;

    if (checkOut <= checkIn) {
      throw new BadRequestException(
        'La fecha de salida debe ser posterior a la de entrada',
      );
    }

    const roomId = dto.roomId ?? reservation.roomId;
    const roomChanged =
      dto.roomId !== undefined && dto.roomId !== reservation.roomId;
    const datesChanged =
      dto.checkIn !== undefined || dto.checkOut !== undefined;

    const data: Prisma.ReservationUpdateInput = {};
    if (dto.checkIn !== undefined) data.checkIn = checkIn;
    if (dto.checkOut !== undefined) data.checkOut = checkOut;

    if (dto.nationalId !== undefined && dto.fullName !== undefined) {
      const guest = await this.guests.upsertByNationalId({
        nationalId: dto.nationalId,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
      });
      data.guest = { connect: { id: guest.id } };
    }

    if (roomChanged) {
      const newRoom = await this.prisma.room.findUnique({
        where: { id: dto.roomId },
      });
      if (!newRoom) {
        throw new NotFoundException(`Habitación ${dto.roomId} no encontrada`);
      }
      data.room = { connect: { id: dto.roomId } };
      data.pricePerNight = newRoom.price;
    }

    if (roomChanged || datesChanged) {
      await this.assertNoOverlap(roomId, checkIn, checkOut, id);
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data,
      include: this.reservationInclude,
    });

    await this.audit.log(
      employeeId,
      'UPDATE',
      'Reservation',
      id,
      reservation,
      updated,
    );

    return {
      message: 'Reserva actualizada',
      reservation: this.flattenReservation(updated),
    };
  }

  async cancel(id: number, employeeId: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    if (reservation.status !== 'PENDING') {
      throw new BadRequestException(
        'Solo se pueden cancelar reservas pendientes',
      );
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: this.reservationInclude,
    });

    await this.audit.log(
      employeeId,
      'CANCEL',
      'Reservation',
      id,
      reservation,
    );

    return {
      message: 'Reserva cancelada',
      reservation: this.flattenReservation(updated),
    };
  }

  async updateStatus(id: number, dto: UpdateReservationStatusDto) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status: dto.status },
      include: this.reservationInclude,
    });

    return {
      message: 'Estado de reserva actualizado',
      reservation: this.flattenReservation(updated),
    };
  }

  async checkIn(id: number, employeeId: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { room: { include: { status: true } } },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    if (reservation.status !== 'PENDING') {
      throw new BadRequestException(
        'Solo se puede hacer check-in a reservas pendientes',
      );
    }

    if (reservation.room.status?.name !== 'AVAILABLE') {
      throw new BadRequestException(
        `La habitación ${reservation.room.number} no está disponible`,
      );
    }

    // Actualizamos reserva y habitación de forma atómica
    const [updated] = await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id },
        data: { status: 'ACTIVE', actualCheckIn: new Date() },
        include: this.reservationInclude,
      }),
      this.prisma.room.update({
        where: { id: reservation.roomId },
        data: { status: { connect: { name: 'OCCUPIED' } } },
      }),
    ]);

    await this.audit.log(employeeId, 'CHECKIN', 'Reservation', id);

    return {
      message: 'Check-in realizado',
      reservation: this.flattenReservation(updated),
    };
  }

  async checkOut(id: number, dto: CheckoutReservationDto, employeeId: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    if (reservation.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Solo se puede hacer check-out a reservas activas',
      );
    }

    const discount =
      dto.discountId != null
        ? await this.prisma.discount.findUnique({
            where: { id: dto.discountId },
          })
        : null;

    if (dto.discountId != null) {
      if (!discount) {
        throw new NotFoundException(
          `Descuento ${dto.discountId} no encontrado`,
        );
      }
      if (!discount.isActive) {
        throw new BadRequestException(
          `El descuento "${discount.name}" no está activo`,
        );
      }
    }

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { name: dto.paymentMethod },
    });
    if (!paymentMethod) {
      throw new BadRequestException(
        `Método de pago "${dto.paymentMethod}" no encontrado`,
      );
    }

    // Cálculo del cobro: noches reservadas × tarifa (mínimo 1 noche)
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const nights = Math.max(
      1,
      Math.ceil(
        (reservation.checkOut.getTime() - reservation.checkIn.getTime()) /
          MS_PER_DAY,
      ),
    );
    // pricePerNight se guarda al crear; fallback al precio actual del cuarto por si es null
    const pricePerNight = reservation.pricePerNight ?? reservation.room.price;

    const chargesAgg = await this.prisma.roomCharge.aggregate({
      where: { reservationId: id },
      _sum: { amount: true },
    });

    const roomTotal = new Prisma.Decimal(pricePerNight).mul(nights);
    const chargesTotal = chargesAgg._sum.amount ?? new Prisma.Decimal(0);
    const subtotal = roomTotal.add(chargesTotal);
    const discountAmount = discount
      ? subtotal.mul(discount.percentage).div(100)
      : new Prisma.Decimal(0);
    const grandTotal = subtotal.sub(discountAmount);

    // La habitación pasa a limpieza para entrar a la cola de housekeeping
    const [updated, payment] = await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          actualCheckOut: new Date(),
        },
        include: this.reservationInclude,
      }),
      this.prisma.payment.create({
        data: {
          reservationId: id,
          processedBy: employeeId,
          paymentMethodId: paymentMethod.id,
          discountId: discount?.id ?? null,
          roomTotal,
          chargesTotal,
          subtotal,
          discountAmount,
          grandTotal,
        },
      }),
      this.prisma.room.update({
        where: { id: reservation.roomId },
        data: { status: { connect: { name: 'CLEANING' } } },
      }),
    ]);

    await this.audit.log(employeeId, 'CHECKOUT', 'Reservation', id);

    return {
      message: 'Check-out realizado',
      reservation: this.flattenReservation(updated),
      payment,
    };
  }
}
