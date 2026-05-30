-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER');

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "pricePerNight" DECIMAL(10,2),
ADD COLUMN     "totalAmount" DECIMAL(10,2);

-- AlterTable
-- Se agrega price con DEFAULT 0 para poder rellenar las habitaciones existentes,
-- y luego se quita el default para que la columna coincida con el schema (sin default).
ALTER TABLE "Room" ADD COLUMN     "price" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Room" ALTER COLUMN "price" DROP DEFAULT;
