import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createSeedClient } from '../prisma-client';

const staff = [
  {
    username: 'manager',
    password: 'manager',
    role: Role.MANAGER,
    dni: '44872103',
    firstName: 'Carla',
    lastName: 'Mendoza',
    position: 'Manager',
    shift: 'MORNING',
    email: 'carla.mendoza@miradorhotel.com',
  },
  {
    username: 'manager2',
    password: 'manager2',
    role: Role.MANAGER,
    dni: '41235987',
    firstName: 'Renzo',
    lastName: 'Cáceres',
    position: 'Manager',
    shift: 'AFTERNOON',
    email: 'renzo.caceres@miradorhotel.com',
  },
  {
    username: 'recepcion1',
    password: 'recepcion1',
    role: Role.EMPLOYEE,
    dni: '46018342',
    firstName: 'Jorge',
    lastName: 'Paredes',
    position: 'Recepcionista',
    shift: 'AFTERNOON',
    email: 'jorge.paredes@miradorhotel.com',
  },
  {
    username: 'recepcion2',
    password: 'recepcion2',
    role: Role.EMPLOYEE,
    dni: '43897561',
    firstName: 'Lucía',
    lastName: 'Vega',
    position: 'Recepcionista',
    shift: 'MORNING',
    email: 'lucia.vega@miradorhotel.com',
  },
  {
    username: 'recepcion3',
    password: 'recepcion3',
    role: Role.EMPLOYEE,
    dni: '40562398',
    firstName: 'Diego',
    lastName: 'Salazar',
    position: 'Recepcionista',
    shift: 'NIGHT',
    email: 'diego.salazar@miradorhotel.com',
  },
  {
    username: 'botones1',
    password: 'botones1',
    role: Role.EMPLOYEE,
    dni: '47120845',
    firstName: 'Marco',
    lastName: 'Ríos',
    position: 'Botones',
    shift: 'MORNING',
    email: 'marco.rios@miradorhotel.com',
  },
  {
    username: 'botones2',
    password: 'botones2',
    role: Role.EMPLOYEE,
    dni: '42569013',
    firstName: 'Andrés',
    lastName: 'Quispe',
    position: 'Botones',
    shift: 'AFTERNOON',
    email: 'andres.quispe@miradorhotel.com',
  },
  {
    username: 'limpieza1',
    password: 'limpieza1',
    role: Role.EMPLOYEE,
    dni: '45983271',
    firstName: 'Rosa',
    lastName: 'Huamán',
    position: 'Limpieza',
    shift: 'NIGHT',
    email: 'rosa.huaman@miradorhotel.com',
  },
  {
    username: 'limpieza2',
    password: 'limpieza2',
    role: Role.EMPLOYEE,
    dni: '41706254',
    firstName: 'Patricia',
    lastName: 'Torres',
    position: 'Limpieza',
    shift: 'MORNING',
    email: 'patricia.torres@miradorhotel.com',
  },
  {
    username: 'limpieza3',
    password: 'limpieza3',
    role: Role.EMPLOYEE,
    dni: '48312906',
    firstName: 'Hugo',
    lastName: 'Flores',
    position: 'Limpieza',
    shift: 'AFTERNOON',
    email: 'hugo.flores@miradorhotel.com',
  },
  {
    username: 'recepcion4',
    password: 'recepcion4',
    role: Role.EMPLOYEE,
    dni: '43061789',
    firstName: 'Valeria',
    lastName: 'Castro',
    position: 'Recepcionista',
    shift: 'AFTERNOON',
    email: 'valeria.castro@miradorhotel.com',
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
