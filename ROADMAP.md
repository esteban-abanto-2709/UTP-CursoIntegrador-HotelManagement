# Roadmap — Lumina Resort PMS

**Proyecto:** Lumina Resort PMS — Curso Integrador UTP  
**Stack:** NestJS + Prisma + PostgreSQL · Next.js 16 + TailwindCSS  
**Infraestructura:** Render (API) · Vercel (Web) · Supabase (BD)

---

## Convención de trabajo con Prisma

Cada tarea que toca la base de datos sigue este flujo fijo:

1. Claude Code modifica `schema.prisma`
2. **Tú corres:** `npx prisma migrate dev --create-only --name <nombre>`
3. Claude Code revisa y ajusta el `migration.sql` generado
4. **Tú aplicas la migración**

Este flujo se repite en cada milestone. Claude Code nunca corre los comandos de migración.

---

## Base construida — no se toca

Lo siguiente ya está completo y desplegado:

- Auth JWT + roles (OWNER / MANAGER / EMPLOYEE)
- CRUD Empleados y Habitaciones (con precio por noche)
- Dashboard de estados físicos en tiempo real + Housekeeping
- Reservas: creación con flujo fecha-primero, validación de overbooking por solapamiento
- Check-in / Check-out con cobro simple (noches × tarifa, método de pago)
- Edición y cancelación de reservas en estado PENDING
- Calendario / Timeline de ocupación por semana
- Filtro de reservas por estado en la UI

---

## Milestone 1 — Guest como entidad propia

> El modelo del profesor separa al huésped de la reserva. Hoy `guestName` y `dni`
> son strings sueltos en `Reservation`. Aquí se convierten en un `Guest` real con
> historial de estadías. Si el tiempo no alcanza para más, este milestone ya
> demuestra que el modelo relacional está correcto.

**Workflow:** En el formulario de reserva, el empleado ingresa el DNI del cliente
y presiona un botón "Buscar". Si el huésped existe, se cargan sus datos en los campos.
Si no existe, los campos quedan editables para crearlo en ese momento. Esos mismos
campos permiten actualizar datos del huésped antes de confirmar la reserva.

### Prisma / BD

- ✅ **[T001]** Modificar `schema.prisma`: agregar modelo `Guest` con campos `nationalId` (unique), `fullName`, `email` (nullable), `phone` (nullable), `registeredAt`. Agregar campo `guestId` (FK → Guest, nullable) al modelo `Reservation`. → **Tú corres:** `npx prisma migrate dev --create-only --name add_guest_model` → Claude Code revisa y ajusta el `migration.sql` → **Tú aplicas.**
- ✅ **[T002]** Escribir script `prisma/seed-guests.ts`: recorrer todas las `Reservation` existentes, hacer upsert de `Guest` por `dni`, asociar el `guestId` resultante a cada reserva. → **Tú corres el script una sola vez** tras aplicar la migración anterior. *(Consolidado: el backfill se hizo como data migration en SQL dentro de la misma migración `add_guest_normalize_reservation`, sin script aparte.)*
- ✅ **[T003]** Modificar `schema.prisma`: hacer `guestId` NOT NULL en `Reservation` (una vez que el seed ya pobló todos los registros). Eliminar campos `guestName` y `dni` del modelo `Reservation`. → **Tú corres:** `npx prisma migrate dev --create-only --name guest_fk_not_null` → Claude Code revisa y ajusta el `migration.sql` → **Tú aplicas.** *(Consolidado en la misma migración `add_guest_normalize_reservation`: backfill → guestId NOT NULL → drop de `guestName`/`dni`.)*

### API

- ✅ **[T004]** Crear módulo NestJS `guests` con endpoints: `GET /guests?search=` (buscar por DNI o nombre), `POST /guests` (crear), `PATCH /guests/:id` (actualizar datos). Proteger con `JwtAuthGuard`.
- ✅ **[T005]** Actualizar `POST /reservations` y `PATCH /reservations/:id`: el DTO recibe `nationalId`, `fullName`, `email`, `phone`. El servicio hace upsert del `Guest` por `nationalId` y asocia el `guestId` a la reserva. Eliminar `guestName` y `dni` del DTO y de todas las queries.

