import { PrismaClient } from '@prisma/client';
import { createSeedClient } from './prisma-client';

const positions = ['Manager', 'Recepcionista', 'Botones', 'Limpieza'];

export async function seedJobPositions(prisma: PrismaClient) {
  for (const name of positions) {
    await prisma.jobPosition.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Puestos de trabajo sembrados (${positions.length}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedJobPositions(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
