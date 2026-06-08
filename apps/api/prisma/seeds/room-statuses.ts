import { PrismaClient } from '@prisma/client';
import { createSeedClient } from './prisma-client';

const statuses = ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'];

export async function seedRoomStatuses(prisma: PrismaClient) {
  for (const name of statuses) {
    await prisma.roomStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Estados de habitación sembrados (${statuses.length}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedRoomStatuses(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
