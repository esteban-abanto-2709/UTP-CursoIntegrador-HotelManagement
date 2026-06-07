import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findByReservation(reservationId: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { reservationId },
      include: {
        discount: true,
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(
        `La reserva ${reservationId} no tiene un pago registrado`,
      );
    }

    return payment;
  }
}
