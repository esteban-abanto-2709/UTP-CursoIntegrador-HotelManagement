import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../providers/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomStatusDto } from './dto/update-room-status.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { AuditService } from '../modules/audit/audit.service';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) { }

  async create(createRoomDto: CreateRoomDto, employeeId: number) {
    const existingRoom = await this.prisma.room.findUnique({
      where: { number: createRoomDto.number },
    });

    if (existingRoom) {
      throw new ConflictException(
        `La habitación con el número ${createRoomDto.number} ya existe`,
      );
    }

    const newRoom = await this.prisma.room.create({
      data: {
        number: createRoomDto.number,
        type: createRoomDto.type,
        price: createRoomDto.price,
      },
    });

    await this.audit.log(
      employeeId,
      'CREATE',
      'Room',
      newRoom.id,
      undefined,
      newRoom,
    );

    return {
      message: 'Habitación creada exitosamente',
      room: newRoom,
    };
  }

  async findAll() {
    return this.prisma.room.findMany({
      orderBy: { number: 'asc' },
    });
  }

  async findAvailable(query: AvailabilityQueryDto) {
    const checkIn = new Date(query.checkIn);
    const checkOut = new Date(query.checkOut);

    if (checkOut <= checkIn) {
      throw new BadRequestException(
        'La fecha de salida debe ser posterior a la de entrada',
      );
    }

    const overlap: Prisma.ReservationWhereInput = {
      status: { in: ['PENDING', 'ACTIVE'] },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    };

    if (query.excludeReservationId) {
      overlap.id = { not: Number(query.excludeReservationId) };
    }

    return this.prisma.room.findMany({
      where: {
        type: query.type,
        status: { not: 'MAINTENANCE' },
        reservations: { none: overlap },
      },
      orderBy: { number: 'asc' },
    });
  }

  async updateStatus(
    id: number,
    updateRoomStatusDto: UpdateRoomStatusDto,
    employeeId: number,
  ) {
    const room = await this.prisma.room.findUnique({ where: { id } });

    if (!room) {
      throw new NotFoundException(`No existe una habitación con el ID ${id}`);
    }

    const updated = await this.prisma.room.update({
      where: { id },
      data: { status: updateRoomStatusDto.status },
    });

    await this.audit.log(
      employeeId,
      'UPDATE',
      'Room',
      id,
      { status: room.status },
      { status: updated.status },
    );

    return {
      message: `Estado de habitación ${updated.number} actualizado a ${updated.status}`,
      room: updated,
    };
  }

  async update(id: number, updateRoomDto: UpdateRoomDto, employeeId: number) {
    const room = await this.prisma.room.findUnique({ where: { id } });

    if (!room) {
      throw new NotFoundException(`No existe una habitación con el ID ${id}`);
    }

    // Si se cambia el número, validar que no choque con otra habitación
    if (updateRoomDto.number && updateRoomDto.number !== room.number) {
      const existing = await this.prisma.room.findUnique({
        where: { number: updateRoomDto.number },
      });
      if (existing) {
        throw new ConflictException(
          `La habitación con el número ${updateRoomDto.number} ya existe`,
        );
      }
    }

    const updated = await this.prisma.room.update({
      where: { id },
      data: {
        number: updateRoomDto.number,
        type: updateRoomDto.type,
        price: updateRoomDto.price,
      },
    });

    await this.audit.log(employeeId, 'UPDATE', 'Room', id, room, updated);

    return {
      message: 'Habitación actualizada exitosamente',
      room: updated,
    };
  }
}
