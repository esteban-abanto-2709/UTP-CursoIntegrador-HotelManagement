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

@Injectable()
export class GuestsService {
  constructor(private prisma: PrismaService) {}

  findAll(filters: FindGuestsDto) {
    const where: Prisma.GuestWhereInput = {};

    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { nationalId: { contains: filters.search } },
      ];
    }

    return this.prisma.guest.findMany({
      where,
      include: { _count: { select: { reservations: true } } },
      orderBy: { registeredAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const guest = await this.prisma.guest.findUnique({
      where: { id },
      include: {
        reservations: {
          include: { room: { select: { number: true, type: true } } },
          orderBy: { checkIn: 'desc' },
        },
      },
    });

    if (!guest) {
      throw new NotFoundException(`Huésped ${id} no encontrado`);
    }

    return guest;
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
