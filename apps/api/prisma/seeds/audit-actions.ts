import { PrismaClient } from '@prisma/client';
import { createSeedClient } from './prisma-client';

const actions = ['CREATE', 'UPDATE', 'DELETE', 'CHECKIN', 'CHECKOUT', 'CANCEL'];

export async function seedAuditActions(prisma: PrismaClient) {
  for (const name of actions) {
    await prisma.auditAction.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Acciones de auditoría sembradas (${actions.length}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedAuditActions(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
