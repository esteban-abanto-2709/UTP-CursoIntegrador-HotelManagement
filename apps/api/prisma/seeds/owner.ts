import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createSeedClient } from './prisma-client';

// ┌─────────────────────────────────────────────────────────────┐
// │  EDITA AQUÍ las credenciales del owner antes de sembrar.      │
// │  La password se hashea con bcrypt automáticamente.           │
// └─────────────────────────────────────────────────────────────┘
const OWNER = {
  username: 'admin',
  password: 'admin',
  firstName: 'Owner',
  lastName: 'Principal',
};

export async function seedOwner(prisma: PrismaClient) {
  const hashedPassword = await bcrypt.hash(OWNER.password, 10);
  await prisma.employee.upsert({
    where: { username: OWNER.username },
    update: {
      password: hashedPassword,
      role: Role.OWNER,
      firstName: OWNER.firstName,
      lastName: OWNER.lastName,
    },
    create: {
      username: OWNER.username,
      password: hashedPassword,
      role: Role.OWNER,
      firstName: OWNER.firstName,
      lastName: OWNER.lastName,
    },
  });
  console.log(`Owner sembrado (username: ${OWNER.username}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedOwner(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
