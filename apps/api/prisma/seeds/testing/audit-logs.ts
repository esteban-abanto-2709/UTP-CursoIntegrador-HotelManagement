import { PrismaClient, Role } from '@prisma/client';
import { createSeedClient } from '../prisma-client';

type Entry = { action: string; table: string; minutesAgo: number };

// Feed de "Actividad reciente": acciones típicas de recepción/administración,
// espaciadas de forma irregular en las últimas ~2 días desde el reloj real.
const FEED: Entry[] = [
  { action: 'CHECKIN', table: 'Reservation', minutesAgo: 7 },
  { action: 'CHECKOUT', table: 'Reservation', minutesAgo: 34 },
  { action: 'CREATE', table: 'Reservation', minutesAgo: 92 },
  { action: 'UPDATE', table: 'Room', minutesAgo: 158 },
  { action: 'CHECKIN', table: 'Reservation', minutesAgo: 240 },
  { action: 'CANCEL', table: 'Reservation', minutesAgo: 415 },
  { action: 'UPDATE', table: 'Reservation', minutesAgo: 605 },
  { action: 'CREATE', table: 'Employee', minutesAgo: 880 },
  { action: 'CHECKOUT', table: 'Reservation', minutesAgo: 1490 },
  { action: 'UPDATE', table: 'Employee', minutesAgo: 1905 },
  { action: 'CREATE', table: 'Reservation', minutesAgo: 2580 },
  { action: 'UPDATE', table: 'Room', minutesAgo: 3120 },
];

export async function seedAuditLogs(prisma: PrismaClient) {
  const count = await prisma.auditLog.count();
  if (count > 0) {
    console.log('Bitácora ya sembrada, omitido.');
    return;
  }

  const actions = await prisma.auditAction.findMany();
  const actionId = new Map(actions.map((a) => [a.name, a.id]));

  const employees = await prisma.employee.findMany({
    where: { role: { not: Role.OWNER } },
    orderBy: { id: 'asc' },
    select: { id: true },
  });
  const reservations = await prisma.reservation.findMany({
    orderBy: { id: 'desc' },
    take: 30,
    select: { id: true },
  });
  const rooms = await prisma.room.findMany({
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  if (employees.length === 0 || actions.length === 0) {
    console.warn('Bitácora omitida: faltan empleados o acciones.');
    return;
  }

  const recordIdFor = (table: string, i: number): number | null => {
    if (table === 'Reservation') return reservations[i % reservations.length]?.id ?? null;
    if (table === 'Room') return rooms[i % rooms.length]?.id ?? null;
    if (table === 'Employee') return employees[i % employees.length].id;
    return null;
  };

  const nowMs = Date.now();
  let created = 0;
  for (let i = 0; i < FEED.length; i++) {
    const entry = FEED[i];
    const aId = actionId.get(entry.action);
    const recordId = recordIdFor(entry.table, i);
    if (!aId || recordId == null) continue;
    await prisma.auditLog.create({
      data: {
        employeeId: employees[i % employees.length].id,
        actionId: aId,
        tableName: entry.table,
        recordId,
        performedAt: new Date(nowMs - entry.minutesAgo * 60_000),
      },
    });
    created++;
  }
  console.log(`Bitácora de auditoría sembrada (${created}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedAuditLogs(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
