-- CreateTable
CREATE TABLE "DiscountType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "DiscountType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscountType_name_key" ON "DiscountType"("name");

-- Seed inline del catálogo
INSERT INTO "DiscountType" ("name") VALUES ('SEASONAL'), ('LOYALTY'), ('PROMOTIONAL'), ('CORPORATE');

-- AlterTable: agregar columnas nuevas; typeId nullable de momento para poder backfillear
ALTER TABLE "Discount" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "typeId" INTEGER;

-- Backfill: mapear cada descuento existente a su tipo por nombre
UPDATE "Discount" d SET "typeId" = dt."id" FROM "DiscountType" dt WHERE dt."name" = 'LOYALTY' AND d."name" = 'Cliente frecuente';
UPDATE "Discount" d SET "typeId" = dt."id" FROM "DiscountType" dt WHERE dt."name" = 'SEASONAL' AND d."name" = 'Temporada baja';
UPDATE "Discount" d SET "typeId" = dt."id" FROM "DiscountType" dt WHERE dt."name" = 'CORPORATE' AND d."name" = 'Convenio corporativo';
UPDATE "Discount" d SET "typeId" = dt."id" FROM "DiscountType" dt WHERE dt."name" = 'PROMOTIONAL' AND d."name" = 'Estadia larga';

-- Fallback defensivo: cualquier descuento sin match queda como PROMOTIONAL (evita NULL antes del NOT NULL)
UPDATE "Discount" d SET "typeId" = dt."id" FROM "DiscountType" dt WHERE dt."name" = 'PROMOTIONAL' AND d."typeId" IS NULL;

-- Recién ahora fijar NOT NULL
ALTER TABLE "Discount" ALTER COLUMN "typeId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Discount_typeId_idx" ON "Discount"("typeId");

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "DiscountType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