### Frontend

- ✅ **[T006]** Agregar ruta `api.guests` en `routes.ts`. Actualizar el formulario de reserva (`ReservationFormDialog.tsx`): agregar campo DNI con botón "Buscar" que llama a `GET /guests?search={dni}`. Si hay resultado, rellenar automáticamente nombre, email y teléfono. Si no hay resultado, dejar los campos editables para crear el huésped. Los datos del huésped van en el mismo payload al guardar la reserva. *(Incluyó migrar `reservas/page.tsx` y el calendario al objeto `guest` anidado del nuevo contrato; el frontend leía aún `guestName`/`dni`.)*
- ✅ **[T007]** Crear página `/dashboard/huespedes`: tabla con búsqueda en tiempo real por nombre o DNI, columna con cantidad de reservas históricas, más diálogo de detalle con el historial de estadías (`GET /guests/:id`). Agregar enlace en el sidebar (visible para los tres roles).

---

## Milestone 2 — Cargos a la habitación (Room Charges)

> Cubre la entidad `ROOM_CHARGE` del modelo del profesor. Permite que cualquier
> empleado registre consumos extra durante la estadía desde la página de servicio.
> Al hacer check-out esos cargos se suman automáticamente al total.

**Workflow:** Desde `/dashboard/servicio`, el empleado ve las reservas con estado
ACTIVE. Selecciona una y puede agregar cargos adicionales (categoría + descripción
- monto). Los cargos quedan asociados a la reserva y se acumulan hasta el check-out.
Cualquier empleado con sesión activa puede registrar cargos.

### Prisma / BD

- ✅ **[T008]** Modificar `schema.prisma`: agregar modelo `ExpenseCategory` con campo `name`. Agregar modelo `RoomCharge` con campos: `reservationId` (FK → Reservation), `categoryId` (FK → ExpenseCategory), `registeredBy` (FK → Employee), `description`, `amount`, `chargedAt`. → **Tú corres:** `npx prisma migrate dev --create-only --name add_room_charges` → Claude Code revisa y ajusta el `migration.sql` → **Tú aplicas.** Luego Claude Code corre el seed de categorías: Room Service, Minibar, Lavandería, Daños, Otros.

### API

- ✅ **[T009]** Crear módulo NestJS `room-charges` con endpoints: `POST /reservations/:id/charges` (crear cargo; validar que la reserva esté en estado ACTIVE), `GET /reservations/:id/charges` (listar cargos con categoría). Accesible a cualquier empleado con JWT válido. Crear endpoint `GET /expense-categories` para poblar el selector del frontend.

### Frontend

- ✅ **[T010]** Agregar rutas `api.reservations.charges` y `api.expenseCategories` en `routes.ts`. Actualizar `/dashboard/servicio`: mostrar lista de reservas ACTIVE (llamar a `GET /reservations?status=ACTIVE`). Al seleccionar una reserva, mostrar panel o modal con: lista de cargos existentes y formulario para agregar nuevo cargo (select de categoría + descripción + monto + botón guardar). Mostrar subtotal de cargos acumulados.

---

## Milestone 3 — Payment desacoplado con descuentos

> Cubre las entidades `PAYMENT` y `DISCOUNT` del modelo del profesor. Hoy el cobro
> es `totalAmount` + `paymentMethod` dentro de `Reservation`. Aquí se separa en su
> propio modelo `Payment` con desglose completo. `Reservation` deja de guardar datos
> de cobro.

**Workflow:** El diálogo de check-out se expande para mostrar el desglose completo:
subtotal de habitación, subtotal de cargos adicionales, descuento seleccionado
(opcional) y gran total. El empleado elige método de pago y descuento, confirma,
y se crea el registro `Payment`. El resumen queda visible en pantalla. No se genera PDF.

### Prisma / BD

