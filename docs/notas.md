# Notas

Apuntes de implementación pendiente para retomar más adelante.

---

## Sistema de seeds local (multi-archivo)

**Objetivo:** sembrar datos base (categorías de gasto, usuario OWNER) fuera de las
migraciones, de forma reejecutable y selectiva. Reemplaza el `INSERT` hardcodeado
dentro del `migration.sql` (ver [TD-005] en `technical-debt.md`).

Prisma solo permite **un** comando de seed (`prisma db seed` apunta a un único script),
pero ese script puede orquestar varios archivos. Así se obtiene "correr todo" y
"correr solo una parte" a la vez.

### Estructura de archivos

```
apps/api/prisma/
  seed.ts              ← orquestador: importa y ejecuta todos los seeds en orden
  seeds/
    categories.ts      ← solo categorías de gasto (Room Service, Minibar, Lavandería, Daños, Otros)
    owner.ts           ← solo el usuario OWNER (credenciales HARDCODEADAS, preferencia decidida)
```

- Cada archivo de `seeds/` exporta una función (p. ej. `seedCategories(prisma)`,
  `seedOwner(prisma)`) y también puede ejecutarse directo para correrlo aislado.
- Todo con `upsert` (idempotente): correrlo varias veces no duplica.
  - Categorías: `upsert` por `name` (unique).
  - Owner: `upsert` por `username` (unique). Password con `bcrypt.hash(pass, 10)`,
    igual que `employees.service.ts`. Campos mínimos: `username`, `password`, `role: 'OWNER'`
    (el resto del modelo `Employee` es nullable).

### package.json (`apps/api`)

```json
"scripts": {
  "seed:owner": "ts-node prisma/seeds/owner.ts",
  "seed:categories": "ts-node prisma/seeds/categories.ts"
},
"prisma": { "seed": "ts-node prisma/seed.ts" }
```

`ts-node` y `tsconfig-paths` ya están en `devDependencies` — no hace falta instalar nada.

### Cómo se usa

- `npx prisma db seed` → corre todo (vía `seed.ts`). Se ejecuta **automáticamente** tras
  `npx prisma migrate reset` y en la primera `migrate dev`.
- `npm run seed:categories` → solo agrega/actualiza categorías, sin tocar al owner.
- `npm run seed:owner` → solo crea/actualiza el owner.

Para agregar una categoría nueva o cambiar al owner: editar el archivo correspondiente
en `seeds/` y correr solo ese script.

### Limpieza pendiente (ligada a TD-005)

No tocar todavía el `migration.sql` de `add_room_charges`: la migración ya está aplicada
y editarla rompe el próximo `migrate dev` (drift por checksum). En el **reset final** del
desarrollo (`prisma migrate reset`):

1. Eliminar el bloque `INSERT ... ExpenseCategory ...` del `migration.sql` (líneas ~43-46)
   para que la migración quede solo-esquema.
2. Correr el reset → re-aplica migraciones limpias y dispara `prisma db seed`
   (categorías + owner) automáticamente.
