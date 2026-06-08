-- Liberar el nombre "ReservationStatus": el enum viejo y la tabla nueva no pueden coexistir
ALTER TYPE "ReservationStatus" RENAME TO "ReservationStatus_old";

-- CreateTable
CREATE TABLE "ReservationStatus" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ReservationStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReservationStatus_name_key" ON "ReservationStatus"("name");

-- Seed inline del catálogo
INSERT INTO "ReservationStatus" ("name") VALUES ('PENDING'), ('ACTIVE'), ('COMPLETED'), ('CANCELLED');

-- AlterTable: agregar FK nullable sin soltar todavía la columna vieja
ALTER TABLE "Reservation" ADD COLUMN "statusId" INTEGER;

-- Backfill desde el enum viejo
UPDATE "Reservation" r SET "statusId" = rs."id" FROM "ReservationStatus" rs WHERE r."status"::text = rs."name";

-- Soltar la columna enum vieja y el tipo
ALTER TABLE "Reservation" DROP COLUMN "status";
DROP TYPE "ReservationStatus_old";

-- CreateIndex
CREATE INDEX "Reservation_statusId_idx" ON "Reservation"("statusId");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "ReservationStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
