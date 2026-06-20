import { PrismaClient } from '@prisma/client';
import { createSeedClient } from '../prisma-client';

const firstNames = [
  'Lucía', 'Marco', 'Ana', 'Diego', 'Camila', 'José', 'Valeria', 'Andrés',
  'Sofía', 'Luis', 'Mariana', 'Carlos', 'Daniela', 'Fernando', 'Paola',
  'Ricardo', 'Gabriela', 'Miguel', 'Rosa', 'Jorge', 'Patricia', 'Eduardo',
  'Carmen', 'Raúl', 'Elena', 'Sergio', 'Natalia', 'Hugo', 'Verónica', 'Iván',
];

const lastNames = [
  'Fernández', 'Ríos', 'Quispe', 'Salas', 'Torres', 'Mendoza', 'Paredes',
  'Huamán', 'Vargas', 'Castro', 'Rojas', 'Flores', 'Díaz', 'Ramos', 'Cárdenas',
  'Chávez', 'Espinoza', 'Guerrero', 'León', 'Núñez', 'Ortiz', 'Pacheco',
  'Reyes', 'Soto', 'Ugarte', 'Valdez', 'Zúñiga', 'Bautista', 'Campos', 'Delgado',
];

function slug(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function buildGuests() {
  return firstNames.map((firstName, i) => {
    const lastName = lastNames[i];
    return {
      nationalId: String(70100001 + i),
      fullName: `${firstName} ${lastName}`,
      email: `${slug(firstName)}.${slug(lastName)}@example.com`,
      phone: `9${String(87000000 + i)}`,
    };
  });
}

const guests = buildGuests();

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
