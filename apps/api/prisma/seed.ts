import { createSeedClient } from './seeds/prisma-client';
import { seedOwner } from './seeds/owner';
import { seedCategories } from './seeds/categories';
import { seedDiscounts } from './seeds/discounts';
import { seedAuditActions } from './seeds/audit-actions';
import { seedJobPositions } from './seeds/job-positions';

async function main() {
  const prisma = createSeedClient();
  try {
    await seedOwner(prisma);
    await seedCategories(prisma);
    await seedDiscounts(prisma);
    await seedAuditActions(prisma);
    await seedJobPositions(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