- ✅ **[T011]** Modificar `schema.prisma`: agregar modelo `Discount` con campos `name`, `description`, `percentage`, `isActive`. Agregar modelo `Payment` con campos: `reservationId` (FK → Reservation, unique), `processedBy` (FK → Employee), `paymentMethod` (enum PaymentMethod existente), `discountId` (FK → Discount, nullable), `roomTotal`, `chargesTotal`, `subtotal`, `discountAmount`, `grandTotal`, `processedAt`. Eliminar campos `totalAmount`, `paymentMethod` y `paidAt` del modelo `Reservation`. → **Tú corres:** `npx prisma migrate dev --create-only --name add_payment_model` → Claude Code revisa y ajusta el `migration.sql` → **Tú aplicas.** Luego Claude Code corre el seed de descuentos de ejemplo. *(Ajustes: el `migration.sql` incluye una data-migration que respalda los cobros existentes de `Reservation` en `Payment` antes de borrar las columnas — placeholder `processedBy`, ver [TD-006]. El seed de descuentos NO se embebió en la migración: se construyó el sistema de seeds reejecutable de `notas.md` — `prisma/seed.ts` + `prisma/seeds/` + `migrations.seed` en `prisma.config.ts` — que adelanta la infraestructura de [TD-005]. `Discount.name` quedó `@unique` para el `upsert`.)*

### API

- ✅ **[T012]** Crear módulo NestJS `discounts` con endpoint `GET /discounts?active=true`. Crear módulo NestJS `payments` con endpoint `GET /payments/:reservationId` (detalle del pago de una reserva). *(Ajustes: `GET /discounts` filtra `isActive=true` solo con `?active=true`, sin el param devuelve todos. `GET /payments/:reservationId` responde 404 si la reserva no tiene pago e incluye `discount` + `employee` con `select` de `id/firstName/lastName` para no exponer el hash de contraseña.)*
- ✅ **[T013]** Refactorizar `checkOut` en `reservations.service.ts`: el DTO recibe `paymentMethod` y `discountId` (nullable). Dentro de una transacción Prisma: calcular `roomTotal = nights × pricePerNight`, `chargesTotal = suma de RoomCharges de la reserva`, `subtotal = roomTotal + chargesTotal`, `discountAmount = subtotal × percentage / 100` si hay descuento (sino 0), `grandTotal = subtotal - discountAmount`. Crear registro `Payment` con ese desglose. Eliminar la escritura de `totalAmount`, `paymentMethod` y `paidAt` de `Reservation` (ya no existen en el schema). *(Ajustes: el cálculo usa `Prisma.Decimal` en vez de `Number` para evitar errores de redondeo en dinero. El `checkOut` recibe el empleado vía `@CurrentUser()` para `processedBy`. Si llega `discountId`: 404 si no existe, 400 si está inactivo. La respuesta devuelve `{ message, reservation, payment }` (ya no `billing`). Esto desbloqueó el build, que estaba roto desde T011 por la escritura de columnas eliminadas.)*

### Frontend

- ✅ **[T014]** Agregar rutas `api.discounts` y `api.payments` en `routes.ts`. Actualizar el diálogo de check-out: al abrirse, llamar a `GET /reservations/:id/charges` y `GET /discounts?active=true` en paralelo. Mostrar desglose: fila "Habitación (N noches × S/. X)", fila "Cargos adicionales (S/. X)", selector de descuento activo (opcional), fila "**Total a cobrar (S/. X)**". Selector de método de pago. Al confirmar, enviar `paymentMethod` y `discountId` al endpoint de checkout. Actualizar la columna de monto en la tabla de reservas para leer del `Payment` asociado. *(Ajustes: para que la columna leyera el `Payment` sin N peticiones extra, se agregó `payment` (select de `grandTotal` + `paymentMethod`) al `reservationInclude` del backend — único toque de API. De paso se corrigió el bug latente de T011: la tabla aún leía `totalAmount`/`paymentMethod` ya eliminados del modelo y mostraba `S/. 0.00` en toda reserva COMPLETED. El desglose del diálogo se calcula en el front solo para previsualización; el cobro real lo recalcula el backend con `Prisma.Decimal`. `api.payments.getByReservation` se añadió por completitud aunque el flujo elegido (total + método en la columna, sin diálogo de recibo) no lo consume todavía.)*

