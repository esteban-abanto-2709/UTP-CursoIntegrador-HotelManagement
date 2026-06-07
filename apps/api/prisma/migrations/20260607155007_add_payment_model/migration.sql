-- CreateTable
CREATE TABLE "Discount" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "percentage" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "reservationId" INTEGER NOT NULL,
    "processedBy" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "discountId" INTEGER,
    "roomTotal" DECIMAL(10,2) NOT NULL,
    "chargesTotal" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL,
    "grandTotal" DECIMAL(10,2) NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Discount_name_key" ON "Discount"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reservationId_key" ON "Payment"("reservationId");

-- CreateIndex
CREATE INDEX "Payment_processedBy_idx" ON "Payment"("processedBy");

-- CreateIndex
CREATE INDEX "Payment_discountId_idx" ON "Payment"("discountId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DataMigration: preservar el cobro existente de Reservation antes de borrar las columnas.
-- El modelo viejo no registraba quien proceso el pago: se usa el primer empleado como placeholder.
INSERT INTO "Payment" (
    "reservationId",
    "processedBy",
    "paymentMethod",
    "discountId",
    "roomTotal",
    "chargesTotal",
    "subtotal",
    "discountAmount",
    "grandTotal",
    "processedAt"
)
SELECT
    r."id",
    (SELECT e."id" FROM "Employee" e ORDER BY e."id" LIMIT 1),
    r."paymentMethod",
    NULL,
    r."totalAmount",
    0,
    r."totalAmount",
    0,
    r."totalAmount",
    COALESCE(r."paidAt", CURRENT_TIMESTAMP)
FROM "Reservation" r
WHERE r."totalAmount" IS NOT NULL
  AND r."paymentMethod" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "Employee");

-- AlterTable: ahora que el cobro quedo respaldado en Payment, se eliminan las columnas viejas.
ALTER TABLE "Reservation" DROP COLUMN "paidAt",
DROP COLUMN "paymentMethod",
DROP COLUMN "totalAmount";
