import { PrismaClient } from '@prisma/client';
import { createSeedClient } from '../prisma-client';

const guests = [
  { nationalId: '70123456', fullName: 'Lucía Fernández', email: 'lucia.fernandez@example.com', phone: '987654321' },
  { nationalId: '70234567', fullName: 'Marco Ríos', email: 'marco.rios@example.com', phone: '987654322' },
  { nationalId: '70345678', fullName: 'Ana Quispe', email: 'ana.quispe@example.com', phone: '987654323' },
  { nationalId: '70456789', fullName: 'Diego Salas', email: 'diego.salas@example.com', phone: '987654324' },
];

export async function seedGuests(prisma: PrismaClient) {
  for (const guest of guests) {
    await prisma.guest.upsert({
      where: { nationalId: guest.nationalId },
      update: { fullName: guest.fullName, email: guest.email, phone: guest.phone },
      create: guest,
    });
  }
  console.log(`Huéspedes sembrados (${guests.length}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedGuests(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
