import { PrismaClient, RoomStatus } from '@prisma/client';
import { createSeedClient } from '../prisma-client';

const rooms = [
  { number: '101', type: 'SINGLE', status: RoomStatus.AVAILABLE, price: 80 },
  { number: '102', type: 'SINGLE', status: RoomStatus.CLEANING, price: 80 },
  { number: '201', type: 'DOUBLE', status: RoomStatus.AVAILABLE, price: 140 },
  { number: '202', type: 'DOUBLE', status: RoomStatus.OCCUPIED, price: 140 },
  { number: '301', type: 'SUITE', status: RoomStatus.AVAILABLE, price: 320 },
  { number: '302', type: 'SUITE', status: RoomStatus.MAINTENANCE, price: 320 },
];

export async function seedRooms(prisma: PrismaClient) {
  for (const { number, type, status, price } of rooms) {
    await prisma.room.upsert({
      where: { number },
      update: { type: { connect: { name: type } }, status, price },
      create: { number, type: { connect: { name: type } }, status, price },
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
