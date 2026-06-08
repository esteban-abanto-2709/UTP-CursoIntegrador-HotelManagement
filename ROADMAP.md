# Roadmap — Lumina Resort PMS

**Stack:** NestJS + Prisma + PostgreSQL · Next.js 16 · Render/Vercel/Supabase

## Convención Prisma

- **Una sola migración por cambio.** Una única migración hace todo de una (crear tabla, sembrar, FK, backfill, drop de columna/enum viejo). Nunca se parte en una segunda.
- Flujo: Claude edita `schema.prisma` → **tú corres** `pnpm prisma migrate dev --create-only --name <n>` → Claude ajusta el `migration.sql` → **tú aplicas**. Claude nunca corre migraciones.
- Es normal que la migración rompa el build/API temporalmente; se corrige antes de pushear. **No se pushea al remoto hasta que el build esté verde.**
- Catálogos sin CRUD se mantienen vía seed reejecutable: `prisma/seeds/<x>.ts` registrado en `seed.ts` (además del seed inline de la migración).

## Historial (✅ hecho)

- **M1 Guest** (T001–T007): `Guest` como entidad propia con `nationalId`, backfill y `guestId NOT NULL` consolidados en `add_guest_normalize_reservation`; módulo `guests`, formulario reserva con buscar-por-DNI, página `/dashboard/huespedes`.
- **M2 Room Charges** (T008–T010): `ExpenseCategory` + `RoomCharge`, módulo `room-charges`, panel de cargos en `/dashboard/servicio`.
- **M3 Payment + Descuentos** (T011–T014): `Discount` + `Payment` desacoplado con desglose (`Prisma.Decimal`), `checkOut` refactorizado, diálogo de checkout con desglose. Eliminados `totalAmount`/`paymentMethod`/`paidAt` de `Reservation`. Sistema de seeds reejecutable introducido aquí.
- **M4 Audit Log** (T015–T019): `AuditAction` + `AuditLog`, `AuditService` `@Global()`, instrumentación en reservas/empleados/habitaciones, `GET /audit-logs` (`@Roles('OWNER')`), página `/dashboard/auditoria`.
- **M6/T025 JobPosition**: `position: String?` → tabla `JobPosition` en una sola migración; contrato `cargo` por nombre intacto.
- **M6/T026 Shift**: `enum Shift` → tabla `Shift` (`add_shift_table`) con rename del enum viejo a `Shift_old` para liberar el nombre, backfill y `DROP TYPE`; servicio mapea por nombre (`TURNO_TO_SHIFT_NAME`), contrato `turno` (MAÑANA/TARDE/NOCHE) intacto. Seed reejecutable `seeds/shifts.ts`.

---

## Milestone 5 — Pulido y filtros *(opcional)*

- **[T020]** `schema.prisma`: agregar `createdBy` (FK → Employee) a `Reservation`. Migración `add_reservation_created_by`.
- **[T021]** `POST /reservations`: leer `employeeId` del JWT (`@CurrentUser()`) y guardarlo en `createdBy`.
- **[T022]** Filtros fecha/cuarto en `/dashboard/reservas` (input desde/hasta + selector de habitación desde `GET /rooms`), combinados con el filtro de estado. Query params `from`/`to`/`roomId` en `routes.ts`.
- **[T023]** Columna opcional con el empleado creador de la reserva (`include` de `createdBy`).
- **[T024]** *(si hay tiempo, TD-001)* Constraint anti doble-reserva en PostgreSQL: `btree_gist` + `EXCLUDE USING gist` sobre `(roomId, tsrange("checkIn","checkOut",'[)'))`.

---

## Milestone 6 — Normalización de enums a tablas *(opcional, confirmado con el profesor)*

> Convertir atributos hoy resueltos con `enum` en tablas-catálogo con FK. Sistema funcional con los enums actuales.
>
> **Patrón** (una sola migración, como Guest y T025): crear tabla catálogo → sembrar → FK nullable → backfill desde el enum → drop del enum/columna vieja — todo en la misma migración. Luego actualizar API (DTOs, services, `include`) y front (selectores poblados desde el catálogo, lectura del objeto anidado). **Seed:** registrar el catálogo en el seed reejecutable (`prisma/seeds/<x>.ts` en `seed.ts`), no solo inline. Las seis son independientes; de menor a mayor blast radius.

