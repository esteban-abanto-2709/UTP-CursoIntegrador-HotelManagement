# Roadmap — Lumina Resort PMS

**Stack:** NestJS + Prisma + PostgreSQL · Next.js 16 · Render/Vercel/Supabase

> Lo ya resuelto vive en `CHANGELOG.md`. Aquí solo queda lo pendiente.
> **Requisito clave de BD:** debe quedar **100% normalizada** (lo exige el profesor). No denormalizar; preferir derivar on-read salvo *snapshots* legítimos (valores no reconstruibles desde el dato actual, ej. tarifa pactada).

## Convención Prisma

- **Una sola migración por cambio.** Una única migración hace todo de una (crear tabla, sembrar, FK, backfill, drop de columna/enum viejo). Nunca se parte en una segunda.
- Flujo: Claude edita `schema.prisma` → **tú corres** `pnpm prisma migrate dev --create-only --name <n>` → Claude ajusta el `migration.sql` → **tú aplicas**. Claude nunca corre migraciones.
- Es normal que la migración rompa el build/API temporalmente; se corrige antes de pushear. **No se pushea al remoto hasta que el build esté verde.**
- Catálogos sin CRUD se mantienen vía seed reejecutable: `prisma/seeds/<x>.ts` registrado en `seed.ts` (además del seed inline de la migración).

---

## Milestone 5 — Pulido y filtros *(opcional)*

- **[T024]** *(TD-001)* Constraint anti doble-reserva en PostgreSQL: `btree_gist` + `EXCLUDE USING gist` sobre `(roomId, tsrange("checkIn","checkOut",'[)'))`. Cierra la condición de carrera de overbooking (hoy solo cubierta por validación en código).

---

## Milestone 6 — Normalización de enums a tablas *(opcional, confirmado con el profesor)*

> **Patrón** (una sola migración): crear tabla catálogo → sembrar → FK nullable → backfill desde el enum → drop del enum/columna vieja — todo junto. Luego actualizar API (DTOs, services, `include`) y front (selectores poblados desde el catálogo). Seed reejecutable por catálogo.

- **[T031] Role** *(mayor blast radius: todo el RBAC)*: tabla `Role` (OWNER/MANAGER/EMPLOYEE) + `roleId` (FK nullable) en `Employee`, eliminando `role` y el enum. Migración `add_role_table`. **Riesgo:** JWT y `@CurrentUser()` deben seguir exponiendo el rol por **nombre** (string) para no romper `@Roles()`/`RolesGuard`/front; internamente se resuelve `roleId` por nombre. Hacer al final.

---

## Milestone 7 — Huecos restantes del modelo *(opcional)*

> Independientes entre sí. T034 y T035 ambas tocan `Discount`/`Payment` pero no dependen entre sí.

- **[T032] Eliminar `createdBy` de la reserva**. Revertir el «Creada por» de T020/T021/T023. **Motivo:** la trazabilidad de quién crea/modifica reservas ya vive en `AuditLog` (con el `employeeId` que ejecutó la acción) y la auditoría es `@Roles('OWNER')`. Exponer el creador en `/dashboard/reservas` —visible para EMPLOYEE/MANAGER— filtra info que no les corresponde y es redundante. **Workflow por niveles (elegir alcance; de menor a mayor blast radius):**
  - **Nivel 1 — Solo UI:** quitar la columna «Creada por» en `apps/web/src/app/dashboard/reservas/page.tsx` (cabecera + celda `res.creator`) y el campo `creator` de su tipo local. API y BD intactas.
  - **Nivel 2 — UI + API:** además, quitar `creator` de `reservationInclude` y de `flattenReservation` en `reservations.service.ts`. `createdBy` sigue en BD, deja de viajar al front.
  - **Nivel 3 — Revertir BD (nueva migración):** además, eliminar `createdBy`/`creator` (más `@@index([createdBy])`) de `Reservation` en `schema.prisma`, migración `drop_reservation_created_by`. **Antes de migrar, limpiar lo que lo escribe:** en `create()` quitar `creator: { connect: ... }` (mantener `employeeId` solo para `audit.log`) y en `prisma/seeds/testing/reservations.ts` quitar `creator: ...`. **No tocar `AuditLog`.**

- **[T034] DiscountType — clasificar los descuentos por categoría**. **Contexto:** hoy `Discount` (`name @unique`, `percentage`, `isActive`) tiene descuentos concretos que ya se aplican en checkout; `seeds/discounts.ts` siembra 4. Falta una **dimensión de tipo/categoría** sobre esos descuentos. **No hecho:** no hay tabla `DiscountType`, ni `typeId`, ni `createdAt` en `Discount`.
  - **Qué crear:** tabla-catálogo `DiscountType` (`name @unique`: `SEASONAL`/`LOYALTY`/`PROMOTIONAL`/`CORPORATE`) + `typeId` (FK **NOT NULL**) y `createdAt` en `Discount`.
  - **Migración `add_discount_type_table` (todo en una, patrón T028–T030):** crear tabla → sembrar los 4 tipos → `typeId` **nullable** → **backfill** (mapear por nombre: «Cliente frecuente»→`LOYALTY`, «Temporada baja»→`SEASONAL`, «Convenio corporativo»→`CORPORATE`, «Estadía larga»→`PROMOTIONAL`) → recién entonces FK **NOT NULL**.
  - **Código:** seed reejecutable `seeds/discount-types.ts` (en `seed.ts`), `seeds/discounts.ts` conecta cada descuento con su `type` por nombre, y `GET /discounts` devuelve `type` con `include` (aplanado a string).

- **[T035] Varios descuentos en un mismo checkout**. **Problema:** el checkout solo admite **un** descuento (`Payment.discountId Int?`, `CheckoutReservationDto.discountId?`, `checkOut()` calcula con un único `%`).
  - **Objetivo:** aplicar **varios** descuentos a la vez en el pago.
  - **Schema (migración `payment_multiple_discounts`):** relación `Payment`↔`Discount` de 1-a-muchos a **muchos-a-muchos** vía tabla puente explícita `PaymentDiscount` (`paymentId`, `discountId`, y **snapshotear** el `percentage` aplicado por fila para que el histórico no cambie si luego se edita el descuento). Quitar `discountId`/`discount` y `@@index([discountId])` de `Payment`.
  - **API:** `CheckoutReservationDto`: `discountId?` → `discountIds?: number[]`. En `checkOut()`: validar que cada descuento exista y esté activo; **decisión de negocio a fijar (registrar en `docs/technical-debt.md`):** ¿porcentajes **sumados** (10%+15%=25%) o **en cascada**? y **tope 100%**. Persistir una fila `PaymentDiscount` por descuento y guardar el `discountAmount` total agregado.
  - **Respuestas:** donde se expone `payment.discount` pasar a `discounts` como arreglo.
  - **Front:** diálogo de checkout (`apps/web/.../servicio`) cambia el `Select` único por selección múltiple y muestra el desglose sumando todos.

---

## Dependencias

Milestones M1–M6 ya resueltos (ver `CHANGELOG.md`). Pendientes independientes: **T024** (M5), **T031** (M6), **T032 / T034 / T035** (M7). Cualquiera es punto de corte válido.