---

## Milestone 4 — Audit Log

> Cubre las entidades `AUDIT_ACTION` y `AUDIT_LOG` del modelo del profesor.
> Registra quién hizo qué y cuándo sobre todas las entidades críticas.
> Visible solo para OWNER desde una página dedicada.

**Acciones registradas:** crear reserva, editar reserva, cancelar reserva, check-in,
check-out, crear empleado, editar empleado, crear habitación, editar habitación,
cambiar estado de habitación.

### Prisma / BD

- ✅ **[T015]** Modificar `schema.prisma`: agregar modelo `AuditAction` con campo `name`. Agregar modelo `AuditLog` con campos: `employeeId` (FK → Employee), `actionId` (FK → AuditAction), `tableName`, `recordId`, `previousValue` (String, nullable), `newValue` (String, nullable), `performedAt`. → **Tú corres:** `npx prisma migrate dev --create-only --name add_audit_log` → Claude Code revisa y ajusta el `migration.sql` → **Tú aplicas.** Luego Claude Code corre el seed de acciones: CREATE, UPDATE, DELETE, CHECKIN, CHECKOUT, CANCEL. *(Ajustes: `AuditAction.name` quedó `@unique` para el upsert del seed, coherente con `ExpenseCategory`/`Discount`. Se añadió índice en `AuditLog.tableName` además de los dos FK, anticipando el filtro de [T018]. Migración puramente aditiva, sin data-migration. El seed se integró como `seeds/audit-actions.ts` en el orquestador `seed.ts` reejecutable.)*

### API

- ✅ **[T016]** Crear `AuditService` en NestJS como provider global (registrar en `AppModule`). Método principal: `log(employeeId: number, action: string, tableName: string, recordId: number, prev?: object, next?: object)`. El servicio busca el `AuditAction` por nombre y crea el registro. El `employeeId` lo recibe como parámetro desde el controlador vía `@CurrentUser()`. *(Ajustes: `AuditModule` quedó `@Global()` y exporta `AuditService`, evitando importarlo en cada feature. `log()` hace `return` silencioso si no encuentra el `AuditAction`, de modo que la auditoría nunca tumba la operación de negocio por un nombre de acción mal escrito.)*
- ✅ **[T017]** Inyectar `AuditService` en `ReservationsService`, `EmployeesService` y `RoomsService`. Agregar llamada a `auditService.log(...)` en cada operación: crear reserva (CREATE), editar reserva (UPDATE, con `prev` y `next`), cancelar reserva (CANCEL, con `prev`), check-in (CHECKIN), check-out (CHECKOUT), crear empleado (CREATE), editar empleado (UPDATE), crear habitación (CREATE), editar habitación (UPDATE), cambiar estado de habitación (UPDATE). *(Ajustes: se enhebró `@CurrentUser()` en los controladores de reservas y habitaciones —employees ya lo pasaba—. `tableName` usa el nombre del modelo Prisma: `Reservation`/`Employee`/`Room`. En empleados se loguea la forma en español sin el hash de password. No se audita el `updateStatus` de reserva: el ROADMAP solo lista el cambio de estado de habitación.)*
- ✅ **[T018]** Crear endpoint `GET /audit-logs` protegido con `@Roles('OWNER')`, con filtros opcionales por query params: `tableName`, `employeeId`, `from`, `to`. Retornar con `include` de `employee` (nombre) y `action` (nombre). *(Ajustes: `from`/`to` filtran sobre `performedAt`, orden descendente. `employee` se devuelve con un `select` sin password. `previousValue`/`newValue` se devuelven parseados a objeto JSON, con fallback al string crudo si no parsea.)*

### Frontend

