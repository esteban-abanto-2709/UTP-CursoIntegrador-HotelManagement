import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../providers/prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomStatusDto } from './dto/update-room-status.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createRoomDto: CreateRoomDto) {
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
      },
    });

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

  async updateStatus(id: number, updateRoomStatusDto: UpdateRoomStatusDto) {
    const room = await this.prisma.room.findUnique({ where: { id } });

    if (!room) {
      throw new NotFoundException(`No existe una habitación con el ID ${id}`);
    }

    const updated = await this.prisma.room.update({
      where: { id },
      data: { status: updateRoomStatusDto.status },
    });

    return {
      message: `Estado de habitación ${updated.number} actualizado a ${updated.status}`,
      room: updated,
    };
  }
}
