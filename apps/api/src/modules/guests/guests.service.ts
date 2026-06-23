import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { FindGuestsDto } from './dto/find-guests.dto';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { cursorArgs, buildPage } from '@/common/pagination/paginate';

@Injectable()
export class GuestsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: FindGuestsDto) {
    const where: Prisma.GuestWhereInput = {};

    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { nationalId: { contains: filters.search } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.guest.findMany({
        where,
        include: { _count: { select: { reservations: true } } },
        orderBy: [{ registeredAt: 'desc' }, { id: 'desc' }],
        ...cursorArgs(filters),
      }),
      this.prisma.guest.count({ where }),
    ]);

    const page = buildPage(rows, filters);
    return {
      data: page.data,
      total,
      nextCursor: page.nextCursor,
      hasNext: page.hasNext,
    };
  }

  async findOne(id: number) {
    const guest = await this.prisma.guest.findUnique({
      where: { id },
      include: {
        reservations: {
          include: {
            room: {
              select: { number: true, type: { select: { name: true } } },
            },
            status: { select: { name: true } },
          },
          orderBy: { checkIn: 'desc' },
        },
      },
    });

    if (!guest) {
      throw new NotFoundException(`Huésped ${id} no encontrado`);
    }

    return {
      ...guest,
      reservations: guest.reservations.map((reservation) => ({
        ...reservation,
        status: reservation.status?.name ?? null,
        room: {
          ...reservation.room,
          type: reservation.room.type?.name ?? null,
        },
      })),
    };
  }

  async create(dto: CreateGuestDto) {
    try {
      return await this.prisma.guest.create({ data: dto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un huésped con ese DNI');
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateGuestDto) {
    const guest = await this.prisma.guest.findUnique({ where: { id } });

    if (!guest) {
      throw new NotFoundException(`Huésped ${id} no encontrado`);
    }

    try {
      return await this.prisma.guest.update({ where: { id }, data: dto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un huésped con ese DNI');
      }
      throw error;
    }
  }

  upsertByNationalId(data: {
    nationalId: string;
    fullName: string;
    email?: string;
    phone?: string;
  }) {
    return this.prisma.guest.upsert({
      where: { nationalId: data.nationalId },
      create: data,
      update: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      },
    });
  }
}