- ✅ **[T019]** Agregar ruta `api.auditLogs` en `routes.ts`. Crear página `/dashboard/auditoria`: tabla con columnas fecha/hora, empleado, acción, entidad, ID del registro. Filtros en barra superior: selector de entidad, selector de empleado, rango de fechas. Ocultar enlace del sidebar para MANAGER y EMPLOYEE. Proteger con `ProtectedRoute` validando rol OWNER. *(Ajustes: filtros con `<select>` nativo + inputs `date` siguiendo el patrón del formulario de reservas; clic en fila abre diálogo con el `previousValue`/`newValue` (antes/después) que el backend ya envía. La protección por rol replica el patrón existente de rooms/staff —solo se oculta el enlace del sidebar por `allowedRoles: ["OWNER"]`; el guard real es el backend `@Roles('OWNER')`—; no se añadió guard de rol a nivel de página, registrado en [TD-008].)*

---

## Milestone 5 — Pulido y filtros *(opcional si el tiempo no alcanza)*

> Flecos que mejoran la experiencia sin agregar entidades nuevas al modelo.
> El sistema es completamente funcional sin este milestone.

### Prisma / BD

- **[T020]** Modificar `schema.prisma`: agregar campo `createdBy` (FK → Employee) al modelo `Reservation`. → **Tú corres:** `npx prisma migrate dev --create-only --name add_reservation_created_by` → Claude Code revisa y ajusta el `migration.sql` → **Tú aplicas.**

### API

- **[T021]** Actualizar `POST /reservations`: leer `employeeId` del JWT con `@CurrentUser()` y guardarlo en `createdBy` al crear la reserva.

### Frontend

- **[T022]** Agregar filtros de fecha y cuarto en `/dashboard/reservas`: input fecha inicio, input fecha fin, selector de habitación (poblado desde `GET /rooms`). Se combinan con el filtro de estado ya existente. Agregar ruta con los query params `from`, `to`, `roomId` en `routes.ts`.
- **[T023]** Mostrar nombre del empleado que creó la reserva como columna opcional en la tabla de reservas (leer del `include` de `createdBy`).

### Opcional — Deuda técnica TD-001

- **[T024]** *(Solo si hay tiempo)* Agregar constraint de BD contra doble-reserva a nivel de PostgreSQL: en el `migration.sql` incluir raw SQL para habilitar extensión `btree_gist` y crear `EXCLUDE USING gist` sobre `(roomId, tsrange("checkIn", "checkOut", '[)'))`. Blinda la condición de carrera donde dos requests simultáneos pasan ambos la validación de aplicación.

---

## Milestone 6 — Normalización de enums a tablas relacionales *(opcional, confirmado con el profesor)*

> El modelo del profesor representa como **tablas relacionales con FK** varios atributos
> que hoy resolvemos con `enum` de Prisma (o un `String?` libre). La migración quedó
> **aplazada y confirmada como opcional con el profesor**: el sistema es completamente
> funcional con los enums actuales. Este milestone existe para documentar el camino
> exacto de cada conversión cuando el tiempo lo permita.
>
> **Patrón común a todas las tareas** (idéntico al usado en el Guest, T001–T003):
> crear la tabla catálogo + seed → agregar la FK nullable → backfill desde el enum/string
> actual → poner la FK `NOT NULL` y eliminar el enum/columna vieja → actualizar API
> (DTOs, services, `include`) → actualizar frontend (selectores poblados desde el catálogo,
> lectura del objeto anidado). Las siete son **independientes entre sí**; se pueden hacer
> en cualquier orden o cortar en cualquier punto. Van de menos a más compleja por blast radius.

### [T025] JOB_POSITION — `position: String?` → tabla `JobPosition`

