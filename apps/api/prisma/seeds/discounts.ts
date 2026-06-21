import { PrismaClient } from '@prisma/client';
import { createSeedClient } from './prisma-client';

const discounts = [
  {
    name: 'Temporada baja',
    description: 'Promocion de temporada baja',
    percentage: 20,
    isActive: true,
    typeName: 'SEASONAL',
  },
  {
    name: 'Fiestas patrias',
    description: 'Promocion por fiestas patrias',
    percentage: 15,
    isActive: true,
    typeName: 'SEASONAL',
  },
  {
    name: 'Navidad y Ano Nuevo',
    description: 'Promocion de fin de ano',
    percentage: 10,
    isActive: true,
    typeName: 'SEASONAL',
  },
  {
    name: 'Cliente frecuente',
    description: 'Descuento para huespedes recurrentes',
    percentage: 10,
    isActive: true,
    typeName: 'LOYALTY',
  },
  {
    name: 'Cliente fiel',
    description: 'Descuento para huespedes con varias estadias',
    percentage: 15,
    isActive: true,
    typeName: 'LOYALTY',
  },
  {
    name: 'Amigo de la casa',
    description: 'Descuento para huespedes de larga relacion',
    percentage: 20,
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
    name: 'Fin de semana',
    description: 'Promocion para estadias de fin de semana',
    percentage: 8,
    isActive: true,
    typeName: 'PROMOTIONAL',
  },
  {
    name: 'Convenio corporativo',
    description: 'Tarifa preferencial para empresas',
    percentage: 12,
    isActive: false,
    typeName: 'CORPORATE',
  },
  {
    name: 'Grupo / delegacion',
    description: 'Descuento para grupos o delegaciones',
    percentage: 18,
    isActive: true,
    typeName: 'GROUP',
  },
  {
    name: 'Reserva anticipada',
    description: 'Descuento por reservar con anticipacion',
    percentage: 10,
    isActive: true,
    typeName: 'EARLY_BIRD',
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
