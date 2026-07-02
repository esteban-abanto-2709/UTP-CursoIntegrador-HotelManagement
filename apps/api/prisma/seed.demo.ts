import { createSeedClient } from './seeds/prisma-client';
import { seedRooms } from './seeds/testing/rooms';
import { seedGuests } from './seeds/testing/guests';
import { seedStaff } from './seeds/testing/staff';
import { seedReservations } from './seeds/testing/reservations';
import { seedCharges } from './seeds/testing/charges';
import { seedPayments } from './seeds/testing/payments';
import { seedAuditLogs } from './seeds/testing/audit-logs';

async function main() {
  const prisma = createSeedClient();
  try {
    await seedRooms(prisma);
    await seedGuests(prisma);
    await seedStaff(prisma);
    await seedReservations(prisma);
    await seedCharges(prisma);
    await seedPayments(prisma);
    await seedAuditLogs(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
