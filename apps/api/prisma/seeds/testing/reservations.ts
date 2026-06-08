import { PrismaClient } from '@prisma/client';
import { createSeedClient } from '../prisma-client';

const reservations = [
  {
    roomNumber: '202',
    guestNationalId: '70123456',
    checkIn: new Date('2026-06-05T15:00:00Z'),
    checkOut: new Date('2026-06-08T11:00:00Z'),
    actualCheckIn: new Date('2026-06-05T15:20:00Z'),
    actualCheckOut: null as Date | null,
    status: 'ACTIVE',
    pricePerNight: 140,
  },
  {
    roomNumber: '301',
    guestNationalId: '70234567',
    checkIn: new Date('2026-06-15T15:00:00Z'),
    checkOut: new Date('2026-06-18T11:00:00Z'),
    actualCheckIn: null as Date | null,
    actualCheckOut: null as Date | null,
    status: 'PENDING',
    pricePerNight: 320,
  },
  {
    roomNumber: '101',
    guestNationalId: '70345678',
    checkIn: new Date('2026-05-20T15:00:00Z'),
    checkOut: new Date('2026-05-23T11:00:00Z'),
    actualCheckIn: new Date('2026-05-20T15:10:00Z'),
    actualCheckOut: new Date('2026-05-23T10:30:00Z'),
    status: 'COMPLETED',
    pricePerNight: 80,
  },
  {
    roomNumber: '201',
    guestNationalId: '70456789',
    checkIn: new Date('2026-06-06T15:00:00Z'),
    checkOut: new Date('2026-06-10T11:00:00Z'),
    actualCheckIn: new Date('2026-06-06T16:00:00Z'),
    actualCheckOut: null as Date | null,
    status: 'ACTIVE',
    pricePerNight: 140,
  },
];

export async function seedReservations(prisma: PrismaClient) {
  const count = await prisma.reservation.count();
  if (count > 0) {
    console.log('Reservas ya sembradas, omitido.');
    return;
  }
  const manager = await prisma.employee.findUnique({
    where: { username: 'manager' },
  });
  let created = 0;
  for (const r of reservations) {
    const room = await prisma.room.findUnique({ where: { number: r.roomNumber } });
    const guest = await prisma.guest.findUnique({ where: { nationalId: r.guestNationalId } });
    if (!room || !guest) {
      console.warn(`Reserva omitida: falta room ${r.roomNumber} o guest ${r.guestNationalId}.`);
      continue;
    }
    await prisma.reservation.create({
      data: {
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        actualCheckIn: r.actualCheckIn,
        actualCheckOut: r.actualCheckOut,
        status: { connect: { name: r.status } },
        pricePerNight: r.pricePerNight,
        room: { connect: { id: room.id } },
        guest: { connect: { id: guest.id } },
        creator: manager ? { connect: { id: manager.id } } : undefined,
      },
    });
    created++;
  }
  console.log(`Reservas sembradas (${created}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedReservations(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
