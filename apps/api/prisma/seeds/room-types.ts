import { PrismaClient } from '@prisma/client';
import { createSeedClient } from './prisma-client';

const types = ['SINGLE', 'DOUBLE', 'SUITE'];

export async function seedRoomTypes(prisma: PrismaClient) {
  for (const name of types) {
    await prisma.roomType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Tipos de habitación sembrados (${types.length}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedRoomTypes(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
