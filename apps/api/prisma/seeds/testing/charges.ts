import { PrismaClient, Role } from '@prisma/client';
import { createSeedClient } from '../prisma-client';

const CATALOG: { category: string; description: string; amount: number }[] = [
  { category: 'Room Service', description: 'Desayuno a la habitación', amount: 35 },
  { category: 'Room Service', description: 'Cena a la habitación', amount: 60 },
  { category: 'Room Service', description: 'Almuerzo ejecutivo', amount: 45 },
  { category: 'Minibar', description: 'Consumo de minibar', amount: 25 },
  { category: 'Minibar', description: 'Bebidas premium', amount: 40 },
  { category: 'Lavandería', description: 'Lavado de ropa', amount: 18 },
  { category: 'Lavandería', description: 'Servicio de planchado', amount: 12 },
  { category: 'Daños', description: 'Reposición de toallas', amount: 30 },
  { category: 'Daños', description: 'Daño a mobiliario', amount: 120 },
  { category: 'Otros', description: 'Late check-out', amount: 50 },
  { category: 'Otros', description: 'Servicio de transporte', amount: 70 },
];

export async function seedCharges(prisma: PrismaClient) {
  const count = await prisma.roomCharge.count();
  if (count > 0) {
    console.log('Cargos ya sembrados, omitido.');
    return;
  }

  const employee =
    (await prisma.employee.findFirst({ where: { username: 'recepcion1' } })) ??
    (await prisma.employee.findFirst({ where: { role: { not: Role.OWNER } } }));
  if (!employee) {
    console.warn('Cargos omitidos: no hay empleado para registrar.');
    return;
  }

  const categories = await prisma.expenseCategory.findMany();
  const categoryId = new Map(categories.map((c) => [c.name, c.id]));

  const reservations = await prisma.reservation.findMany({
    where: { status: { name: { in: ['ACTIVE', 'COMPLETED'] } } },
    orderBy: { id: 'asc' },
  });

  let created = 0;
  let j = 0;
  for (const reservation of reservations) {
    const howMany = 2 + (j % 3);
    for (let k = 0; k < howMany; k++) {
      const item = CATALOG[(j * 2 + k) % CATALOG.length];
      const catId = categoryId.get(item.category);
      if (!catId) continue;
      await prisma.roomCharge.create({
        data: {
          reservationId: reservation.id,
          categoryId: catId,
          registeredBy: employee.id,
          description: item.description,
          amount: item.amount,
        },
      });
      created++;
    }
    j++;
  }
  console.log(`Cargos sembrados (${created}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedCharges(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
