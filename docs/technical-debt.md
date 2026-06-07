# Deuda Técnica

Registro de atajos, decisiones pendientes y riesgos a futuro de este proyecto.

**Formato de cada entrada:**

- **Ubicación:** `archivo:línea` afectado.
- **Riesgo:** del 1 al 10 (1-3 cosmético · 4-6 ralentiza/moderado · 7-9 bug latente o seguridad · 10 crítico).
- **Problema:** qué está mal, sintetizado.
- **Impacto futuro:** qué puede causar si no se atiende.
- **Fecha** y **Estado** (Abierto / Resuelto).

---

## [TD-001] Validación de overbooking no es atómica (condición de carrera)

- **Ubicación:** `apps/api/src/modules/reservations/reservations.service.ts:34`
- **Riesgo:** 5/10
- **Problema:** La validación de solapamiento (`findFirst`) y el `create` de la reserva son dos operaciones separadas. Dos peticiones simultáneas para el mismo cuarto y fechas pueden pasar ambas el chequeo antes de que cualquiera inserte, generando doble reserva.
- **Impacto futuro:** Overbooking real bajo concurrencia. La validación en código cubre el flujo normal, pero no la carrera. Solución planificada en Fase 5 del roadmap: constraint a nivel de BD `EXCLUDE USING gist` con `tsrange` sobre `(roomId, [checkIn, checkOut))` (requiere extensión `btree_gist`).
- **Fecha:** 2026-05-30 · **Estado:** Abierto

## [TD-002] Contrato HTTP de Employee aún en español (capa de mapeo temporal)

- **Ubicación:** `apps/api/src/modules/employees/employees.service.ts:18` (mapas `TURNO_TO_SHIFT`/`SHIFT_TO_TURNO`, `toSpanishShape`), `apps/api/src/modules/employees/dto/create-employee.dto.ts`, `apps/api/src/modules/employees/dto/update-employee.dto.ts`
- **Riesgo:** 3/10
- **Problema:** La DB y la capa Prisma quedaron en inglés (`firstName`, `shift`, etc.), pero el contrato HTTP sigue en español (`nombres`, `turno`, valores `MAÑANA/TARDE/NOCHE`). El service traduce en ambas fronteras (entrada y salida) para no tocar el frontend. Es código puente, no estado final.
- **Impacto futuro:** Doble fuente de verdad de nombres; cualquier campo nuevo hay que mapearlo en dos sitios y es fácil olvidarlo. Se elimina cuando se traduzca el frontend a inglés (DTOs pasan a passthrough directo y se borran los mapas).
- **Fecha:** 2026-05-31 · **Estado:** Abierto

## [TD-003] Valores de `Cargo` en español persistidos en la columna `position`

- **Ubicación:** `apps/api/src/modules/employees/dto/create-employee.dto.ts:12` (`VALID_CARGOS`), `employees.service.ts:13` (`CARGO_TO_ROLE`)
- **Riesgo:** 2/10
- **Problema:** Los valores `'Manager' | 'Recepcionista' | 'Botones' | 'Limpieza'` se mandan desde el front y se guardan tal cual en la columna `position`. Quedan como dato en español dentro de una DB ya estandarizada a inglés.
- **Impacto futuro:** Traducirlos luego exige migrar los datos existentes de `position` y actualizar front + `CARGO_TO_ROLE` de forma coordinada. Cuanto más datos haya, más cara la migración.
- **Fecha:** 2026-05-31 · **Estado:** Abierto

## [TD-004] Frontend habla español en el contrato (campos y valores de turno)

- **Ubicación:** `apps/web/src/app/dashboard/staff/EmployeeFormDialog.tsx`, `apps/web/src/app/dashboard/staff/page.tsx`, `apps/web/src/store/authStore.ts`, `apps/web/src/components/app-sidebar.tsx`
- **Riesgo:** 2/10
- **Problema:** El frontend envía/lee campos en español (`nombres`, `apellidoPaterno`, `cargo`, `turno`) y los valores de turno `MAÑANA/TARDE/NOCHE`. Es lo que obliga a mantener la capa de mapeo de [TD-002].
- **Impacto futuro:** Mientras siga así, el backend no puede ser 100% inglés en su frontera. Migrarlo es el paso que cierra TD-002 (mover el contrato a inglés y eliminar el mapeo del service).
- **Fecha:** 2026-05-31 · **Estado:** Abierto

## [TD-006] `Payment.processedBy` placeholder en los cobros migrados desde Reservation

