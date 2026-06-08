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
- **M5 Pulido y filtros** (T020–T023): `createdBy` (FK → Employee, nullable, sin backfill, `ON DELETE SET NULL`) en `Reservation` vía `add_reservation_created_by`; `POST /reservations` guarda el empleado del JWT (`@CurrentUser()`); `reservationInclude`/`flattenReservation` exponen `creator` y la página `/dashboard/reservas` muestra la columna «Creada por»; filtros server-side `from`/`to`/`roomId` + estado combinados (`routes.ts` `reservations.list({...})` + selector de habitación desde `GET /rooms`, búsqueda por texto sigue client-side). Seed de prueba asigna `createdBy` al manager. **T024 (constraint anti doble-reserva, TD-001) sigue pendiente.** ⚠️ El `createdBy`/columna «Creada por» de la reserva se va a **revertir**: ver T032 (redundante con `AuditLog` y no debe verla el personal).
- **M6/T025 JobPosition**: `position: String?` → tabla `JobPosition` en una sola migración; contrato `cargo` por nombre intacto.
- **M6/T026 Shift**: `enum Shift` → tabla `Shift` (`add_shift_table`) con rename del enum viejo a `Shift_old` para liberar el nombre, backfill y `DROP TYPE`; servicio mapea por nombre (`TURNO_TO_SHIFT_NAME`), contrato `turno` (MAÑANA/TARDE/NOCHE) intacto. Seed reejecutable `seeds/shifts.ts`.
- **M6/T027 PaymentMethod**: `enum PaymentMethod` → tabla `PaymentMethod` (`add_payment_method_table`) con rename del enum viejo a `PaymentMethod_old`, backfill y `DROP TYPE`; `checkOut` resuelve nombre→id antes de la transacción y usa `paymentMethodId` escalar; `flattenPayment` aplana `payment.paymentMethod` a string en todos los retornos, contrato del front intacto (CASH/CARD/TRANSFER). Seed reejecutable `seeds/payment-methods.ts`.
- **M6/T030 ReservationStatus**: `enum ReservationStatus` → tabla `ReservationStatus` (`add_reservation_status_table`) con rename del enum viejo a `ReservationStatus_old`, backfill y `DROP TYPE`; DTOs (`update`/`filter`) con `@IsIn(VALID_RESERVATION_STATUSES)`. `reservations.service` aplana `status` a string en `flattenReservation`, `create` fija `PENDING` por defecto (la FK ya no tiene `@default`), el filtro `?status=` y el anti-solapamiento pasan a `{ name: ... }`, y cada transición (cancel/updateStatus/checkIn/checkOut) resuelve por `connect` e incluye la relación `status` para comparar por `.status?.name`. Tocados también `rooms.service.findAvailable` (overlap) y `room-charges.service` (guarda ACTIVE). Contrato del front intacto (string-union local). Seed reejecutable `seeds/reservation-statuses.ts`. Nota: el `create` pasó a `connect` de relaciones (guest/room/status/creator) para no mezclar inputs Checked/Unchecked de Prisma.
- **M6/T029 RoomStatus**: `enum RoomStatus` → tabla `RoomStatus` (`add_room_status_table`) con rename del enum viejo a `RoomStatus_old`, backfill y `DROP TYPE`; DTO con `@IsIn(VALID_ROOM_STATUSES)`, `rooms.service` resuelve nombre→id (`connect`), `create` fija `AVAILABLE` por defecto (la FK ya no tiene `@default`) y `flattenRoom` aplana `type` + `status` a string en todos los retornos (incluido `findAvailable`, cuyo filtro pasa a `status: { name: { not: 'MAINTENANCE' } }`). `reservations.service` ajusta check-in (`include` de la relación `status` + `connect` 'OCCUPIED') y check-out (`connect` 'CLEANING'). Contrato del front intacto. Seed reejecutable `seeds/room-statuses.ts`.
- **M6/T028 RoomType**: `enum RoomType` → tabla `RoomType` (`add_room_type_table`) con rename del enum viejo a `RoomType_old`, backfill y `DROP TYPE`; DTOs con `@IsIn(VALID_ROOM_TYPES)`, servicio resuelve nombre→id (`connect`) y `flattenType` aplana `room.type` a string en todos los retornos (incluido filtro de `findAvailable`). `reservations.service` ajusta `reservationInclude` y `flattenPayment`→`flattenReservation` para aplanar también `room.type`. Contrato del front intacto (SINGLE/DOUBLE/SUITE). Seed reejecutable `seeds/room-types.ts`.

---

## Milestone 5 — Pulido y filtros *(opcional)*

