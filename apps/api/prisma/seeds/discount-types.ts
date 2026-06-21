import { PrismaClient } from '@prisma/client';
import { createSeedClient } from './prisma-client';

const types = ['SEASONAL', 'LOYALTY', 'PROMOTIONAL', 'CORPORATE'];

export async function seedDiscountTypes(prisma: PrismaClient) {
  for (const name of types) {
    await prisma.discountType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Tipos de descuento sembrados (${types.length}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedDiscountTypes(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
