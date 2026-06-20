import { PrismaClient } from '@prisma/client';
import { createSeedClient } from '../prisma-client';

const DAY = 1000 * 60 * 60 * 24;
const TODAY = new Date('2026-06-20T00:00:00Z');

function atHour(dayOffset: number, hour: number) {
  const d = new Date(TODAY.getTime() + dayOffset * DAY);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

type RoomLite = { id: number; price: unknown; status: { name: string } | null };

type Spec = {
  room: RoomLite;
  guestId: number;
  status: string;
  checkIn: Date;
  checkOut: Date;
  actualCheckIn: Date | null;
  actualCheckOut: Date | null;
};

export async function seedReservations(prisma: PrismaClient) {
  const count = await prisma.reservation.count();
  if (count > 0) {
    console.log('Reservas ya sembradas, omitido.');
    return;
  }

  const rooms = (await prisma.room.findMany({
    include: { status: true },
    orderBy: { number: 'asc' },
  })) as unknown as RoomLite[];
  const guests = await prisma.guest.findMany({ orderBy: { id: 'asc' } });
  if (rooms.length === 0 || guests.length === 0) {
    console.warn('Reservas omitidas: faltan cuartos o huéspedes.');
    return;
  }

  const occupiedRooms = rooms.filter((r) => r.status?.name === 'OCCUPIED');

  let guestCursor = 0;
  const nextGuestId = () => {
    const g = guests[guestCursor % guests.length];
    guestCursor++;
    return g.id;
  };

  const specs: Spec[] = [];

  // ACTIVE: una reserva en curso por cada cuarto OCCUPIED.
  occupiedRooms.forEach((room, i) => {
    const checkInOffset = -(1 + (i % 4));
    specs.push({
      room,
      guestId: nextGuestId(),
      status: 'ACTIVE',
      checkIn: atHour(checkInOffset, 15),
      checkOut: atHour(2 + (i % 3), 11),
      actualCheckIn: atHour(checkInOffset, 16),
      actualCheckOut: null,
    });
  });

  // COMPLETED: 12 estadías pasadas (generan pago).
  for (let i = 0; i < 12; i++) {
    const room = rooms[i % rooms.length];
    const start = -60 + i * 4;
    const nights = 2 + (i % 3);
    specs.push({
      room,
      guestId: nextGuestId(),
      status: 'COMPLETED',
      checkIn: atHour(start, 15),
      checkOut: atHour(start + nights, 11),
      actualCheckIn: atHour(start, 15),
      actualCheckOut: atHour(start + nights, 10),
    });
  }

  // PENDING: 12 reservas futuras sin check-in.
  for (let i = 0; i < 12; i++) {
    const room = rooms[(i + 5) % rooms.length];
    const start = 3 + i * 3;
    const nights = 2 + (i % 4);
    specs.push({
      room,
      guestId: nextGuestId(),
      status: 'PENDING',
      checkIn: atHour(start, 15),
      checkOut: atHour(start + nights, 11),
      actualCheckIn: null,
      actualCheckOut: null,
    });
  }

  // CANCELLED: 6 reservas anuladas.
  for (let i = 0; i < 6; i++) {
    const room = rooms[(i + 11) % rooms.length];
    const start = 5 + i * 4;
    const nights = 2 + (i % 3);
    specs.push({
      room,
      guestId: nextGuestId(),
      status: 'CANCELLED',
      checkIn: atHour(start, 15),
      checkOut: atHour(start + nights, 11),
      actualCheckIn: null,
      actualCheckOut: null,
    });
  }

  let created = 0;
  for (const s of specs) {
    await prisma.reservation.create({
      data: {
        checkIn: s.checkIn,
        checkOut: s.checkOut,
        actualCheckIn: s.actualCheckIn,
        actualCheckOut: s.actualCheckOut,
        status: { connect: { name: s.status } },
        rateSnapshot: Number(s.room.price),
        room: { connect: { id: s.room.id } },
        guest: { connect: { id: s.guestId } },
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