- **[T025]** *(La más simple: hoy es texto libre.)* **Enfoque de una sola migración** (a diferencia del patrón de dos migraciones del resto del milestone): se crea la tabla, se backfillea y se elimina la columna vieja todo de una. Modificar `schema.prisma`: agregar modelo `JobPosition` (`id`, `name @unique`), agregar campo `positionId` (FK → JobPosition, **nullable** — el owner sembrado no tiene puesto, un `NOT NULL` rompería el backfill) en `Employee` y **eliminar** el campo `position: String?`. → **Tú corres:** `pnpm prisma migrate dev --create-only --name add_job_position_table` → Claude Code ajusta el `migration.sql` para que, en esa única migración: cree la tabla `JobPosition`, agregue `positionId`, siembre los puestos (`Manager`, `Recepcionista`, `Botones`, `Limpieza`), backfillee `positionId` desde el texto actual de `position` y **recién entonces** haga `DROP COLUMN position` → **Tú aplicas.** Como **no se contempla CRUD de puestos en API/UI**, el catálogo se mantiene vía seed (`prisma/seeds/job-positions.ts`, registrado en `seed.ts`). **Normalización interna, contrato intacto:** el endpoint sigue recibiendo y devolviendo `cargo` por **nombre** — solo cambia el almacenamiento en `employees.service` (resuelve nombre→`positionId` al escribir, lee `jobPosition.name` al leer). No se agrega endpoint nuevo ni se toca el formulario del front; `CARGO_TO_ROLE` y todo el RBAC quedan igual.

### [T026] SHIFT — `enum Shift` → tabla `Shift`

- **[T026]** *(Enum solo-label en `Employee`, sin lógica asociada.)* Modificar `schema.prisma`: agregar modelo catálogo de turnos (`id`, `name @unique`; valores MORNING/AFTERNOON/NIGHT) y campo `shiftId` (FK, nullable) en `Employee`. → **Tú corres:** `npx prisma migrate dev --create-only --name add_shift_table` → Claude Code revisa y ajusta el `migration.sql` (seed de turnos + backfill de `shiftId` desde el enum `shift`) → **Tú aplicas.** Segunda migración `drop_shift_enum`: eliminar el campo `shift Shift?` y el `enum Shift`. Actualizar DTO/servicio de empleados (`shiftId`) y el selector del formulario (`GET /shifts`).

### [T027] PAYMENT_METHOD — `enum PaymentMethod` → tabla `PaymentMethod`

- **[T027]** *(Enum usado solo en el flujo de checkout/`Payment`, pocos consumidores.)* Modificar `schema.prisma`: agregar modelo catálogo de métodos de pago (`id`, `name @unique`; valores CASH/CARD/TRANSFER) y campo `paymentMethodId` (FK, nullable) en `Payment`. → **Tú corres:** `npx prisma migrate dev --create-only --name add_payment_method_table` → Claude Code revisa y ajusta el `migration.sql` (seed + backfill de `paymentMethodId` desde `paymentMethod`) → **Tú aplicas.** Segunda migración `drop_payment_method_enum`: eliminar el campo `paymentMethod PaymentMethod` y el `enum PaymentMethod`. Actualizar el `checkOut` (recibe `paymentMethodId`), el `include` del `Payment` en las queries de reservas, y el selector de método de pago en el diálogo de checkout (`GET /payment-methods`).

### [T028] ROOM_TYPE — `enum RoomType` → tabla `RoomType`

- **[T028]** *(Enum en `Room` presente en selectores y display; sin transiciones de estado.)* Modificar `schema.prisma`: agregar modelo catálogo de tipos de habitación (`id`, `name @unique`; valores SINGLE/DOUBLE/SUITE) y campo `typeId` (FK, nullable) en `Room`. → **Tú corres:** `npx prisma migrate dev --create-only --name add_room_type_table` → Claude Code revisa y ajusta el `migration.sql` (seed + backfill de `typeId` desde `type`) → **Tú aplicas.** Segunda migración `drop_room_type_enum`: eliminar el campo `type RoomType` y el `enum RoomType`. Actualizar DTO/servicio de habitaciones (`typeId`), el `include` del `type` en las queries, y el selector del formulario de habitación (`GET /room-types`).

### [T029] ROOM_STATUS — `enum RoomStatus` → tabla `RoomStatus`

