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

## [TD-005] Datos sembrados (categorías de gasto) embebidos dentro de un `migration.sql`

- **Ubicación:** `apps/api/prisma/migrations/20260606233807_add_room_charges/migration.sql:43`
- **Riesgo:** 7/10
- **Problema:** El `INSERT` de las 5 `ExpenseCategory` (Room Service, Minibar, Lavandería, Daños, Otros) vive dentro del `migration.sql`, mezclando datos con esquema. Lo correcto es que la migración solo defina estructura y los datos vayan en un seed (`prisma/seed.ts`). No se puede limpiar ahora mismo: la migración ya está aplicada, así que editar el archivo cambia su checksum y rompe el siguiente `npx prisma migrate dev` (drift "migration modified"). Absorber el cambio sin riesgo exige `prisma migrate reset` (borra la BD), y el siguiente milestone necesita seguir usando `migrate dev` sobre la BD actual.
- **Impacto futuro:** Al borrar/recrear la BD desde cero, las categorías quedan acopladas a una migración en vez de a un seed reejecutable; no hay forma de re-sembrar selectivamente sin recorrer migraciones. Además bloquea la limpieza del archivo hasta el reset definitivo. **Plan:** crear el sistema de seeds local (múltiples archivos: categorías, owner, etc. + orquestador para `prisma db seed`) y, en el reset final del desarrollo, eliminar el bloque `INSERT` de este `migration.sql` para que la migración quede solo-esquema.
- **Fecha:** 2026-06-07 · **Estado:** Abierto
