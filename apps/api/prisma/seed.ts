import { createSeedClient } from './seeds/prisma-client';
import { seedOwner } from './seeds/owner';
import { seedCategories } from './seeds/categories';
import { seedDiscounts } from './seeds/discounts';
import { seedAuditActions } from './seeds/audit-actions';

async function main() {
  const prisma = createSeedClient();
  try {
    await seedOwner(prisma);
    await seedCategories(prisma);
    await seedDiscounts(prisma);
    await seedAuditActions(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
