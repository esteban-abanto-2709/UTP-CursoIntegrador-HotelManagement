# Roadmap — Lumina Resort PMS

**Proyecto:** Lumina Resort PMS — Curso Integrador UTP  
**Stack:** NestJS + Prisma + PostgreSQL · Next.js 16 + TailwindCSS  
**Infraestructura:** Render (API) · Vercel (Web) · Supabase (BD)

---

## Base construida — no se toca

Lo siguiente ya está completo y desplegado. Es la fundación:

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

> **Para qué sirve:** El modelo del profesor separa al huésped de la reserva.
> Hoy `guestName` y `dni` son strings sueltos en `Reservation`.
> Aquí los convertimos en un `Guest` real, con su propio ID y
> la posibilidad de ver su historial de estadías.
> Si el tiempo no alcanza para más, este milestone ya demuestra
> que el modelo relacional está correcto.

- **[T001]** Agregar modelo `Guest` al schema de Prisma con campos: `nationalId` (unique), `fullName`, `email` (nullable), `phone` (nullable), `registeredAt`. Ejecutar `prisma migrate dev`.
- **[T002]** Escribir script de migración de datos: crear un `Guest` por cada `Reservation` existente (deduplicando por `dni`) y asociar el `guestId` a cada reserva. Correr el script una sola vez después de la migración de schema.
- **[T003]** Agregar campo `guestId` (FK → Guest) al modelo `Reservation` en Prisma. Marcar `guestName` y `dni` como `@deprecated` en comentarios (no borrar aún, para no romper queries existentes). Ejecutar `prisma migrate dev`.
- **[T004]** Crear módulo NestJS `guests` con endpoints: `GET /guests` (listado con búsqueda por nombre o DNI), `GET /guests/:id` (detalle con historial de reservas vía `include`).
- **[T005]** Actualizar `POST /reservations` y `PATCH /reservations/:id`: buscar o crear el `Guest` por `nationalId` antes de crear/editar la reserva. El DTO sigue recibiendo `guestName` y `dni` para no romper el frontend todavía.
- **[T006]** Agregar página `/dashboard/huespedes` en el frontend: tabla con búsqueda en tiempo real por nombre o DNI, columna de cantidad de reservas. Reutilizar componentes de tabla existentes. Agregar enlace en el sidebar.

---

## Milestone 2 — Cargos a la habitación (Room Charges)

> **Para qué sirve:** Cubre la entidad `ROOM_CHARGE` del modelo del profesor.
> Permite registrar consumos extra durante la estadía (minibar, room service,
> daños, lavandería) que luego suman al cobro en el check-out.
> Milestone completamente aditivo: no modifica nada de lo ya construido.

- **[T007]** Agregar modelos `ExpenseCategory` y `RoomCharge` al schema de Prisma. `ExpenseCategory` con campos `name` (semilla: Room Service, Minibar, Lavandería, Daños, Otros). `RoomCharge` con campos: `reservationId` (FK), `categoryId` (FK), `registeredBy` (FK → Employee), `description`, `amount`, `chargedAt`. Ejecutar `prisma migrate dev` + seed de categorías.
- **[T008]** Crear módulo NestJS `room-charges` con endpoints: `POST /reservations/:id/charges` (registrar cargo; solo en reservas ACTIVE), `GET /reservations/:id/charges` (listar cargos de la reserva con su categoría). Proteger con `JwtAuthGuard`.
- **[T009]** Agregar ruta `api.reservations.charges` en `apps/web/src/lib/routes.ts`. Actualizar el diálogo de check-out en el frontend: mostrar tabla de cargos de la reserva, formulario inline para agregar nuevo cargo (select de categoría + descripción + monto), subtotal de cargos debajo de la tabla.

---

## Milestone 3 — Payment desacoplado con descuentos

> **Para qué sirve:** Cubre las entidades `PAYMENT` y `DISCOUNT` del modelo del profesor.
> Hoy el cobro es `totalAmount` dentro de `Reservation`. Aquí lo separamos
> en su propio modelo `Payment` con desglose completo: habitación, cargos,
> descuento aplicado y gran total. Es el registro contable formal que le falta al sistema.

