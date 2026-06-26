import { PrismaClient, Role } from '@prisma/client';
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
    shift: 'MORNING',
    email: 'carla.mendoza@example.com',
  },
  {
    username: 'manager2',
    password: 'manager2',
    role: Role.MANAGER,
    dni: '40555666',
    firstName: 'Renzo',
    lastName: 'Cáceres',
    position: 'Manager',
    shift: 'AFTERNOON',
    email: 'renzo.caceres@example.com',
  },
  {
    username: 'recepcion1',
    password: 'recepcion1',
    role: Role.EMPLOYEE,
    dni: '40222333',
    firstName: 'Jorge',
    lastName: 'Paredes',
    position: 'Recepcionista',
    shift: 'AFTERNOON',
    email: 'jorge.paredes@example.com',
  },
  {
    username: 'recepcion2',
    password: 'recepcion2',
    role: Role.EMPLOYEE,
    dni: '40444555',
    firstName: 'Lucía',
    lastName: 'Vega',
    position: 'Recepcionista',
    shift: 'MORNING',
    email: 'lucia.vega@example.com',
  },
  {
    username: 'recepcion3',
    password: 'recepcion3',
    role: Role.EMPLOYEE,
    dni: '40666777',
    firstName: 'Diego',
    lastName: 'Salazar',
    position: 'Recepcionista',
    shift: 'NIGHT',
    email: 'diego.salazar@example.com',
  },
  {
    username: 'botones1',
    password: 'botones1',
    role: Role.EMPLOYEE,
    dni: '40777888',
    firstName: 'Marco',
    lastName: 'Ríos',
    position: 'Botones',
    shift: 'MORNING',
    email: 'marco.rios@example.com',
  },
  {
    username: 'botones2',
    password: 'botones2',
    role: Role.EMPLOYEE,
    dni: '40888999',
    firstName: 'Andrés',
    lastName: 'Quispe',
    position: 'Botones',
    shift: 'AFTERNOON',
    email: 'andres.quispe@example.com',
  },
  {
    username: 'limpieza1',
    password: 'limpieza1',
    role: Role.EMPLOYEE,
    dni: '40333444',
    firstName: 'Rosa',
    lastName: 'Huamán',
    position: 'Limpieza',
    shift: 'NIGHT',
    email: 'rosa.huaman@example.com',
  },
  {
    username: 'limpieza2',
    password: 'limpieza2',
    role: Role.EMPLOYEE,
    dni: '40999000',
    firstName: 'Patricia',
    lastName: 'Torres',
    position: 'Limpieza',
    shift: 'MORNING',
    email: 'patricia.torres@example.com',
  },
  {
    username: 'limpieza3',
    password: 'limpieza3',
    role: Role.EMPLOYEE,
    dni: '41000111',
    firstName: 'Hugo',
    lastName: 'Flores',
    position: 'Limpieza',
    shift: 'AFTERNOON',
    email: 'hugo.flores@example.com',
  },
  {
    username: 'recepcion4',
    password: 'recepcion4',
    role: Role.EMPLOYEE,
    dni: '41111222',
    firstName: 'Valeria',
    lastName: 'Castro',
    position: 'Recepcionista',
    shift: 'AFTERNOON',
    email: 'valeria.castro@example.com',
  },
];

export async function seedStaff(prisma: PrismaClient) {
  for (const member of staff) {
    const { password, position, shift, ...rest } = member;
    const hashedPassword = await bcrypt.hash(password, 10);
    const data = {
      ...rest,
      password: hashedPassword,
      jobPosition: { connect: { name: position } },
      shift: { connect: { name: shift } },
    };
    await prisma.employee.upsert({
      where: { username: member.username },
      update: data,
      create: data,
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
