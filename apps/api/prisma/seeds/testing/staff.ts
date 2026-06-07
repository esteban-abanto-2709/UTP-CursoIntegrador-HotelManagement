import { PrismaClient, Role, Shift } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createSeedClient } from '../prisma-client';

const staff = [
  {
    username: 'manager',
    password: 'manager',
    role: Role.MANAGER,
    dni: '40111222',
    firstName: 'Carla',
    lastName: 'Mendoza',
    position: 'Manager',
    shift: Shift.MORNING,
    email: 'carla.mendoza@example.com',
  },
  {
    username: 'recepcion1',
    password: 'recepcion1',
    role: Role.EMPLOYEE,
    dni: '40222333',
    firstName: 'Jorge',
    lastName: 'Paredes',
    position: 'Recepcionista',
    shift: Shift.AFTERNOON,
    email: 'jorge.paredes@example.com',
  },
  {
    username: 'limpieza1',
    password: 'limpieza1',
    role: Role.EMPLOYEE,
    dni: '40333444',
    firstName: 'Rosa',
    lastName: 'Huamán',
    position: 'Limpieza',
    shift: Shift.NIGHT,
    email: 'rosa.huaman@example.com',
  },
];

export async function seedStaff(prisma: PrismaClient) {
  for (const member of staff) {
    const { password, ...rest } = member;
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.employee.upsert({
      where: { username: member.username },
      update: { ...rest, password: hashedPassword },
      create: { ...rest, password: hashedPassword },
    });
  }
  console.log(`Personal de prueba sembrado (${staff.length}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedStaff(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