- **Ubicación:** `apps/api/prisma/migrations/20260607155007_add_payment_model/migration.sql:50` (bloque DataMigration)
- **Riesgo:** 3/10
- **Problema:** El modelo viejo (`Reservation.totalAmount/paymentMethod/paidAt`) no registraba qué empleado procesó el cobro. Al normalizar a `Payment` (T011), el backfill asigna `processedBy = primer empleado existente` como placeholder para no perder el resto del cobro. Ese dato no refleja quién cobró realmente esas reservas históricas.
- **Impacto futuro:** Cualquier reporte o auditoría que agrupe pagos por empleado contará esos `Payment` migrados bajo un empleado que no los procesó. Solo afecta a las reservas pagadas antes de T011; los cobros nuevos (T013) guardan el empleado real vía `@CurrentUser()`. No hay forma de recuperar el dato original.
- **Fecha:** 2026-06-07 · **Estado:** Abierto

## [TD-005] Datos sembrados (categorías de gasto) embebidos dentro de un `migration.sql`

- **Ubicación:** `apps/api/prisma/migrations/20260606233807_add_room_charges/migration.sql:43`
- **Riesgo:** 7/10
- **Problema:** El `INSERT` de las 5 `ExpenseCategory` (Room Service, Minibar, Lavandería, Daños, Otros) vive dentro del `migration.sql`, mezclando datos con esquema. Lo correcto es que la migración solo defina estructura y los datos vayan en un seed (`prisma/seed.ts`). No se puede limpiar ahora mismo: la migración ya está aplicada, así que editar el archivo cambia su checksum y rompe el siguiente `npx prisma migrate dev` (drift "migration modified"). Absorber el cambio sin riesgo exige `prisma migrate reset` (borra la BD), y el siguiente milestone necesita seguir usando `migrate dev` sobre la BD actual.
- **Impacto futuro:** Al borrar/recrear la BD desde cero, las categorías quedan acopladas a una migración en vez de a un seed reejecutable; no hay forma de re-sembrar selectivamente sin recorrer migraciones. Además bloquea la limpieza del archivo hasta el reset definitivo. **Plan:** crear el sistema de seeds local (múltiples archivos: categorías, owner, etc. + orquestador para `prisma db seed`) y, en el reset final del desarrollo, eliminar el bloque `INSERT` de este `migration.sql` para que la migración quede solo-esquema.
- **Avance (2026-06-07):** La infraestructura de seeds ya está construida (T011) — `apps/api/prisma/seed.ts` (orquestador), `prisma/seeds/prisma-client.ts` (factory), `prisma/seeds/discounts.ts` (primer seed con `upsert`), `prisma/tsconfig.seed.json` y `migrations.seed` en `prisma.config.ts`. Falta engancharle `categories.ts` y `owner.ts` y, en el reset final, vaciar el `INSERT` de este `migration.sql`.
- **Avance (2026-06-07):** Sistema de seeds completado. Permanentes enganchados al orquestador `seed.ts`: `seeds/owner.ts` (credenciales editables, `bcrypt`, `upsert` por `username`) y `seeds/categories.ts` (las 5 categorías con `upsert` por `name`, equivalentes al `INSERT`). Comando `npm run seed`. La data de prueba desechable vive en `seeds/testing/` con su propio orquestador `seed.placeholder.ts` (`npm run seed:placeholder`) — ver [TD-007]. **Único pendiente:** en el reset final del desarrollo, vaciar el bloque `INSERT` de este `migration.sql` para que la migración quede solo-esquema (las categorías ya las garantiza `npm run seed`).
- **Fecha:** 2026-06-07 · **Estado:** Abierto (seeds completos; pendiente solo vaciar el `INSERT` en el reset final)

## [TD-007] Data de prueba template (`seeds/testing/`) es desechable

- **Ubicación:** `apps/api/prisma/seeds/testing/` (rooms, guests, staff, reservations, charges, payments), orquestador `apps/api/prisma/seed.placeholder.ts`, script `seed:placeholder` en `apps/api/package.json`
- **Riesgo:** 2/10
- **Problema:** Los seeds bajo `seeds/testing/` (cuartos, huéspedes, personal, reservas, cargos y pagos) son datos template para probar el flujo del PMS, no base real. Incluyen credenciales de prueba (`manager/manager`, `recepcion1/recepcion1`, `limpieza1/limpieza1`). Las reservas/cargos/pagos usan guard por conteo (idempotentes pero no re-sembrables parcialmente).
- **Impacto futuro:** Si esta carpeta llega a producción siembra datos y usuarios falsos con contraseñas triviales. Es deuda intencional y de baja prioridad: existe para que quede registrado que debe eliminarse.
- **Plan:** Al finalizar el proyecto, borrar la carpeta `seeds/testing/`, `seed.placeholder.ts` y el script `seed:placeholder`. Solo debe sobrevivir `npm run seed` (owner + categorías + discounts).
- **Fecha:** 2026-06-07 · **Estado:** Abierto
