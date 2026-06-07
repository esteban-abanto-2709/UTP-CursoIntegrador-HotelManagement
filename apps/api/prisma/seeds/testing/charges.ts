import { PrismaClient, Role } from '@prisma/client';
import { createSeedClient } from '../prisma-client';

const chargeSpecs = [
  { roomNumber: '202', category: 'Minibar', description: 'Consumo de minibar', amount: 25 },
  { roomNumber: '202', category: 'Room Service', description: 'Cena a la habitación', amount: 60 },
  { roomNumber: '101', category: 'Lavandería', description: 'Lavado de ropa', amount: 18 },
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

  let created = 0;
  for (const spec of chargeSpecs) {
    const room = await prisma.room.findUnique({ where: { number: spec.roomNumber } });
    if (!room) continue;
    const reservation = await prisma.reservation.findFirst({ where: { roomId: room.id } });
    const category = await prisma.expenseCategory.findUnique({ where: { name: spec.category } });
    if (!reservation || !category) {
      console.warn(`Cargo omitido: falta reserva (room ${spec.roomNumber}) o categoría ${spec.category}.`);
      continue;
    }
    await prisma.roomCharge.create({
      data: {
        reservationId: reservation.id,
        categoryId: category.id,
        registeredBy: employee.id,
        description: spec.description,
        amount: spec.amount,
      },
    });
    created++;
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
