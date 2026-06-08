import { PrismaClient, Role } from '@prisma/client';
import { createSeedClient } from '../prisma-client';

const MS_PER_NIGHT = 1000 * 60 * 60 * 24;

export async function seedPayments(prisma: PrismaClient) {
  const count = await prisma.payment.count();
  if (count > 0) {
    console.log('Pagos ya sembrados, omitido.');
    return;
  }

  const employee =
    (await prisma.employee.findFirst({ where: { username: 'recepcion1' } })) ??
    (await prisma.employee.findFirst({ where: { role: { not: Role.OWNER } } }));
  if (!employee) {
    console.warn('Pagos omitidos: no hay empleado para procesar.');
    return;
  }

  const discount = await prisma.discount.findFirst({
    where: { name: 'Cliente frecuente', isActive: true },
  });

  const cash = await prisma.paymentMethod.findUnique({
    where: { name: 'CASH' },
  });
  if (!cash) {
    console.warn('Pagos omitidos: falta el método de pago CASH (corre el seed).');
    return;
  }

  const reservations = await prisma.reservation.findMany({
    where: { status: { name: 'COMPLETED' } },
    include: { charges: true },
  });

  let created = 0;
  for (const reservation of reservations) {
    const nights = Math.max(
      1,
      Math.round((reservation.checkOut.getTime() - reservation.checkIn.getTime()) / MS_PER_NIGHT),
    );
    const rate = Number(reservation.rateSnapshot ?? 0);
    const roomTotal = rate * nights;
    const chargesTotal = reservation.charges.reduce((sum, c) => sum + Number(c.amount), 0);
    const subtotal = roomTotal + chargesTotal;
    const discountPct = discount ? Number(discount.percentage) : 0;
    const discountAmount = Number(((subtotal * discountPct) / 100).toFixed(2));
    const grandTotal = Number((subtotal - discountAmount).toFixed(2));

    await prisma.payment.create({
      data: {
        reservationId: reservation.id,
        processedBy: employee.id,
        paymentMethodId: cash.id,
        discountId: discount?.id ?? null,
        roomTotal,
        chargesTotal,
        subtotal,
        discountAmount,
        grandTotal,
      },
    });
    created++;
  }
  console.log(`Pagos sembrados (${created}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedPayments(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
