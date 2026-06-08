-- CreateTable
CREATE TABLE "JobPosition" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "JobPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobPosition_name_key" ON "JobPosition"("name");

-- Seed: puestos de trabajo existentes
INSERT INTO "JobPosition" ("name") VALUES
    ('Manager'),
    ('Recepcionista'),
    ('Botones'),
    ('Limpieza')
ON CONFLICT ("name") DO NOTHING;

-- AlterTable: agregar la FK nullable antes del backfill
ALTER TABLE "Employee" ADD COLUMN "positionId" INTEGER;

-- Backfill: mapear el texto libre de "position" al id del catálogo
UPDATE "Employee" e
SET "positionId" = jp."id"
FROM "JobPosition" jp
WHERE e."position" = jp."name";

-- AlterTable: eliminar la columna vieja una vez backfilleada
ALTER TABLE "Employee" DROP COLUMN "position";

-- CreateIndex
CREATE INDEX "Employee_positionId_idx" ON "Employee"("positionId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "JobPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
