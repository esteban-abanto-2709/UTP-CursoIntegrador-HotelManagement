import { PrismaClient } from '@prisma/client';
import { createSeedClient } from '../prisma-client';

const DAY = 1000 * 60 * 60 * 24;
// "Hoy" se ancla al reloj real al sembrar (medianoche UTC de la fecha local),
// para que "Llegadas de hoy", salidas y reservas ACTIVE del dashboard queden
// siempre al día sin importar cuándo se resiembre.
const now = new Date();
const TODAY = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

function atHour(dayOffset: number, hour: number) {
  const d = new Date(TODAY.getTime() + dayOffset * DAY);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

function at(year: number, month: number, day: number, hour: number) {
  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0));
}

// ponytail: PRNG determinista (mulberry32) con semilla fija → volumen/fechas
// "aleatorios" pero estables entre corridas, para que la demo se vea igual.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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

// Demanda relativa por mes (Ene..Dic): verano peruano (Ene-Mar), fiestas
// patrias (Jul) y fin de año (Dic) más llenos; temporada baja en otoño.
const MONTHLY_DEMAND = [8, 7, 6, 4, 3, 4, 7, 5, 4, 5, 6, 8];

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

  const rand = rng(20260620);
  const randInt = (min: number, max: number) =>
    min + Math.floor(rand() * (max - min + 1));
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

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
  const nextRoom = () => rooms[pick(weighted)];

  // Estancias reales: mayoría cortas (1-3 noches), algunas largas.
  const nightsPool = [1, 1, 2, 2, 2, 3, 3, 4, 5];

  const specs: Spec[] = [];

  // Reserva COMPLETED con día/hora/noches dispersos dentro del mes.
  const addCompleted = (year: number, month: number, howMany: number, maxDay: number) => {
    const usedDays = new Set<number>();
    for (let n = 0; n < howMany; n++) {
      let day = randInt(1, maxDay);
      // ponytail: hasta 5 reintentos para no repetir día; si choca, se acepta.
      for (let tries = 0; tries < 5 && usedDays.has(day); tries++) {
        day = randInt(1, maxDay);
      }
      usedDays.add(day);
      const nights = pick(nightsPool);
      specs.push({
        room: nextRoom(),
        guestId: nextGuestId(),
        status: 'COMPLETED',
        checkIn: at(year, month, day, randInt(13, 19)),
        checkOut: at(year, month, day + nights, randInt(9, 12)),
        actualCheckIn: at(year, month, day, randInt(13, 19)),
        actualCheckOut: at(year, month, day + nights, randInt(9, 11)),
      });
    }
  };

  // COMPLETED 2025: año completo, volumen variable por temporada.
  for (let month = 1; month <= 12; month++) {
    const base = MONTHLY_DEMAND[month - 1];
    addCompleted(2025, month, base + randInt(-1, 2), 26);
  }

  // COMPLETED 2026: Ene–Jun (pasado respecto a TODAY 2026-06-20).
  for (let month = 1; month <= 6; month++) {
    const base = MONTHLY_DEMAND[month - 1];
    // Junio va en curso: solo hasta el día 15 y con menos reservas.
    const maxDay = month === 6 ? 15 : 26;
    const howMany = month === 6 ? Math.ceil(base / 2) : base + randInt(-1, 2);
    addCompleted(2026, month, howMany, maxDay);
  }

  // ACTIVE: una reserva en curso por cada cuarto OCCUPIED. Los que tienen
  // checkOut hoy (offset 0, ~1/3) alimentan las "salidas de hoy" del dashboard.
  occupiedRooms.forEach((room, i) => {
    const checkInOffset = -(1 + (i % 4));
    const checkOutOffset = i % 3;
    specs.push({
      room,
      guestId: nextGuestId(),
      status: 'ACTIVE',
      checkIn: atHour(checkInOffset, randInt(13, 18)),
      checkOut: atHour(checkOutOffset, randInt(9, 12)),
      actualCheckIn: atHour(checkInOffset, randInt(14, 19)),
      actualCheckOut: null,
    });
  });

  // LLEGADAS DE HOY: reservas PENDING que entran hoy (fecha real de siembra).
  for (let n = 0; n < 4; n++) {
    const nights = pick(nightsPool);
    specs.push({
      room: nextRoom(),
      guestId: nextGuestId(),
      status: 'PENDING',
      checkIn: atHour(0, randInt(13, 18)),
      checkOut: atHour(nights, randInt(9, 12)),
      actualCheckIn: null,
      actualCheckOut: null,
    });
  }

  // PENDING: futuras Jul–Dic 2026, también con volumen variable.
  for (let month = 7; month <= 12; month++) {
    const base = MONTHLY_DEMAND[month - 1];
    const howMany = base + randInt(-1, 2);
    const usedDays = new Set<number>();
    for (let n = 0; n < howMany; n++) {
      let day = randInt(1, 27);
      for (let tries = 0; tries < 5 && usedDays.has(day); tries++) {
        day = randInt(1, 27);
      }
      usedDays.add(day);
      const nights = pick(nightsPool);
      specs.push({
        room: nextRoom(),
        guestId: nextGuestId(),
        status: 'PENDING',
        checkIn: at(2026, month, day, randInt(13, 19)),
        checkOut: at(2026, month, day + nights, randInt(9, 12)),
        actualCheckIn: null,
        actualCheckOut: null,
      });
    }
  }

  // CANCELLED: ruido realista en ambos años (excluidas de analíticas).
  const cancelled: [number, number][] = [
    [2025, 3], [2025, 6], [2025, 9], [2025, 11],
    [2026, 1], [2026, 4], [2026, 5], [2026, 8], [2026, 10], [2026, 12],
  ];
  cancelled.forEach(([year, month]) => {
    const day = randInt(4, 24);
    const nights = pick(nightsPool);
    specs.push({
      room: nextRoom(),
      guestId: nextGuestId(),
      status: 'CANCELLED',
      checkIn: at(year, month, day, randInt(13, 19)),
      checkOut: at(year, month, day + nights, randInt(9, 12)),
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
