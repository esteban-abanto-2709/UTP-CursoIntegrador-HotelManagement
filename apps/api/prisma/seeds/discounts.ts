import { PrismaClient } from '@prisma/client';
import { createSeedClient } from './prisma-client';

const discounts = [
  {
    name: 'Cliente frecuente',
    description: 'Descuento para huespedes recurrentes',
    percentage: 10,
    isActive: true,
    typeName: 'LOYALTY',
  },
  {
    name: 'Estadia larga',
    description: 'Descuento por estadias de 7 noches o mas',
    percentage: 15,
    isActive: true,
    typeName: 'PROMOTIONAL',
  },
  {
    name: 'Temporada baja',
    description: 'Promocion de temporada baja',
    percentage: 20,
    isActive: true,
    typeName: 'SEASONAL',
  },
  {
    name: 'Convenio corporativo',
    description: 'Tarifa preferencial para empresas',
    percentage: 12,
    isActive: false,
    typeName: 'CORPORATE',
  },
];

export async function seedDiscounts(prisma: PrismaClient) {
  for (const { typeName, ...discount } of discounts) {
    await prisma.discount.upsert({
      where: { name: discount.name },
      update: {
        description: discount.description,
        percentage: discount.percentage,
        isActive: discount.isActive,
        type: { connect: { name: typeName } },
      },
      create: {
        ...discount,
        type: { connect: { name: typeName } },
      },
    });
  }
  console.log(`Descuentos sembrados (${discounts.length}).`);
}

if (require.main === module) {
  const prisma = createSeedClient();
  seedDiscounts(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
