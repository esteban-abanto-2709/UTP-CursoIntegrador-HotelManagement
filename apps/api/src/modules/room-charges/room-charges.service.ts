import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateRoomChargeDto } from './dto/create-room-charge.dto';

@Injectable()
export class RoomChargesService {
  constructor(private prisma: PrismaService) {}

  async create(
    reservationId: number,
    dto: CreateRoomChargeDto,
    employeeId: number,
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { status: true },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${reservationId} no encontrada`);
    }

    if (reservation.status?.name !== 'ACTIVE') {
      throw new BadRequestException(
        'Solo se pueden agregar cargos a reservas activas',
      );
    }

    const category = await this.prisma.expenseCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Categoría ${dto.categoryId} no encontrada`);
    }

    return this.prisma.roomCharge.create({
      data: {
        reservationId,
        categoryId: dto.categoryId,
        registeredBy: employeeId,
        description: dto.description,
        amount: dto.amount,
      },
      include: { category: true },
    });
  }

  async findByReservation(reservationId: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${reservationId} no encontrada`);
    }

    return this.prisma.roomCharge.findMany({
      where: { reservationId },
      include: { category: true },
      orderBy: { chargedAt: 'desc' },
    });
  }

  findAllCategories() {
    return this.prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
