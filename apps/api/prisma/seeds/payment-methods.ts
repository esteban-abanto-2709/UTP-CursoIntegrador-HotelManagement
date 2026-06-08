import { PrismaClient } from '@prisma/client';
import { createSeedClient } from './prisma-client';

const methods = ['CASH', 'CARD', 'TRANSFER'];

export async function seedPaymentMethods(prisma: PrismaClient) {
  for (const name of methods) {
    await prisma.paymentMethod.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Métodos de pago sembrados (${methods.length}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedPaymentMethods(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
