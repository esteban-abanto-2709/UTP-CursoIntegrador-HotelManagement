import { PrismaClient, Role } from '@prisma/client';
import { createSeedClient } from '../prisma-client';

const MS_PER_NIGHT = 1000 * 60 * 60 * 24;

export async function seedPayments(prisma: PrismaClient) {
  const count = await prisma.payment.count();
  if (count > 0) {
    console.log('Pagos ya sembrados, omitido.');
    return;
  }

  const employees = await prisma.employee.findMany({
    where: { role: { not: Role.OWNER } },
    orderBy: { id: 'asc' },
  });
  if (employees.length === 0) {
    console.warn('Pagos omitidos: no hay empleados para procesar.');
    return;
  }

  const activeDiscounts = await prisma.discount.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
  });

  const methods = await prisma.paymentMethod.findMany({ orderBy: { id: 'asc' } });
  if (methods.length === 0) {
    console.warn('Pagos omitidos: faltan métodos de pago (corre el seed).');
    return;
  }

  const reservations = await prisma.reservation.findMany({
    where: { status: { name: 'COMPLETED' } },
    include: { charges: true },
    orderBy: { id: 'asc' },
  });

  let created = 0;
  let i = 0;
  for (const reservation of reservations) {
    const nights = Math.max(
      1,
      Math.round((reservation.checkOut.getTime() - reservation.checkIn.getTime()) / MS_PER_NIGHT),
    );
    const rate = Number(reservation.rateSnapshot ?? 0);
    const roomTotal = rate * nights;
    const chargesTotal = reservation.charges.reduce((sum, c) => sum + Number(c.amount), 0);
    const subtotal = roomTotal + chargesTotal;

    const wanted = activeDiscounts.length === 0 ? 0 : i % 3;
    const picked: typeof activeDiscounts = [];
    for (let k = 0; k < wanted; k++) {
      const candidate = activeDiscounts[(i + k) % activeDiscounts.length];
      if (!picked.some((d) => d.id === candidate.id)) {
        picked.push(candidate);
      }
    }
    picked.sort((a, b) => a.id - b.id);

    let running = subtotal;
    for (const d of picked) {
      running -= (running * Number(d.percentage)) / 100;
    }
    const discountAmount = Number((subtotal - running).toFixed(2));
    const grandTotal = Number(running.toFixed(2));
    const method = methods[i % methods.length];
    const employee = employees[i % employees.length];

    await prisma.payment.create({
      data: {
        reservationId: reservation.id,
        processedBy: employee.id,
        processedAt: reservation.actualCheckOut ?? reservation.checkOut,
        paymentMethodId: method.id,
        roomTotal,
        chargesTotal,
        subtotal,
        discountAmount,
        grandTotal,
        paymentDiscounts: {
          create: picked.map((d) => ({
            discountId: d.id,
            percentage: d.percentage,
          })),
        },
      },
    });
    created++;
    i++;
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
