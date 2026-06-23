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
import { FindRoomsDto } from './dto/find-rooms.dto';
import { AuditService } from '../modules/audit/audit.service';
import { cursorArgs, buildPage } from '@/common/pagination/paginate';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) { }

  private readonly roomInclude = {
    type: { select: { name: true } },
    status: { select: { name: true } },
  } satisfies Prisma.RoomInclude;

  private flattenRoom<
    R extends {
      type: { name: string } | null;
      status: { name: string } | null;
    },
  >(room: R) {
    return {
      ...room,
      type: room.type?.name ?? null,
      status: room.status?.name ?? null,
    };
  }

  async create(createRoomDto: CreateRoomDto, employeeId: number) {
    const existingRoom = await this.prisma.room.findUnique({
      where: { number: createRoomDto.number },
    });

    if (existingRoom) {
      throw new ConflictException(
        `La habitación con el número ${createRoomDto.number} ya existe`,
      );
    }

    const newRoom = this.flattenRoom(
      await this.prisma.room.create({
        data: {
          number: createRoomDto.number,
          type: { connect: { name: createRoomDto.type } },
          status: { connect: { name: 'AVAILABLE' } },
          price: createRoomDto.price,
        },
        include: this.roomInclude,
      }),
    );

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

  async findAll(filters: FindRoomsDto) {
    const where: Prisma.RoomWhereInput = {};

    if (filters.type) {
      where.type = { name: filters.type };
    }
    if (filters.status) {
      where.status = { name: filters.status };
    }
    if (filters.search) {
      where.number = { contains: filters.search, mode: 'insensitive' };
    }

    const [rows, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        include: this.roomInclude,
        orderBy: [{ number: 'asc' }, { id: 'asc' }],
        ...cursorArgs(filters),
      }),
      this.prisma.room.count({ where }),
    ]);

    const page = buildPage(rows, filters);
    return {
      data: page.data.map((room) => this.flattenRoom(room)),
      total,
      nextCursor: page.nextCursor,
      hasNext: page.hasNext,
    };
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
      status: { name: { in: ['PENDING', 'ACTIVE'] } },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    };

    if (query.excludeReservationId) {
      overlap.id = { not: Number(query.excludeReservationId) };
    }

    const rooms = await this.prisma.room.findMany({
      where: {
        type: { name: query.type },
        status: { name: { not: 'MAINTENANCE' } },
        reservations: { none: overlap },
      },
      include: this.roomInclude,
      orderBy: { number: 'asc' },
    });
    return rooms.map((room) => this.flattenRoom(room));
  }

  async updateStatus(
    id: number,
    updateRoomStatusDto: UpdateRoomStatusDto,
    employeeId: number,
  ) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: this.roomInclude,
    });

    if (!room) {
      throw new NotFoundException(`No existe una habitación con el ID ${id}`);
    }

    const previousStatus = room.status?.name ?? null;

    const updated = this.flattenRoom(
      await this.prisma.room.update({
        where: { id },
        data: { status: { connect: { name: updateRoomStatusDto.status } } },
        include: this.roomInclude,
      }),
    );

    await this.audit.log(
      employeeId,
      'UPDATE',
      'Room',
      id,
      { status: previousStatus },
      { status: updated.status },
    );

    return {
      message: `Estado de habitación ${updated.number} actualizado a ${updated.status}`,
      room: updated,
    };
  }

  async update(id: number, updateRoomDto: UpdateRoomDto, employeeId: number) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: this.roomInclude,
    });

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

    const data: Prisma.RoomUpdateInput = {
      number: updateRoomDto.number,
      price: updateRoomDto.price,
    };
    if (updateRoomDto.type) {
      data.type = { connect: { name: updateRoomDto.type } };
    }

    const updated = this.flattenRoom(
      await this.prisma.room.update({
        where: { id },
        data,
        include: this.roomInclude,
      }),
    );

    await this.audit.log(
      employeeId,
      'UPDATE',
      'Room',
      id,
      this.flattenRoom(room),
      updated,
    );

    return {
      message: 'Habitación actualizada exitosamente',
      room: updated,
    };
  }
}
