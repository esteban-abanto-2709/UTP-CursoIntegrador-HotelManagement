-- Liberar el nombre "RoomType": el enum viejo y la tabla nueva no pueden coexistir
ALTER TYPE "RoomType" RENAME TO "RoomType_old";

-- CreateTable
CREATE TABLE "RoomType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomType_name_key" ON "RoomType"("name");

-- Seed inline del catálogo
INSERT INTO "RoomType" ("name") VALUES ('SINGLE'), ('DOUBLE'), ('SUITE');

-- AlterTable: agregar FK nullable sin soltar todavía la columna vieja
ALTER TABLE "Room" ADD COLUMN "typeId" INTEGER;

-- Backfill desde el enum viejo
UPDATE "Room" r SET "typeId" = rt."id" FROM "RoomType" rt WHERE r."type"::text = rt."name";

-- Soltar la columna enum vieja y el tipo
ALTER TABLE "Room" DROP COLUMN "type";
DROP TYPE "RoomType_old";

-- CreateIndex
CREATE INDEX "Room_typeId_idx" ON "Room"("typeId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "RoomType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
