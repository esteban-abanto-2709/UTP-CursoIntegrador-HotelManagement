import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { ReservationStatus } from '@prisma/client';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';

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
}