- **[T029]** *(Más complejo: el estado físico alimenta el dashboard de housekeeping, los colores semánticos de `globals.css` y las transiciones de check-in/check-out.)* Modificar `schema.prisma`: agregar modelo catálogo de estados físicos (`id`, `name @unique`; valores AVAILABLE/OCCUPIED/CLEANING/MAINTENANCE) y campo `statusId` (FK, nullable) en `Room`. → **Tú corres:** `npx prisma migrate dev --create-only --name add_room_status_table` → Claude Code revisa y ajusta el `migration.sql` (seed + backfill de `statusId` desde `status`) → **Tú aplicas.** Segunda migración `drop_room_status_enum`: eliminar el campo `status RoomStatus` y el `enum RoomStatus`. Actualizar el servicio de habitaciones (lectura/escritura de estado, transiciones de check-in/out que tocan el estado de la habitación), el `include` del estado, y el dashboard/housekeeping del front (los colores semánticos deben mapearse por `name` del catálogo, no por el enum).

### [T030] RESERVATION_STATUS — `enum ReservationStatus` → tabla `ReservationStatus`

- **[T030]** *(Alto acoplamiento: el estado gobierna todo el ciclo de vida — PENDING→ACTIVE→COMPLETED/CANCELLED —, los filtros de la UI, la validación de overbooking y check-in/check-out.)* Modificar `schema.prisma`: agregar modelo catálogo de estados de reserva (`id`, `name @unique`; valores PENDING/ACTIVE/COMPLETED/CANCELLED) y campo `statusId` (FK, nullable) en `Reservation`. → **Tú corres:** `npx prisma migrate dev --create-only --name add_reservation_status_table` → Claude Code revisa y ajusta el `migration.sql` (seed + backfill de `statusId` desde `status`) → **Tú aplicas.** Segunda migración `drop_reservation_status_enum`: eliminar el campo `status ReservationStatus` y el `enum ReservationStatus`. **Riesgo:** cada comparación `status === 'ACTIVE'` / `'PENDING'` en services, guards de transición, filtro `?status=` y UI debe pasar a comparar contra el `name` del catálogo (o resolver el `statusId` por nombre). Conviene un mapa de constantes nombre→id cargado al arrancar para no romper la lógica.

### [T031] ROLE — `enum Role` → tabla `Role`

- **[T031]** *(La de mayor blast radius: el rol atraviesa todo el RBAC — `@Roles()`, `RolesGuard`, payload del JWT, `useAuthStore` y los `allowedRoles` del sidebar/`ProtectedRoute`.)* Modificar `schema.prisma`: agregar modelo catálogo de roles (`id`, `name @unique`; valores OWNER/MANAGER/EMPLOYEE) y campo `roleId` (FK, nullable) en `Employee`. → **Tú corres:** `npx prisma migrate dev --create-only --name add_role_table` → Claude Code revisa y ajusta el `migration.sql` (seed + backfill de `roleId` desde `role`) → **Tú aplicas.** Segunda migración `drop_role_enum`: eliminar el campo `role Role` y el `enum Role`. **Riesgo:** el JWT y el `@CurrentUser()` deben seguir exponiendo el nombre del rol (string) para que `@Roles('OWNER', …)`, `RolesGuard` y los chequeos del frontend no cambien su contrato; internamente se resuelve el `roleId` por nombre. Hacer esta tarea al final, cuando el resto ya esté estable.

---

## Milestone 7 — Fidelidad final con el modelo del profesor *(opcional)*

> Tres huecos sueltos detectados al contrastar el schema actual contra el modelo ER
> del profesor. Ninguno justifica un milestone propio, pero comparten el mismo motivo:
> **igualar exactamente las entidades del profesor**. Se agrupan aquí como milestone de
> cierre. Las tres tareas son **independientes entre sí** y de cualquier otro milestone.

### [T032] createdBy en Room

