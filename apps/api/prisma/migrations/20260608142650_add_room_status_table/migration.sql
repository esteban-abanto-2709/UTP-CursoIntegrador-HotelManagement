-- Liberar el nombre "RoomStatus": el enum viejo y la tabla nueva no pueden coexistir
ALTER TYPE "RoomStatus" RENAME TO "RoomStatus_old";

-- CreateTable
CREATE TABLE "RoomStatus" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "RoomStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomStatus_name_key" ON "RoomStatus"("name");

-- Seed inline del catálogo
INSERT INTO "RoomStatus" ("name") VALUES ('AVAILABLE'), ('OCCUPIED'), ('CLEANING'), ('MAINTENANCE');

-- AlterTable: agregar FK nullable sin soltar todavía la columna vieja
ALTER TABLE "Room" ADD COLUMN "statusId" INTEGER;

-- Backfill desde el enum viejo
UPDATE "Room" r SET "statusId" = rs."id" FROM "RoomStatus" rs WHERE r."status"::text = rs."name";

-- Soltar la columna enum vieja y el tipo
ALTER TABLE "Room" DROP COLUMN "status";
DROP TYPE "RoomStatus_old";

-- CreateIndex
CREATE INDEX "Room_statusId_idx" ON "Room"("statusId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "RoomStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
