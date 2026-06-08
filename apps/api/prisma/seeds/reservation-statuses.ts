import { PrismaClient } from '@prisma/client';
import { createSeedClient } from './prisma-client';

const statuses = ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

export async function seedReservationStatuses(prisma: PrismaClient) {
  for (const name of statuses) {
    await prisma.reservationStatus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Estados de reserva sembrados (${statuses.length}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedReservationStatuses(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
