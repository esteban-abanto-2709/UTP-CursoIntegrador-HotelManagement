import { createSeedClient } from './seeds/prisma-client';
import { seedDiscounts } from './seeds/discounts';

async function main() {
  const prisma = createSeedClient();
  try {
    await seedDiscounts(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
