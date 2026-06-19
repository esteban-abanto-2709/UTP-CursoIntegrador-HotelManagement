# Notas

Apuntes de implementación pendiente para retomar más adelante.

---

## Sistema de seeds local (multi-archivo)

**Objetivo:** sembrar datos base (categorías de gasto, usuario OWNER, descuentos) fuera
de las migraciones, de forma reejecutable y selectiva. Reemplaza el `INSERT` hardcodeado
dentro del `migration.sql` (ver TD-005, ya resuelto, en `logbook/technical-debt.md`).

Prisma solo permite **un** comando de seed (`prisma db seed` apunta a un único script),
pero ese script puede orquestar varios archivos. Así se obtiene "correr todo" y
"correr solo una parte" a la vez.

### Estado actual

**Construido en T011** (Milestone 3): la infraestructura ya existe y funciona con descuentos.

```
apps/api/prisma/
  seed.ts                  ← ✅ orquestador: importa y ejecuta todos los seeds en orden
  tsconfig.seed.json       ← ✅ tsconfig CommonJS para ts-node (evita líos de nodenext)
  seeds/
    prisma-client.ts       ← ✅ factory PrismaClient + adapter pg (usa DIRECT_URL)
    discounts.ts           ← ✅ seedDiscounts() con upsert por name; ejecutable aislado
    categories.ts          ← ⏳ pendiente: categorías de gasto (Room Service, Minibar, Lavandería, Daños, Otros)
    owner.ts               ← ⏳ pendiente: usuario OWNER (credenciales HARDCODEADAS, preferencia decidida)
```

- Cada archivo de `seeds/` exporta una función (p. ej. `seedDiscounts(prisma)`,
  `seedCategories(prisma)`, `seedOwner(prisma)`) y también puede ejecutarse directo para
  correrlo aislado (patrón `if (require.main === module)`, ver `discounts.ts`).
- Todo con `upsert` (idempotente): correrlo varias veces no duplica.
  - Descuentos: `upsert` por `name` (unique). *(Hecho.)*
  - Categorías: `upsert` por `name` (unique).
  - Owner: `upsert` por `username` (unique). Password con `bcrypt.hash(pass, 10)`,
    igual que `employees.service.ts`. Campos mínimos: `username`, `password`, `role: 'OWNER'`
    (el resto del modelo `Employee` es nullable).
- El cliente Prisma se obtiene siempre desde `seeds/prisma-client.ts` (`createSeedClient()`),
  no se instancia a mano en cada seed.

### Configuración del comando de seed

El comando vive en **`prisma.config.ts`** (Prisma 7 ya **no** lee la clave `package.json` →
`"prisma": { "seed": ... }`; quedó obsoleta):

```ts
// prisma.config.ts
migrations: {
  path: 'prisma/migrations',
  seed: 'ts-node -P prisma/tsconfig.seed.json prisma/seed.ts',
},
```

Los seeds selectivos sí van como scripts de `package.json` (`apps/api`):

```json
"scripts": {
  "seed:discounts": "ts-node -P prisma/tsconfig.seed.json prisma/seeds/discounts.ts"
  // pendientes: "seed:categories", "seed:owner"
}
```

`ts-node` y `tsconfig-paths` ya están en `devDependencies` — no hace falta instalar nada.
El `-P prisma/tsconfig.seed.json` fuerza CommonJS (el `tsconfig` raíz usa `nodenext`, que
exige extensiones `.js` en imports relativos y rompe ts-node).

### Cómo se usa

- `npx prisma db seed` → corre todo (vía `seed.ts`). Se ejecuta **automáticamente** tras
  `npx prisma migrate reset`.
- `npm run seed:discounts` → solo agrega/actualiza descuentos.
- *(Pendientes)* `npm run seed:categories`, `npm run seed:owner`.

Para agregar un descuento/categoría nuevo o cambiar al owner: editar el archivo
correspondiente en `seeds/` y correr solo ese script.

### Limpieza pendiente (ligada a TD-005, ya resuelto)

No tocar todavía el `migration.sql` de `add_room_charges`: la migración ya está aplicada
y editarla rompe el próximo `migrate dev` (drift por checksum). En el **reset final** del
desarrollo (`prisma migrate reset`):

1. Crear `seeds/categories.ts` y `seeds/owner.ts` y engancharlos en el orquestador
   `seed.ts` (la infraestructura ya está lista desde T011; ver "Estado actual" arriba).
2. Eliminar el bloque `INSERT ... ExpenseCategory ...` del `migration.sql` (líneas ~43-46)
   para que la migración quede solo-esquema.
3. Correr el reset → re-aplica migraciones limpias y dispara `prisma db seed`
   (descuentos + categorías + owner) automáticamente.
