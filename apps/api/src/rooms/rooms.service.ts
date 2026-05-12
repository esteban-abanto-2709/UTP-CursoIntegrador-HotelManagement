import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../providers/prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoomDto: CreateRoomDto) {
    // 1. Verify if the room number already exists
    const existingRoom = await this.prisma.room.findUnique({
      where: { number: createRoomDto.number },
    });

    if (existingRoom) {
      throw new ConflictException(
        `La habitación con el número ${createRoomDto.number} ya existe`,
      );
    }

    // 2. Create the room (status is automatically set to AVAILABLE by Prisma default)
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
    // Return all rooms ordered by number
    return this.prisma.room.findMany({
      orderBy: { number: 'asc' },
    });
  }
}