- **[T032]** *(Paralelo a `createdBy` en `Reservation` —T020/T021/T023—: el modelo del profesor exige registrar qué empleado creó la habitación.)* Modificar `schema.prisma`: agregar campo `createdBy` (FK → Employee, **nullable** — las habitaciones existentes no tienen creador, no hace falta backfill) al modelo `Room`. → **Tú corres:** `npx prisma migrate dev --create-only --name add_room_created_by` → Claude Code revisa y ajusta el `migration.sql` → **Tú aplicas.** Actualizar `POST /rooms`: leer `employeeId` del JWT con `@CurrentUser()` y guardarlo en `createdBy`. En el front, mostrar el nombre del empleado creador como columna opcional en la tabla de habitaciones (leer del `include` de `createdBy`).

### [T033] Reservation — fidelidad de campos

- **[T033]** *(Ajustar los campos de `Reservation` a los nombres/forma del modelo del profesor.)* Modificar `schema.prisma`: renombrar `pricePerNight` → `rateSnapshot` (snapshot de tarifa al momento de reservar), agregar `totalNights` (Int, noches calculadas) y `roomTotal` (`Decimal(10,2)`, `rateSnapshot × totalNights`). → **Tú corres:** `npx prisma migrate dev --create-only --name reservation_field_fidelity` → Claude Code revisa y ajusta el `migration.sql` (rename de columna preservando datos + backfill de `totalNights`/`roomTotal` desde las reservas existentes) → **Tú aplicas.** Actualizar el `checkOut` y demás queries que hoy leen `pricePerNight` para usar `rateSnapshot`; poblar `totalNights`/`roomTotal` al crear/confirmar la reserva. **Riesgo / decisión pendiente:** `roomTotal` y `totalNights` **duplican** lo que `Payment` ya calcula en el check-out (`roomTotal`, noches). El modelo del profesor los quiere denormalizados en `Reservation`; antes de implementar, decidir entre (a) aceptar la denormalización como en el modelo del profesor o (b) dejarlos como campos derivados calculados on-read. Registrar la decisión en `docs/technical-debt.md` cuando se ataque la tarea.

### [T034] DISCOUNT_TYPE — tabla `DiscountType` + `typeId` en `Discount`

- **[T034]** *(Mismo patrón de tabla-catálogo del Milestone 6: el modelo del profesor exige que los descuentos tengan un tipo, y `Discount` aún no lo tiene. Sin pantalla propia.)* Modificar `schema.prisma`: agregar modelo `DiscountType` (`id`, `name @unique`), agregar a `Discount` el campo `typeId` (FK → DiscountType, nullable) y `createdAt` (`@default(now())`). → **Tú corres:** `npx prisma migrate dev --create-only --name add_discount_type_table` → Claude Code revisa y ajusta el `migration.sql` (seed de tipos —p. ej. SEASONAL, LOYALTY, PROMOTIONAL, CORPORATE— + backfill de `typeId` para los descuentos existentes) → **Tú aplicas.** Segunda migración `discount_type_not_null`: poner `typeId` `NOT NULL` una vez backfilleado. Actualizar el seed/servicio de descuentos para incluir `typeId`; el `GET /discounts` devuelve el `type` con `include`. No requiere pantalla nueva.

---

## Mapa de dependencias

```
Base construida
      │
      ▼
Milestone 1 — Guest
(schema → seed → fk not null → módulo guests → formulario reserva → página huéspedes)
      │
      ├──▶ Milestone 2 — Room Charges (aditivo, no depende de M1 para arrancar)
      │         │
      └─────────┤
                ▼
          Milestone 3 — Payment + Descuentos (depende de M2 para sumar cargos)
                │
                ▼
          Milestone 4 — Audit Log (aditivo sobre servicios existentes)
                │
                ▼
          Milestone 5 — Pulido y filtros (opcional)
                │
                ▼
          Milestone 6 — Normalización de enums a tablas (opcional)
          (7 tareas independientes T025–T031, en cualquier orden)
                │
                ▼
          Milestone 7 — Fidelidad final con el modelo del profesor (opcional)
          (3 tareas independientes T032–T034: createdBy Room, campos Reservation, DiscountType)
```

Cualquier milestone es un punto de corte válido.
El sistema queda funcional y coherente en cada uno de ellos.
