import { createSeedClient } from './seeds/prisma-client';
import { seedOwner } from './seeds/owner';
import { seedCategories } from './seeds/categories';
import { seedDiscounts } from './seeds/discounts';
import { seedAuditActions } from './seeds/audit-actions';
import { seedJobPositions } from './seeds/job-positions';
import { seedShifts } from './seeds/shifts';
import { seedPaymentMethods } from './seeds/payment-methods';
import { seedRoomTypes } from './seeds/room-types';
import { seedRoomStatuses } from './seeds/room-statuses';

async function main() {
  const prisma = createSeedClient();
  try {
    await seedOwner(prisma);
    await seedCategories(prisma);
    await seedDiscounts(prisma);
    await seedAuditActions(prisma);
    await seedJobPositions(prisma);
    await seedShifts(prisma);
    await seedPaymentMethods(prisma);
    await seedRoomTypes(prisma);
    await seedRoomStatuses(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
