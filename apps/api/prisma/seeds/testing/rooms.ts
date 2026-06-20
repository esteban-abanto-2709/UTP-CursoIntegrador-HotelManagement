import { PrismaClient } from '@prisma/client';
import { createSeedClient } from '../prisma-client';

const TYPE_PRICE: Record<string, number> = {
  SINGLE: 80,
  DOUBLE: 140,
  SUITE: 320,
};

const FLOORS = 5;
const ROOMS_PER_FLOOR = 6;

const OCCUPIED_SEQS = new Set([2, 5, 8, 11, 14, 17, 20, 23, 26, 29]);
const CLEANING_SEQS = new Set([3, 9, 15, 21]);
const MAINTENANCE_SEQS = new Set([6, 18, 30]);

function buildRooms() {
  const rooms: { number: string; type: string; status: string; price: number }[] = [];
  for (let floor = 1; floor <= FLOORS; floor++) {
    for (let unit = 1; unit <= ROOMS_PER_FLOOR; unit++) {
      const seq = (floor - 1) * ROOMS_PER_FLOOR + unit;
      const number = `${floor}${String(unit).padStart(2, '0')}`;

      let type = 'SINGLE';
      if (unit > 5) type = 'SUITE';
      else if (unit > 3) type = 'DOUBLE';

      let status = 'AVAILABLE';
      if (OCCUPIED_SEQS.has(seq)) status = 'OCCUPIED';
      else if (CLEANING_SEQS.has(seq)) status = 'CLEANING';
      else if (MAINTENANCE_SEQS.has(seq)) status = 'MAINTENANCE';

      rooms.push({ number, type, status, price: TYPE_PRICE[type] });
    }
  }
  return rooms;
}

const rooms = buildRooms();

export async function seedRooms(prisma: PrismaClient) {
  for (const { number, type, status, price } of rooms) {
    await prisma.room.upsert({
      where: { number },
      update: {
        type: { connect: { name: type } },
        status: { connect: { name: status } },
        price,
      },
      create: {
        number,
        type: { connect: { name: type } },
        status: { connect: { name: status } },
        price,
      },
    });
  }
  console.log(`Cuartos sembrados (${rooms.length}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedRooms(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
