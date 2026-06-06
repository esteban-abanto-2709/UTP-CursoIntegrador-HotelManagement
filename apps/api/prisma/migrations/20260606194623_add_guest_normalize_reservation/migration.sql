-- CreateTable
CREATE TABLE "Guest" (
    "id" SERIAL NOT NULL,
    "nationalId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_nationalId_key" ON "Guest"("nationalId");

-- Data migration: crear un Guest por cada dni distinto presente en Reservation
INSERT INTO "Guest" ("nationalId", "fullName", "registeredAt")
SELECT DISTINCT ON ("dni") "dni", "guestName", CURRENT_TIMESTAMP
FROM "Reservation"
ORDER BY "dni", "id";

-- AlterTable: agregar guestId como nullable para poder hacer el backfill sin romper las filas existentes
ALTER TABLE "Reservation" ADD COLUMN "guestId" INTEGER;

-- Data migration: asociar cada reserva con su Guest por dni
UPDATE "Reservation" AS r
SET "guestId" = g."id"
FROM "Guest" AS g
WHERE g."nationalId" = r."dni";

-- AlterTable: una vez backfilleado, volver guestId obligatorio y eliminar las columnas ya migradas
ALTER TABLE "Reservation" ALTER COLUMN "guestId" SET NOT NULL;
ALTER TABLE "Reservation" DROP COLUMN "dni",
DROP COLUMN "guestName";

-- CreateIndex
CREATE INDEX "Reservation_guestId_idx" ON "Reservation"("guestId");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
