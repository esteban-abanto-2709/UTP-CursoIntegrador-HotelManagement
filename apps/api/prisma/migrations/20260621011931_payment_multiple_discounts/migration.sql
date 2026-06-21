/*
  Warnings:

  - You are about to drop the column `discountId` on the `Payment` table.
    Antes de borrarla, su valor se migra a la nueva tabla puente "PaymentDiscount"
    (backfill), por lo que no se pierde ningún descuento ya aplicado.

*/
-- CreateTable
CREATE TABLE "PaymentDiscount" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "discountId" INTEGER NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "PaymentDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentDiscount_discountId_idx" ON "PaymentDiscount"("discountId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentDiscount_paymentId_discountId_key" ON "PaymentDiscount"("paymentId", "discountId");

-- AddForeignKey
ALTER TABLE "PaymentDiscount" ADD CONSTRAINT "PaymentDiscount_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentDiscount" ADD CONSTRAINT "PaymentDiscount_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: migrar el descuento único de cada pago existente a la tabla puente
-- (snapshot del % actual del descuento). No-op en una BD sin pagos previos.
INSERT INTO "PaymentDiscount" ("paymentId", "discountId", "percentage")
SELECT p."id", p."discountId", d."percentage"
FROM "Payment" p
JOIN "Discount" d ON d."id" = p."discountId"
WHERE p."discountId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_discountId_fkey";

-- DropIndex
DROP INDEX "Payment_discountId_idx";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "discountId";