- **[T027] PaymentMethod** *(solo en checkout/`Payment`)*: tabla `PaymentMethod` (CASH/CARD/TRANSFER) + `paymentMethodId` (FK nullable) en `Payment`, eliminando `paymentMethod` y el enum. Migración `add_payment_method_table`. Actualizar `checkOut` (recibe `paymentMethodId`), `include` del `Payment` y selector del checkout (`GET /payment-methods`).
- **[T028] RoomType** *(selectores/display en `Room`)*: tabla `RoomType` (SINGLE/DOUBLE/SUITE) + `typeId` (FK nullable) en `Room`, eliminando `type` y el enum. Migración `add_room_type_table`. Actualizar DTO/servicio habitaciones, `include` del `type`, selector del formulario (`GET /room-types`).
- **[T029] RoomStatus** *(alimenta housekeeping + colores `globals.css` + transiciones)*: tabla `RoomStatus` (AVAILABLE/OCCUPIED/CLEANING/MAINTENANCE) + `statusId` (FK nullable) en `Room`, eliminando `status` y el enum. Migración `add_room_status_table`. Actualizar servicio (lectura/escritura, transiciones check-in/out), `include`, y mapear colores del front por `name` del catálogo, no por enum.
- **[T030] ReservationStatus** *(gobierna el ciclo de vida, filtros, overbooking, check-in/out)*: tabla `ReservationStatus` (PENDING/ACTIVE/COMPLETED/CANCELLED) + `statusId` (FK nullable) en `Reservation`, eliminando `status` y el enum. Migración `add_reservation_status_table`. **Riesgo:** cada `status === '...'` en services/guards/filtro `?status=`/UI pasa a comparar contra el `name` (o resolver `statusId` por nombre); conviene un mapa nombre→id cargado al arrancar.
- **[T031] Role** *(mayor blast radius: todo el RBAC)*: tabla `Role` (OWNER/MANAGER/EMPLOYEE) + `roleId` (FK nullable) en `Employee`, eliminando `role` y el enum. Migración `add_role_table`. **Riesgo:** JWT y `@CurrentUser()` deben seguir exponiendo el rol por **nombre** (string) para no romper `@Roles()`/`RolesGuard`/front; internamente se resuelve `roleId` por nombre. Hacer al final.

---

## Milestone 7 — Fidelidad final con el modelo del profesor *(opcional)*

> Tres huecos independientes para igualar las entidades del profesor.

- **[T032] createdBy en Room**: agregar `createdBy` (FK → Employee, nullable, sin backfill). Migración `add_room_created_by`. `POST /rooms` guarda el `employeeId` del JWT; front muestra columna opcional del creador.
- **[T033] Reservation — fidelidad de campos**: renombrar `pricePerNight` → `rateSnapshot`, agregar `totalNights` (Int) y `roomTotal` (`Decimal(10,2)`). Migración `reservation_field_fidelity` (rename preservando datos + backfill). Actualizar `checkOut`/queries para usar `rateSnapshot`; poblar `totalNights`/`roomTotal` al crear/confirmar. **Decisión pendiente:** estos campos duplican lo que `Payment` ya calcula — decidir entre denormalizar (como el profesor) o derivar on-read; registrar en `docs/technical-debt.md`.
- **[T034] DiscountType**: tabla `DiscountType` (`name @unique`) + `typeId` (FK NOT NULL) y `createdAt` en `Discount`. Migración `add_discount_type_table` (sembrar SEASONAL/LOYALTY/PROMOTIONAL/CORPORATE + FK nullable → backfill → NOT NULL, todo de una). **Seed** reejecutable del catálogo. Actualizar seed/servicio de descuentos; `GET /discounts` devuelve `type` con `include`.

---

## Dependencias

M1 → (M2 aditivo) → M3 (necesita M2) → M4 → M5 → M6 (T026–T031 independientes) → M7 (T032–T034 independientes). Cualquier milestone es punto de corte válido.
