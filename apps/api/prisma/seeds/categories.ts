import { PrismaClient } from '@prisma/client';
import { createSeedClient } from './prisma-client';

const categories = ['Room Service', 'Minibar', 'Lavandería', 'Daños', 'Otros'];

export async function seedCategories(prisma: PrismaClient) {
  for (const name of categories) {
    await prisma.expenseCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Categorías de gasto sembradas (${categories.length}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedCategories(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
