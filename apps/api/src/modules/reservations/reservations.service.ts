import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { ReservationStatus } from '@prisma/client';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { CheckoutReservationDto } from './dto/checkout-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReservationDto) {
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

    if (room.status !== 'AVAILABLE') {
      throw new BadRequestException(
        `La habitación ${room.number} no está disponible`,
      );
    }

    return this.prisma.reservation.create({
      data: {
        guestName: dto.guestName,
        dni: dto.dni,
        checkIn,
        checkOut,
        roomId: dto.roomId,
        // Snapshot del precio: si luego cambia la tarifa del cuarto, esta reserva no se altera
        pricePerNight: room.price,
      },
      include: { room: { select: { number: true, type: true } } },
    });
  }

  findAll() {
    return this.prisma.reservation.findMany({
      include: { room: { select: { number: true, type: true } } },
      orderBy: { checkIn: 'asc' },
    });
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
      include: { room: { select: { number: true, type: true } } },
    });

    return { message: 'Estado de reserva actualizado', reservation: updated };
  }

  async checkIn(id: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    if (reservation.status !== 'PENDING') {
      throw new BadRequestException(
        'Solo se puede hacer check-in a reservas pendientes',
      );
    }

    if (reservation.room.status !== 'AVAILABLE') {
      throw new BadRequestException(
        `La habitación ${reservation.room.number} no está disponible`,
      );
    }

    // Actualizamos reserva y habitación de forma atómica
    const [updated] = await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id },
        data: { status: 'ACTIVE', actualCheckIn: new Date() },
        include: { room: { select: { number: true, type: true } } },
      }),
      this.prisma.room.update({
        where: { id: reservation.roomId },
        data: { status: 'OCCUPIED' },
      }),
    ]);

    return { message: 'Check-in realizado', reservation: updated };
  }

  async checkOut(id: number, dto: CheckoutReservationDto) {
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
    const pricePerNight =
      reservation.pricePerNight ?? reservation.room.price;
    const totalAmount = Number(pricePerNight) * nights;

    // La habitación pasa a limpieza para entrar a la cola de housekeeping
    const [updated] = await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          actualCheckOut: new Date(),
          totalAmount,
          paymentMethod: dto.paymentMethod,
          paidAt: new Date(),
        },
        include: { room: { select: { number: true, type: true } } },
      }),
      this.prisma.room.update({
        where: { id: reservation.roomId },
        data: { status: 'CLEANING' },
      }),
    ]);

    return {
      message: 'Check-out realizado',
      reservation: updated,
      billing: { nights, pricePerNight: Number(pricePerNight), totalAmount },
    };
  }
}
