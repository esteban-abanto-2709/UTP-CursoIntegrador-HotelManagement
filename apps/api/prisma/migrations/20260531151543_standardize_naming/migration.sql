-- Rename enum type and its values in place (preserves data)
ALTER TYPE "Turno" RENAME TO "Shift";
ALTER TYPE "Shift" RENAME VALUE 'MAÑANA' TO 'MORNING';
ALTER TYPE "Shift" RENAME VALUE 'TARDE' TO 'AFTERNOON';
ALTER TYPE "Shift" RENAME VALUE 'NOCHE' TO 'NIGHT';

-- Rename Employee columns in place (preserves data)
ALTER TABLE "Employee" RENAME COLUMN "nombres" TO "firstName";
ALTER TABLE "Employee" RENAME COLUMN "apellidoPaterno" TO "lastName";
ALTER TABLE "Employee" RENAME COLUMN "apellidoMaterno" TO "secondLastName";
ALTER TABLE "Employee" RENAME COLUMN "fechaNacimiento" TO "birthDate";
ALTER TABLE "Employee" RENAME COLUMN "cargo" TO "position";
ALTER TABLE "Employee" RENAME COLUMN "turno" TO "shift";
ALTER TABLE "Employee" RENAME COLUMN "fechaInicio" TO "hireDate";
ALTER TABLE "Employee" RENAME COLUMN "telefono" TO "phone";
ALTER TABLE "Employee" RENAME COLUMN "direccion" TO "address";
