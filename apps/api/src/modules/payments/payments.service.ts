import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findByReservation(reservationId: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { reservationId },
      include: {
        paymentDiscounts: {
          include: { discount: { select: { name: true } } },
          orderBy: { id: 'asc' },
        },
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

    let running = payment.subtotal;
    const discounts = payment.paymentDiscounts.map((pd) => {
      const amount = running.mul(pd.percentage).div(100);
      running = running.sub(amount);
      return {
        name: pd.discount.name,
        percentage: pd.percentage,
        amount,
      };
    });

    const { paymentDiscounts: _paymentDiscounts, ...rest } = payment;
    return { ...rest, discounts };
  }
}