- ✅ **[T020]** `schema.prisma`: agregar `createdBy` (FK → Employee) a `Reservation`. Migración `add_reservation_created_by`.
- ✅ **[T021]** `POST /reservations`: leer `employeeId` del JWT (`@CurrentUser()`) y guardarlo en `createdBy`.
- ✅ **[T022]** Filtros fecha/cuarto en `/dashboard/reservas` (input desde/hasta + selector de habitación desde `GET /rooms`), combinados con el filtro de estado. Query params `from`/`to`/`roomId` en `routes.ts`.
- ✅ **[T023]** Columna opcional con el empleado creador de la reserva (`include` de `createdBy`).
- **[T024]** *(si hay tiempo, TD-001)* Constraint anti doble-reserva en PostgreSQL: `btree_gist` + `EXCLUDE USING gist` sobre `(roomId, tsrange("checkIn","checkOut",'[)'))`.

---

## Milestone 6 — Normalización de enums a tablas *(opcional, confirmado con el profesor)*

> Convertir atributos hoy resueltos con `enum` en tablas-catálogo con FK. Sistema funcional con los enums actuales.
>
> **Patrón** (una sola migración, como Guest y T025): crear tabla catálogo → sembrar → FK nullable → backfill desde el enum → drop del enum/columna vieja — todo en la misma migración. Luego actualizar API (DTOs, services, `include`) y front (selectores poblados desde el catálogo, lectura del objeto anidado). **Seed:** registrar el catálogo en el seed reejecutable (`prisma/seeds/<x>.ts` en `seed.ts`), no solo inline. Las seis son independientes; de menor a mayor blast radius.

- ✅ **[T029] RoomStatus** *(alimenta housekeeping + colores `globals.css` + transiciones)*: tabla `RoomStatus` (AVAILABLE/OCCUPIED/CLEANING/MAINTENANCE) + `statusId` (FK nullable) en `Room`, eliminando `status` y el enum. Migración `add_room_status_table`. Actualizar servicio (lectura/escritura, transiciones check-in/out), `include`, y mapear colores del front por `name` del catálogo, no por enum.
- ✅ **[T030] ReservationStatus** *(gobierna el ciclo de vida, filtros, overbooking, check-in/out)*: tabla `ReservationStatus` (PENDING/ACTIVE/COMPLETED/CANCELLED) + `statusId` (FK nullable) en `Reservation`, eliminando `status` y el enum. Migración `add_reservation_status_table`. **Riesgo:** cada `status === '...'` en services/guards/filtro `?status=`/UI pasa a comparar contra el `name` (o resolver `statusId` por nombre); conviene un mapa nombre→id cargado al arrancar.
- **[T031] Role** *(mayor blast radius: todo el RBAC)*: tabla `Role` (OWNER/MANAGER/EMPLOYEE) + `roleId` (FK nullable) en `Employee`, eliminando `role` y el enum. Migración `add_role_table`. **Riesgo:** JWT y `@CurrentUser()` deben seguir exponiendo el rol por **nombre** (string) para no romper `@Roles()`/`RolesGuard`/front; internamente se resuelve `roleId` por nombre. Hacer al final.

---

## Milestone 7 — Fidelidad final con el modelo del profesor *(opcional)*

> Tres huecos independientes para igualar las entidades del profesor.

- **[T032] Eliminar `createdBy` de la reserva** *(antes este slot era «createdBy en Room», descartado: no se quiere registrar creador en habitaciones)*. **Qué hacer:** revertir el «Creada por» que introdujeron T020/T021/T023. **Motivo:** la trazabilidad de quién crea/modifica reservas ya vive en `AuditLog` (acciones `CREATE`/`UPDATE`/`CANCEL`/`CHECKIN`/`CHECKOUT`, todas con el `employeeId` que ejecutó la acción) y la auditoría es `@Roles('OWNER')`. Exponer el creador en `/dashboard/reservas` —visible para `EMPLOYEE`/`MANAGER`— filtra info que no les corresponde y es redundante. **Workflow por niveles (elegir alcance al ejecutar; de menor a mayor blast radius):**
  - **Nivel 1 — Solo UI (sin migración):** quitar la columna «Creada por» en `apps/web/src/app/dashboard/reservas/page.tsx` (cabecera + celda que pinta `res.creator`) y el campo `creator` de su interfaz/tipo local. La API sigue devolviendo `creator` y la BD queda intacta.
  - **Nivel 2 — UI + API:** además del Nivel 1, dejar de exponer `creator`: quitar `creator` de `reservationInclude` y de `flattenReservation` en `apps/api/src/modules/reservations/reservations.service.ts`. El campo `createdBy` sigue en BD (lo sigue poblando `create`), solo deja de viajar al front.
  - **Nivel 3 — Revertir también la BD (nueva migración):** además del Nivel 2, eliminar `createdBy`/`creator` del modelo `Reservation` (más `@@index([createdBy])`) en `schema.prisma` y crear la migración `drop_reservation_created_by`. **Antes de migrar, limpiar el código que lo escribe o el build rompe:** en `create()` de `reservations.service.ts` quitar `creator: { connect: { id: employeeId } }` (mantener `employeeId` solo para `audit.log`), y en `prisma/seeds/testing/reservations.ts` quitar `creator: ...`. Flujo Prisma habitual (Claude edita schema → tú `migrate dev --create-only` → Claude ajusta SQL → tú aplicas). **No tocar `AuditLog`:** la trazabilidad debe seguir intacta.
