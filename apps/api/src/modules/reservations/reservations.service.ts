import {
  Injectable,
  Logger,
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
import { PaymentsService } from '../payments/payments.service';
import { RoomChargesService } from '../room-charges/room-charges.service';
import { MailService } from '../mail/mail.service';
import { buildComprobantePdf, type ComprobanteData } from '../pdf/comprobante-pdf';
import { EMPRESA } from '../pdf/format';
import { cursorArgs, buildPage } from '@/common/pagination/paginate';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private prisma: PrismaService,
    private guests: GuestsService,
    private audit: AuditService,
    private payments: PaymentsService,
    private roomCharges: RoomChargesService,
    private mail: MailService,
  ) {}

  private readonly reservationInclude = {
    room: { select: { number: true, type: { select: { name: true } } } },
    status: { select: { name: true } },
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
  } satisfies Prisma.ReservationInclude;

  private buildOrderBy(
    sort?: string,
  ): Prisma.ReservationOrderByWithRelationInput[] {
    switch (sort) {
      case 'checkin_desc':
        return [{ checkIn: 'desc' }, { id: 'desc' }];
      case 'checkout_asc':
        return [{ checkOut: 'asc' }, { id: 'asc' }];
      case 'recent':
        return [{ id: 'desc' }];
      case 'guest_asc':
        return [{ guest: { fullName: 'asc' } }, { id: 'asc' }];
      case 'checkin_asc':
      default:
        return [{ checkIn: 'asc' }, { id: 'asc' }];
    }
  }

  private calcNights(checkIn: Date, checkOut: Date) {
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    return Math.max(
      1,
      Math.ceil((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY),
    );
  }

  private flattenReservation<
    R extends {
      room: { type: { name: string } | null };
      status: { name: string } | null;
      payment: { paymentMethod: { name: string } | null } | null;
    },
  >(reservation: R) {
    return {
      ...reservation,
      room: { ...reservation.room, type: reservation.room.type?.name ?? null },
      status: reservation.status?.name ?? null,
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
        guest: { connect: { id: guest.id } },
        checkIn,
        checkOut,
        room: { connect: { id: dto.roomId } },
        status: { connect: { name: 'PENDING' } },
        rateSnapshot: room.price,
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
        status: { name: { in: ['PENDING', 'ACTIVE'] } },
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
      where.status = { name: filters.status };
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
    if (filters.search) {
      where.guest = {
        OR: [
          { fullName: { contains: filters.search, mode: 'insensitive' } },
          { nationalId: { contains: filters.search } },
        ],
      };
    }

    const [rows, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        include: this.reservationInclude,
        orderBy: this.buildOrderBy(filters.sort),
        ...cursorArgs(filters),
      }),
      this.prisma.reservation.count({ where }),
    ]);

    const page = buildPage(rows, filters);
    return {
      data: page.data.map((r) => this.flattenReservation(r)),
      total,
      nextCursor: page.nextCursor,
      hasNext: page.hasNext,
    };
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
      include: { status: true },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    if (reservation.status?.name !== 'PENDING') {
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
      data.rateSnapshot = newRoom.price;
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
      include: { status: true },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    if (reservation.status?.name !== 'PENDING') {
      throw new BadRequestException(
        'Solo se pueden cancelar reservas pendientes',
      );
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status: { connect: { name: 'CANCELLED' } } },
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
      data: { status: { connect: { name: dto.status } } },
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
      include: { status: true, room: { include: { status: true } } },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    if (reservation.status?.name !== 'PENDING') {
      throw new BadRequestException(
        'Solo se puede hacer check-in a reservas pendientes',
      );
    }

    if (reservation.room.status?.name !== 'AVAILABLE') {
      throw new BadRequestException(
        `La habitación ${reservation.room.number} no está disponible`,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id },
        data: {
          status: { connect: { name: 'ACTIVE' } },
          actualCheckIn: new Date(),
        },
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
      include: { status: true, room: true },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    if (reservation.status?.name !== 'ACTIVE') {
      throw new BadRequestException(
        'Solo se puede hacer check-out a reservas activas',
      );
    }

    const requestedIds = [...new Set(dto.discountIds ?? [])];

    const discounts = requestedIds.length
      ? await this.prisma.discount.findMany({
          where: { id: { in: requestedIds } },
        })
      : [];

    const foundIds = new Set(discounts.map((d) => d.id));
    for (const discountId of requestedIds) {
      if (!foundIds.has(discountId)) {
        throw new NotFoundException(`Descuento ${discountId} no encontrado`);
      }
    }
    for (const discount of discounts) {
      if (!discount.isActive) {
        throw new BadRequestException(
          `El descuento "${discount.name}" no está activo`,
        );
      }
    }

    discounts.sort((a, b) => a.id - b.id);

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { name: dto.paymentMethod },
    });
    if (!paymentMethod) {
      throw new BadRequestException(
        `Método de pago "${dto.paymentMethod}" no encontrado`,
      );
    }

    const nights = this.calcNights(reservation.checkIn, reservation.checkOut);
    const rate = reservation.rateSnapshot ?? reservation.room.price;

    const chargesAgg = await this.prisma.roomCharge.aggregate({
      where: { reservationId: id },
      _sum: { amount: true },
    });

    const roomTotal = new Prisma.Decimal(rate).mul(nights);
    const chargesTotal = chargesAgg._sum.amount ?? new Prisma.Decimal(0);
    const subtotal = roomTotal.add(chargesTotal);

    let running = subtotal;
    for (const discount of discounts) {
      running = running.sub(running.mul(discount.percentage).div(100));
    }
    const discountAmount = subtotal.sub(running);
    const grandTotal = running;

    const { updated, payment } = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id },
        data: {
          status: { connect: { name: 'COMPLETED' } },
          actualCheckOut: new Date(),
        },
        include: this.reservationInclude,
      });
      const payment = await tx.payment.create({
        data: {
          reservationId: id,
          processedBy: employeeId,
          paymentMethodId: paymentMethod.id,
          roomTotal,
          chargesTotal,
          subtotal,
          discountAmount,
          grandTotal,
        },
      });
      if (discounts.length) {
        await tx.paymentDiscount.createMany({
          data: discounts.map((discount) => ({
            paymentId: payment.id,
            discountId: discount.id,
            percentage: discount.percentage,
          })),
        });
      }
      await tx.room.update({
        where: { id: reservation.roomId },
        data: { status: { connect: { name: 'CLEANING' } } },
      });
      return { updated, payment };
    });

    await this.audit.log(employeeId, 'CHECKOUT', 'Reservation', id);

    await this.sendComprobanteEmail(id, updated.guest);

    return {
      message: 'Check-out realizado',
      reservation: this.flattenReservation(updated),
      payment,
    };
  }

  // El correo es best-effort: si el huésped no tiene email o el SMTP falla,
  // el check-out ya está confirmado y no debe romperse por esto.
  private async sendComprobanteEmail(
    reservationId: number,
    guest: { email: string | null; fullName: string },
  ) {
    if (!guest.email) return;
    try {
      const { filename, buffer } = await this.comprobantePdf(reservationId);
      await this.mail.sendReceipt({
        to: guest.email,
        guestName: guest.fullName,
        filename,
        pdf: buffer,
      });
    } catch (err) {
      this.logger.error(
        `No se pudo enviar el comprobante de la reserva ${reservationId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  async comprobantePdf(id: number): Promise<{ filename: string; buffer: Buffer }> {
    const reservation = await this.findOne(id);
    const payment = await this.payments.findByReservation(id);
    const charges = await this.roomCharges.findByReservation(id);

    const data: ComprobanteData = {
      paymentId: payment.id,
      processedAt: payment.processedAt,
      paymentMethod: reservation.payment?.paymentMethod ?? '',
      guest: reservation.guest,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      room: { number: reservation.room.number, type: reservation.room.type ?? '' },
      rateSnapshot: Number(reservation.rateSnapshot ?? 0),
      roomTotal: Number(payment.roomTotal),
      subtotal: Number(payment.subtotal),
      grandTotal: Number(payment.grandTotal),
      employee: {
        firstName: payment.employee.firstName ?? '',
        lastName: payment.employee.lastName ?? '',
      },
      discounts: payment.discounts.map((d) => ({
        name: d.name,
        percentage: Number(d.percentage),
        amount: Number(d.amount),
      })),
      charges: charges.map((c) => ({
        description: c.description,
        amount: Number(c.amount),
        category: c.category.name,
      })),
    };

    const buffer = await buildComprobantePdf(data);
    const folio = `${EMPRESA.serie}-${String(payment.id).padStart(7, '0')}`;
    const filename = `Comprobante ${folio} - ${reservation.guest.fullName}.pdf`;
    return { filename, buffer };
  }
}
