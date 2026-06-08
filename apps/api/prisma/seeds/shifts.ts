import { PrismaClient } from '@prisma/client';
import { createSeedClient } from './prisma-client';

const shifts = ['MORNING', 'AFTERNOON', 'NIGHT'];

export async function seedShifts(prisma: PrismaClient) {
  for (const name of shifts) {
    await prisma.shift.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Turnos sembrados (${shifts.length}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedShifts(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
