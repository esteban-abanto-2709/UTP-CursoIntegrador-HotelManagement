-- 1. Crear el nuevo Enum
CREATE TYPE "Role" AS ENUM ('OWNER', 'MANAGER', 'EMPLOYEE');

-- 2. Renombrar la tabla vieja a la nueva
ALTER TABLE "Auth" RENAME TO "User";

-- 3. Renombrar los constraints (opcional pero muy recomendado para evitar errores futuros)
ALTER TABLE "User" RENAME CONSTRAINT "Auth_pkey" TO "User_pkey";
ALTER INDEX "Auth_username_key" RENAME TO "User_username_key";

-- 4. Modificar la columna 'role' (cambiarla de texto a Enum)
-- Como antes tenías un string "user" y ahora es un Enum "EMPLOYEE", hacemos la conversión
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING (
  CASE 
    WHEN role = 'admin' THEN 'OWNER'::"Role"
    WHEN role = 'manager' THEN 'MANAGER'::"Role"
    ELSE 'EMPLOYEE'::"Role"
  END
);
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';
