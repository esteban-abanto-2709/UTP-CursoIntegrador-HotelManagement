-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MAÑANA', 'TARDE', 'NOCHE');

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "dni" TEXT,
    "nombres" TEXT,
    "apellidoPaterno" TEXT,
    "apellidoMaterno" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "cargo" TEXT,
    "turno" "Turno",
    "fechaInicio" TIMESTAMP(3),
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- Migrate OWNER record from User before dropping it
INSERT INTO "Employee" ("id", "username", "password", "role", "createdAt", "updatedAt")
SELECT "id", "username", "password", "role", "createdAt", "updatedAt"
FROM "User"
WHERE "role" = 'OWNER';

-- DropTable
DROP TABLE "User";

-- CreateIndex
CREATE UNIQUE INDEX "Employee_username_key" ON "Employee"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_dni_key" ON "Employee"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");
