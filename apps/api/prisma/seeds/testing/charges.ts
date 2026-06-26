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

  const employees = await prisma.employee.findMany({
    where: { role: { not: Role.OWNER } },
    orderBy: { id: 'asc' },
  });
  if (employees.length === 0) {
    console.warn('Cargos omitidos: no hay empleados para registrar.');
    return;
  }

  // Lista ponderada: los primeros empleados registran más cargos
  // → ranking de "Empleados destacados" con líder claro y cola descendente.
  const roster: number[] = [];
  employees.forEach((e, idx) => {
    const times = Math.max(1, employees.length - idx);
    for (let t = 0; t < times; t++) roster.push(e.id);
  });
  let chargeCursor = 0;
  const nextEmployee = () => roster[chargeCursor++ % roster.length];

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
          registeredBy: nextEmployee(),
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
