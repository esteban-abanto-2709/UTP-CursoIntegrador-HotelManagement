import { PrismaClient, RoomType, RoomStatus } from '@prisma/client';
import { createSeedClient } from '../prisma-client';

const rooms = [
  { number: '101', type: RoomType.SINGLE, status: RoomStatus.AVAILABLE, price: 80 },
  { number: '102', type: RoomType.SINGLE, status: RoomStatus.CLEANING, price: 80 },
  { number: '201', type: RoomType.DOUBLE, status: RoomStatus.AVAILABLE, price: 140 },
  { number: '202', type: RoomType.DOUBLE, status: RoomStatus.OCCUPIED, price: 140 },
  { number: '301', type: RoomType.SUITE, status: RoomStatus.AVAILABLE, price: 320 },
  { number: '302', type: RoomType.SUITE, status: RoomStatus.MAINTENANCE, price: 320 },
];

export async function seedRooms(prisma: PrismaClient) {
  for (const room of rooms) {
    await prisma.room.upsert({
      where: { number: room.number },
      update: { type: room.type, status: room.status, price: room.price },
      create: room,
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
