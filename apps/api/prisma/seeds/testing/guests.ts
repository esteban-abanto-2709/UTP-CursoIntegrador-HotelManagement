import { PrismaClient } from '@prisma/client';
import { createSeedClient } from '../prisma-client';

const firstNames = [
  'Lucía', 'Marco', 'Ana', 'Diego', 'Camila', 'José', 'Valeria', 'Andrés',
  'Sofía', 'Luis', 'Mariana', 'Carlos', 'Daniela', 'Fernando', 'Paola',
  'Ricardo', 'Gabriela', 'Miguel', 'Rosa', 'Jorge', 'Patricia', 'Eduardo',
  'Carmen', 'Raúl', 'Elena', 'Sergio', 'Natalia', 'Hugo', 'Verónica', 'Iván',
  'Renzo', 'Claudia', 'Alonso', 'Fiorella', 'Bruno', 'Milagros', 'Gonzalo',
  'Alejandra', 'Mateo', 'Ximena', 'Pablo', 'Adriana', 'Joaquín', 'Lorena',
  'Sebastián', 'Romina', 'Emilio', 'Brenda', 'Nicolás', 'Tatiana',
];

const lastNames = [
  'Fernández', 'Ríos', 'Quispe', 'Salas', 'Torres', 'Mendoza', 'Paredes',
  'Huamán', 'Vargas', 'Castro', 'Rojas', 'Flores', 'Díaz', 'Ramos', 'Cárdenas',
  'Chávez', 'Espinoza', 'Guerrero', 'León', 'Núñez', 'Ortiz', 'Pacheco',
  'Reyes', 'Soto', 'Ugarte', 'Valdez', 'Zúñiga', 'Bautista', 'Campos', 'Delgado',
  'Aguirre', 'Benavides', 'Cornejo', 'Dávila', 'Escobar', 'Gamarra', 'Herrera',
  'Loayza', 'Maldonado', 'Navarro', 'Oviedo', 'Palomino', 'Rivera', 'Sánchez',
  'Trujillo', 'Velásquez', 'Yataco', 'Zegarra', 'Acuña', 'Bravo',
];

const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.es'];

// ponytail: PRNG determinista (mulberry32) con semilla fija → datos "aleatorios"
// pero estables entre corridas, para que la demo se vea igual en cada review.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function slug(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function buildGuests() {
  const rand = rng(70120026);
  const randInt = (min: number, max: number) =>
    min + Math.floor(rand() * (max - min + 1));
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

  const usedDni = new Set<string>();
  const uniqueDni = () => {
    let dni: string;
    do {
      dni = String(randInt(10000000, 76999999));
    } while (usedDni.has(dni));
    usedDni.add(dni);
    return dni;
  };

  return firstNames.map((firstName, i) => {
    const lastName = lastNames[i];
    const sep = pick(['.', '_', '']);
    const suffix = rand() < 0.4 ? String(randInt(71, 99)) : '';
    return {
      nationalId: uniqueDni(),
      fullName: `${firstName} ${lastName}`,
      email: `${slug(firstName)}${sep}${slug(lastName)}${suffix}@${pick(domains)}`,
      phone: `9${randInt(10000000, 99999999)}`,
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
