# Changelog — Lumina Resort PMS

Registro de lo ya resuelto. Lo pendiente vive en `ROADMAP.md`.
Cada entrada sintetiza **qué se hizo** y **por qué**, como contexto para conversaciones futuras.

---

## Milestone 1 — Guest (T001–T007)
`Guest` como entidad propia con `nationalId`. Backfill y `guestId NOT NULL` consolidados en la migración `add_guest_normalize_reservation`. Módulo `guests`, formulario de reserva con buscar-por-DNI y página `/dashboard/huespedes`.
**Por qué:** normalizar los datos del huésped fuera de `Reservation` (antes iban inline), evitando duplicación y permitiendo reusar al huésped entre reservas.

## Milestone 2 — Room Charges (T008–T010)
`ExpenseCategory` + `RoomCharge`, módulo `room-charges` y panel de cargos en `/dashboard/servicio`.
**Por qué:** registrar consumos extra por reserva (no solo la habitación) como entidad propia, clasificados por categoría.

## Milestone 3 — Payment + Descuentos (T011–T014)
`Discount` + `Payment` desacoplado con desglose (`Prisma.Decimal`), `checkOut` refactorizado, diálogo de checkout con desglose. Eliminados `totalAmount`/`paymentMethod`/`paidAt` de `Reservation`. Aquí se introdujo el sistema de seeds reejecutable.
**Por qué:** el cobro es un hecho con vida propia (método, montos, quién y cuándo); sacarlo de `Reservation` lo normaliza y permite el desglose histórico.

## Milestone 4 — Audit Log (T015–T019)
`AuditAction` + `AuditLog`, `AuditService` `@Global()`, instrumentación en reservas/empleados/habitaciones, `GET /audit-logs` (`@Roles('OWNER')`) y página `/dashboard/auditoria`.
**Por qué:** trazabilidad central de quién hizo qué (CREATE/UPDATE/CANCEL/CHECKIN/CHECKOUT) con el empleado que ejecutó la acción.

## Milestone 5 — Pulido y filtros (T020–T023)
`createdBy` (FK → Employee, nullable, `ON DELETE SET NULL`) en `Reservation` vía `add_reservation_created_by`; `POST /reservations` guarda el empleado del JWT; `reservationInclude`/`flattenReservation` exponen `creator` y `/dashboard/reservas` mostró la columna «Creada por». Filtros server-side `from`/`to`/`roomId` + estado combinados (selector de habitación desde `GET /rooms`; búsqueda por texto sigue client-side).
**Por qué:** registrar autoría de la reserva y dar filtros operativos. **Nota:** la columna «Creada por» se revertirá en T032 (redundante con `AuditLog` y no debe verla el personal).

## Milestone 6 — Normalización de enums a tablas (T025–T030)
Patrón único de migración (crear catálogo → sembrar → FK nullable → backfill → drop del enum/columna), con seed reejecutable por catálogo:
- **T025 JobPosition** — `position: String?` → tabla `JobPosition`; contrato `cargo` por nombre intacto.
- **T026 Shift** — `enum Shift` → tabla `Shift` (`add_shift_table`); mapeo por nombre (`TURNO_TO_SHIFT_NAME`), contrato `turno` (MAÑANA/TARDE/NOCHE) intacto.
- **T027 PaymentMethod** — `enum PaymentMethod` → tabla `PaymentMethod`; `checkOut` resuelve nombre→id, `flattenPayment` aplana a string, contrato (CASH/CARD/TRANSFER) intacto.
- **T028 RoomType** — `enum RoomType` → tabla `RoomType`; DTOs con `@IsIn`, servicio resuelve por `connect`, `flattenType` aplana a string. Contrato (SINGLE/DOUBLE/SUITE) intacto.
- **T029 RoomStatus** — `enum RoomStatus` → tabla `RoomStatus`; transiciones check-in/out por `connect`, colores del front mapeados por `name`. Contrato intacto.
- **T030 ReservationStatus** — `enum ReservationStatus` → tabla `ReservationStatus`; cada `status === '...'` pasa a comparar por `name`, `create` fija `PENDING`, filtro y anti-solapamiento por `{ name }`. `create` pasó a `connect` de relaciones. Contrato intacto.

**Por qué:** convertir atributos resueltos con `enum` en tablas-catálogo con FK (confirmado con el profesor como parte de la normalización), manteniendo el contrato HTTP por nombre para no romper el front.

## Milestone 7 — Fidelidad de campos
- **T033 Reservation — rename de tarifa** *(parcial)*: renombrado `pricePerNight` → `rateSnapshot` (migración `reservation_field_fidelity` + `drop_reservation_derived_fields`).
  **Por qué / qué se descartó:** la tarea originalmente proponía agregar `totalNights` y `roomTotal` denormalizados "por fidelidad con el modelo del profesor", pero esa premisa venía de un diagrama generado por IA, **no** de un requisito real (el profesor exige BD **100% normalizada**). Ambos campos eran derivables (`totalNights` de `checkIn`/`checkOut`; `roomTotal` de `rateSnapshot × noches` y ya presente en `Payment`), así que se revirtieron. El total se deriva on-read en `checkOut` y se persiste solo en `Payment`. Sobrevive solo el rename, que es un *snapshot* legítimo (no reconstruible desde `Room.price` actual) y mejor nombre.