- **[T010]** Agregar modelos `Discount` al schema de Prisma con campos: `name`, `description`, `percentage`, `isActive`. Ejecutar `prisma migrate dev`. Crear seed con 2-3 descuentos de ejemplo (Descuento Empleado 10%, Promoción Temporada 15%).
- **[T011]** Agregar modelo `Payment` al schema de Prisma con campos: `reservationId` (FK, unique), `processedBy` (FK → Employee), `paymentMethod` (enum existente), `discountId` (FK → Discount, nullable), `roomTotal`, `chargesTotal`, `subtotal`, `discountAmount`, `grandTotal`, `processedAt`. Ejecutar `prisma migrate dev`.
- **[T012]** Crear módulo NestJS `discounts` con endpoint `GET /discounts?active=true` para que el frontend pueda poblar el selector.
- **[T013]** Refactorizar `checkOut` en `reservations.service.ts`: en lugar de escribir `paymentMethod` y `totalAmount` en `Reservation`, crear un registro en `Payment` dentro de la misma transacción de Prisma. Calcular: `roomTotal = nights × pricePerNight`, `chargesTotal = suma de RoomCharges de la reserva`, `subtotal = roomTotal + chargesTotal`, `discountAmount = subtotal × discount.percentage / 100` (si `discountId` viene en el DTO), `grandTotal = subtotal - discountAmount`. Limpiar los campos deprecados de `Reservation` (`totalAmount`, `paymentMethod`, `paidAt`) de las queries de respuesta.
- **[T014]** Actualizar el diálogo de check-out en el frontend: agregar selector de descuento activo (opcional, cargado desde `GET /discounts`), mostrar el desglose completo (subtotal habitación + subtotal cargos + descuento + **gran total**) antes de confirmar. Actualizar la columna de monto en la tabla de reservas para leer del `Payment` asociado.

---

## Milestone 4 — Audit Log

> **Para qué sirve:** Cubre la entidad `AUDIT_LOG` del modelo del profesor.
> Registra quién hizo qué y cuándo sobre las entidades críticas del sistema.
> Ideal para demos: se puede mostrar en vivo que cada acción queda trazada.

- **[T015]** Agregar modelos `AuditAction` y `AuditLog` al schema de Prisma. `AuditAction` con semilla de valores: CREATE, UPDATE, DELETE, CHECKIN, CHECKOUT, CANCEL. `AuditLog` con campos: `employeeId` (FK), `actionId` (FK), `tableName`, `recordId`, `previousValue` (String, JSON serializado), `newValue` (String, JSON serializado), `performedAt`. Ejecutar `prisma migrate dev` + seed de acciones.
- **[T016]** Crear `AuditService` en NestJS como provider global (registrar en `AppModule`). Método principal: `log(employeeId, actionName, tableName, recordId, prev?, next?)`. El `employeeId` se obtiene del JWT vía `@CurrentUser()` en cada endpoint. El servicio busca el `AuditAction` por nombre y crea el registro.
- **[T017]** Inyectar `AuditService` en los servicios de reservas, habitaciones y empleados. Agregar llamadas a `auditService.log(...)` en: crear reserva (CREATE), editar reserva (UPDATE), cancelar reserva (CANCEL), check-in (CHECKIN), check-out (CHECKOUT), cambiar estado de habitación (UPDATE), crear/editar empleado (CREATE / UPDATE).
- **[T018]** Crear endpoint `GET /audit-logs` en NestJS con filtros opcionales por `tableName`, `employeeId` y rango `from`/`to`. Proteger con `@Roles('OWNER')`. Crear página `/dashboard/auditoria` en el frontend: tabla paginada del log con filtros. Acceso visible solo para rol OWNER (ocultar enlace del sidebar para otros roles).

---

## Milestone 5 — Pulido final y deuda técnica *(opcional si el tiempo no alcanza)*

> **Para qué sirve:** Cierra los flecos que quedaron a medias y blindan el sistema
> a nivel de base de datos. Sin esto el proyecto funciona; con esto es robusto.

