import { PrismaClient } from '@prisma/client';
import { createSeedClient } from '../prisma-client';

const DAY = 1000 * 60 * 60 * 24;
const TODAY = new Date('2026-06-20T00:00:00Z');

function atHour(dayOffset: number, hour: number) {
  const d = new Date(TODAY.getTime() + dayOffset * DAY);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

function at(year: number, month: number, day: number, hour: number) {
  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0));
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

  // Selector de cuarto sesgado: los primeros cuartos aparecen más
  // (alimenta el top de "Habitaciones más usadas").
  const weighted: number[] = [];
  rooms.forEach((_, idx) => {
    const times = idx < 5 ? 4 : 1;
    for (let t = 0; t < times; t++) weighted.push(idx);
  });
  let roomCursor = 0;
  const nextRoom = () => rooms[weighted[roomCursor++ % weighted.length]];

  const startDays = [2, 8, 14, 20, 25];
  const specs: Spec[] = [];

  // COMPLETED 2025: año completo (5 por mes) → ingresos y ocupación llenos.
  for (let month = 1; month <= 12; month++) {
    startDays.forEach((day, k) => {
      const nights = 2 + ((month + k) % 3);
      specs.push({
        room: nextRoom(),
        guestId: nextGuestId(),
        status: 'COMPLETED',
        checkIn: at(2025, month, day, 15),
        checkOut: at(2025, month, day + nights, 11),
        actualCheckIn: at(2025, month, day, 15),
        actualCheckOut: at(2025, month, day + nights, 10),
      });
    });
  }

  // COMPLETED 2026: Ene–Jun (pasado respecto a TODAY 2026-06-20).
  for (let month = 1; month <= 6; month++) {
    const days = month < 6 ? startDays : [2, 8, 14];
    days.forEach((day, k) => {
      const nights = 2 + ((month + k) % 3);
      specs.push({
        room: nextRoom(),
        guestId: nextGuestId(),
        status: 'COMPLETED',
        checkIn: at(2026, month, day, 15),
        checkOut: at(2026, month, day + nights, 11),
        actualCheckIn: at(2026, month, day, 15),
        actualCheckOut: at(2026, month, day + nights, 10),
      });
    });
  }

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

  // PENDING: futuras Jul–Dic 2026 (llenan la 2da mitad de ocupación).
  for (let month = 7; month <= 12; month++) {
    startDays.forEach((day, k) => {
      const nights = 2 + ((month + k) % 4);
      specs.push({
        room: nextRoom(),
        guestId: nextGuestId(),
        status: 'PENDING',
        checkIn: at(2026, month, day, 15),
        checkOut: at(2026, month, day + nights, 11),
        actualCheckIn: null,
        actualCheckOut: null,
      });
    });
  }

  // CANCELLED: ruido realista en ambos años (excluidas de analíticas).
  const cancelled: [number, number][] = [
    [2025, 3], [2025, 6], [2025, 9], [2025, 11],
    [2026, 1], [2026, 4], [2026, 5], [2026, 8], [2026, 10], [2026, 12],
  ];
  cancelled.forEach(([year, month], i) => {
    const nights = 2 + (i % 3);
    specs.push({
      room: nextRoom(),
      guestId: nextGuestId(),
      status: 'CANCELLED',
      checkIn: at(year, month, 16, 15),
      checkOut: at(year, month, 16 + nights, 11),
      actualCheckIn: null,
      actualCheckOut: null,
    });
  });

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
