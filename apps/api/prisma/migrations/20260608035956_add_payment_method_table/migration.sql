-- RenameEnum: apartar el enum viejo para liberar el nombre "PaymentMethod" para la tabla
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_name_key" ON "PaymentMethod"("name");

-- Seed: métodos de pago existentes
INSERT INTO "PaymentMethod" ("name") VALUES
    ('CASH'),
    ('CARD'),
    ('TRANSFER')
ON CONFLICT ("name") DO NOTHING;

-- AlterTable: agregar la FK nullable antes del backfill
ALTER TABLE "Payment" ADD COLUMN "paymentMethodId" INTEGER;

-- Backfill: mapear el enum "paymentMethod" al id del catálogo
UPDATE "Payment" p
SET "paymentMethodId" = pm."id"
FROM "PaymentMethod" pm
WHERE p."paymentMethod"::text = pm."name";

-- AlterTable: eliminar la columna enum vieja una vez backfilleada
ALTER TABLE "Payment" DROP COLUMN "paymentMethod";

-- DropEnum: eliminar el enum viejo ya renombrado
DROP TYPE "PaymentMethod_old";

-- CreateIndex
CREATE INDEX "Payment_paymentMethodId_idx" ON "Payment"("paymentMethodId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