- **[T033] Reservation — fidelidad de campos**: renombrar `pricePerNight` → `rateSnapshot`, agregar `totalNights` (Int) y `roomTotal` (`Decimal(10,2)`). Migración `reservation_field_fidelity` (rename preservando datos + backfill). Actualizar `checkOut`/queries para usar `rateSnapshot`; poblar `totalNights`/`roomTotal` al crear/confirmar. **Decisión pendiente:** estos campos duplican lo que `Payment` ya calcula — decidir entre denormalizar (como el profesor) o derivar on-read; registrar en `docs/technical-debt.md`.
- **[T034] DiscountType — clasificar los descuentos por categoría**. **Contexto:** hoy existe el modelo `Discount` (`prisma/schema.prisma`) con **descuentos concretos** (`name @unique`, `percentage`, `isActive`) que ya se aplican en el checkout; el seed `seeds/discounts.ts` siembra 4 (Cliente frecuente, Estadía larga, Temporada baja, Convenio corporativo). Lo que falta —y es lo que pide esta tarea— es una **dimensión de tipo/categoría** sobre esos descuentos, para igualar el modelo del profesor. Hoy un descuento es solo "Cliente frecuente, 10%"; con T034 además sabrás que **es de tipo `LOYALTY`**. **No está hecho:** no hay tabla `DiscountType`, ni `typeId`, ni `createdAt` en `Discount`.
  - **Qué crear:** tabla-catálogo `DiscountType` (`name @unique`, valores `SEASONAL`/`LOYALTY`/`PROMOTIONAL`/`CORPORATE`) + `typeId` (FK **NOT NULL**) y `createdAt` en `Discount`.
  - **Migración `add_discount_type_table` (todo en una, patrón ya usado en T028–T030):** crear tabla → sembrar los 4 tipos → agregar `typeId` **nullable** → **backfill** (asignar un tipo a las 4 filas existentes; mapear por nombre, p. ej. «Cliente frecuente»→`LOYALTY`, «Temporada baja»→`SEASONAL`, «Convenio corporativo»→`CORPORATE`, «Estadía larga»→`PROMOTIONAL`) → recién entonces poner el FK **NOT NULL**. El backfill es obligatorio antes del NOT NULL o la migración falla.
  - **Código:** seed reejecutable `seeds/discount-types.ts` (registrado en `seed.ts`), `seeds/discounts.ts` pasa a conectar cada descuento con su `type` por nombre, y `GET /discounts` devuelve `type` con `include` (aplanado a string como en los demás catálogos).
- **[T035] Varios descuentos en un mismo checkout**. **Problema actual:** el checkout solo admite **un** descuento. En `prisma/schema.prisma` el `Payment` tiene un único `discountId Int?` (FK a `Discount`), el `CheckoutReservationDto` (`apps/api/src/modules/reservations/dto/checkout-reservation.dto.ts`) acepta `discountId?: number`, y `checkOut()` (`reservations.service.ts`) calcula `discountAmount` con el `%` de ese único descuento. Resultado: hay que elegir **uno u otro** (p. ej. «Temporada baja» **o** «Loyalty», no ambos).
  - **Objetivo:** permitir aplicar **varios** descuentos a la vez en el pago.
  - **Schema (migración):** cambiar la relación `Payment`↔`Discount` de 1-a-muchos a **muchos-a-muchos** mediante tabla puente explícita `PaymentDiscount` (`paymentId`, `discountId`, y conviene **snapshotear** el `percentage` aplicado en cada fila para que el desglose histórico no cambie si luego se edita el descuento). Quitar `discountId`/`discount` y el `@@index([discountId])` de `Payment`. Migración `payment_multiple_discounts`.
  - **API:** `CheckoutReservationDto`: `discountId?: number` → `discountIds?: number[]`. En `checkOut()`: validar que **cada** descuento exista y esté activo; **decisión de negocio a fijar (registrar en `docs/technical-debt.md`):** ¿los porcentajes se **suman** sobre el subtotal (10%+15% = 25%) o se aplican **en cascada** (compuestos)? y **tope del 100%**. Persistir una fila `PaymentDiscount` por descuento y guardar el `discountAmount` total agregado.
  - **Respuestas:** donde hoy se expone `payment.discount` (p. ej. `flattenPayment`/include de pagos) pasar a exponer `discounts` como arreglo.
  - **Front:** el diálogo de checkout (`apps/web/.../servicio`) cambia el `Select` de descuento único por **selección múltiple** (checkboxes/multi-select) y muestra el desglose sumando todos los aplicados.

---

## Dependencias

M1 → (M2 aditivo) → M3 (necesita M2) → M4 → M5 → M6 (T026–T031 independientes) → M7 (T032–T035 independientes; T034 y T035 ambas tocan `Discount`/`Payment` pero no dependen entre sí). Cualquier milestone es punto de corte válido.