- **[T019]** Exponer en la UI los filtros de reservas por cuarto y por rango de fechas que ya existen en el API (`GET /reservations?roomId=&from=&to=`). Agregar inputs de filtro en la barra superior de `/dashboard/reservas`.
- **[T020]** Registrar `createdBy` (FK → Employee) al crear una reserva y al procesar el pago, leyendo el `employeeId` del JWT con `@CurrentUser()`. Agregar campo `createdBy` al modelo `Reservation` en Prisma. Ejecutar `prisma migrate dev`. Mostrar el nombre del empleado en la tabla de reservas como columna opcional.
- **[T021]** *(Opcional — deuda técnica TD-001)* Agregar constraint de BD contra doble-reserva: habilitar extensión `btree_gist` en PostgreSQL y crear `EXCLUDE USING gist` sobre `(roomId, tsrange(checkIn, checkOut, '[)'))` en una migración con raw SQL de Prisma. Blinda la condición de carrera donde dos requests simultáneos pasan ambos la validación de aplicación.
- **[T022]** *(Opcional — requerimiento del profesor)* Migrar enums `Role`, `RoomType`, `RoomStatus`, `ReservationStatus` de Prisma enums a modelos/lookup tables relacionales (`JobPosition`, `RoomType`, `RoomStatus`, `ReservationStatus` como tablas con FK). Solo hacer si hay tiempo disponible; el profesor confirmó que no es bloqueante para la nota.

---

## Milestone 6 — Extras opcionales *(fuera del alcance principal)*

> **Para qué sirve:** Tareas que estaban en el roadmap anterior y no entraron en los
> milestones de arriba, más mejoras de presentación. Ninguna es bloqueante: son
> "nice to have" para pulir la entrega o la demo. Tomar solo si sobra tiempo.

- **[T023]** *(Opcional)* Crear reserva con **click-y-arrastre** sobre un cuarto libre en el timeline de `/dashboard/calendario`. Al soltar, abrir el diálogo de nueva reserva con las fechas y la habitación prellenadas.
- **[T024]** *(Opcional)* Prueba E2E del flujo de disponibilidad temporal: (a) crear dos reservas solapadas para el mismo cuarto → la segunda debe rechazarse con `409`; (b) verificar que una reserva futura se puede crear aunque el cuarto esté `OCCUPIED` hoy.
- **[T025]** *(Opcional)* Documento de entrega: URL pública del sistema desplegado + credenciales de prueba para cada rol (OWNER / MANAGER / EMPLOYEE). Guardar en `docs/`.
- **[T026]** *(Opcional)* Rediseño de UI: agregar fotos de las habitaciones y mejorar la presentación visual general (cards, dashboard, detalle de reserva). El diseño concreto se definirá consultando a **Claude Design**; esta tarea es la implementación una vez que el diseño esté listo.

---

## Resumen visual de dependencias

```
Base construida
    │
    ▼
Milestone 1 — Guest (migración de datos, módulo guests, página huéspedes)
    │
    ▼
Milestone 2 — Room Charges (aditivo, no rompe nada)
    │
    ▼
Milestone 3 — Payment desacoplado + Descuentos (refactor checkout)
    │
    ▼
Milestone 4 — Audit Log (aditivo, solo inyección en servicios)
    │
    ▼
Milestone 5 — Pulido + deuda técnica (opcional)
    │
    ▼
Milestone 6 — Extras opcionales (calendario drag, E2E, doc de entrega, rediseño UI)
```

Cada milestone puede ser el punto de corte si el tiempo no alcanza.
El sistema queda funcional y coherente en cualquiera de ellos.

---

## Cómo trabajar este roadmap

Las tareas están pensadas para ejecutarse de a una. El flujo es:

1. `clear` para empezar limpio.
2. Indicar el **código de tarea** (ej. "hagamos T007").
3. Se implementa esa tarea completa.
4. `clear` y se continúa con la siguiente.

Las tareas marcadas *(Opcional)* no son bloqueantes para la nota ni para tener el sistema funcional.
