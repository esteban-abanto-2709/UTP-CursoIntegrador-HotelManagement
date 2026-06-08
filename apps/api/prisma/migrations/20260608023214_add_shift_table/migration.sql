-- RenameEnum: apartar el enum viejo para liberar el nombre "Shift" para la tabla
ALTER TYPE "Shift" RENAME TO "Shift_old";

-- CreateTable
CREATE TABLE "Shift" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shift_name_key" ON "Shift"("name");

-- Seed: turnos existentes
INSERT INTO "Shift" ("name") VALUES
    ('MORNING'),
    ('AFTERNOON'),
    ('NIGHT')
ON CONFLICT ("name") DO NOTHING;

-- AlterTable: agregar la FK nullable antes del backfill
ALTER TABLE "Employee" ADD COLUMN "shiftId" INTEGER;

-- Backfill: mapear el enum "shift" al id del catálogo
UPDATE "Employee" e
SET "shiftId" = s."id"
FROM "Shift" s
WHERE e."shift"::text = s."name";

-- AlterTable: eliminar la columna enum vieja una vez backfilleada
ALTER TABLE "Employee" DROP COLUMN "shift";

-- DropEnum: eliminar el enum viejo ya renombrado
DROP TYPE "Shift_old";

-- CreateIndex
CREATE INDEX "Employee_shiftId_idx" ON "Employee"("shiftId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
