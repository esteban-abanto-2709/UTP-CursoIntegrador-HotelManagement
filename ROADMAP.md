# Roadmap: Sistema de Reservas con Disponibilidad Temporal

**Proyecto:** Lumina Resort PMS — Curso Integrador UTP
**Stack:** NestJS + Prisma + PostgreSQL · Next.js 16 + TailwindCSS
**Infraestructura:** Backend en Render · Frontend en Vercel · BD en Supabase

---

## El Problema Central

El sistema actual **confunde dos conceptos distintos** que parecen lo mismo:

1. **Estado físico de la habitación (`Room.status`)** — qué pasa con el cuarto *ahora mismo*:
   `AVAILABLE`, `OCCUPIED`, `CLEANING`, `MAINTENANCE`. Es un hecho de **tiempo presente**.
   Sirve para housekeeping, el dashboard en vivo y para autorizar un check-in.

2. **Disponibilidad temporal** — si el cuarto está libre **en un rango de fechas**.
   Es una **consulta sobre el tiempo**, que se calcula a partir de las reservas existentes.
   Sirve para *decidir si se puede reservar*.

Hoy el sistema valida las reservas contra el concepto **(1)**, cuando debería usar **(2)**:

```ts
// apps/api/src/modules/reservations/reservations.service.ts  (actual — INCORRECTO)
if (room.status !== 'AVAILABLE') {
  throw new BadRequestException(`La habitación ${room.number} no está disponible`);
}
```

### Por qué está mal

- **Falso rechazo:** un cuarto ocupado HOY no se puede reservar para el mes que viene,
  aunque para esas fechas esté perfectamente libre.
- **Falsa aceptación (overbooking):** dos reservas para el mismo cuarto en fechas que se
  solapan se aceptan sin problema, mientras el cuarto figure `AVAILABLE` al momento de crearlas.

### La regla correcta: solapamiento de fechas

Una reserva nueva `[checkIn, checkOut)` entra en conflicto con una existente del **mismo cuarto** si:

```
nuevoCheckIn < existenteCheckOut   Y   nuevoCheckOut > existenteCheckIn
```

…considerando solo reservas que "retienen" el cuarto (estado `PENDING` o `ACTIVE`;
las `CANCELLED` y `COMPLETED` liberan las fechas).

**En resumen:** reservar es una operación sobre *intervalos de tiempo*, no sobre el estado actual.
El `Room.status` deja de ser el portero de las reservas y se queda solo para lo operativo (check-in, limpieza).

---

## Base ya construida (no se toca)

Estos módulos ya están completos y desplegados; son la fundación sobre la que trabajamos:

- Autenticación JWT + roles (OWNER/MANAGER/EMPLOYEE)
- CRUD de empleados (con edición) y de habitaciones (con edición y precio por noche)
- Dashboard de estados físicos en tiempo real + housekeeping (limpieza)
- Reservas: creación, check-in, check-out con cobro (precio snapshot, métodos de pago)
- Modelo `Reservation` con `checkIn`, `checkOut`, `actualCheckIn`, `actualCheckOut`, `status`, `roomId`

> El modelo de datos actual **ya soporta** la disponibilidad temporal: tiene fechas, cuarto y estado.
> El problema es solo la **lógica de validación**, no el schema.

---

## Objetivo Principal

> Convertir el módulo de reservas en un sistema **consciente del tiempo**: que valide overbooking
> por solapamiento de fechas, que muestre disponibilidad por rango, y que se visualice en un calendario.

### Caso de uso concreto (el objetivo que guía todo)

> Al crear una reserva, el recepcionista indica **3 datos**: fecha de check-in, fecha de check-out
> y **tipo de habitación** (SINGLE / DOUBLE / SUITE). El backend responde con la **lista de
> habitaciones de ese tipo que están libres en ese rango de fechas**. El recepcionista elige una
> de esa lista y confirma.

Es decir, el endpoint clave recibe `{ checkIn, checkOut, type }` y devuelve los cuartos disponibles.
No se muestran todos los cuartos ni se filtra por su estado actual: se filtra por **tipo** + **disponibilidad temporal**.

---

## Fase 1 — Backend: Disponibilidad Temporal (núcleo)

*El corazón del cambio. Sin esto, lo demás no tiene sentido.*

- [x] **Validación de overbooking al crear reserva (`POST /reservations`):**
  - Quitar el chequeo de `room.status !== 'AVAILABLE'`.
  - Buscar reservas del mismo cuarto en estado `PENDING`/`ACTIVE` que se solapen con las fechas pedidas.
  - Si existe alguna → `409 Conflict` con mensaje claro ("La habitación ya está reservada para esas fechas").
  - Consulta en Prisma (elegante, sin traer todo a memoria):
    ```ts
    const conflicto = await prisma.reservation.findFirst({
      where: {
        roomId,
        status: { in: ['PENDING', 'ACTIVE'] },
        checkIn:  { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
    });
    ```
- [x] **Endpoint de disponibilidad (`GET /rooms/availability?checkIn=&checkOut=&type=`):**
  - Recibe **3 parámetros**: `checkIn`, `checkOut` y `type` (SINGLE / DOUBLE / SUITE).
  - Devuelve los cuartos **de ese tipo** que están **libres en ese rango** (sin reserva solapada).
    ```ts
    prisma.room.findMany({
      where: {
        type, // ← filtro por tipo de habitación solicitado
        reservations: {
          none: {
            status: { in: ['PENDING', 'ACTIVE'] },
            checkIn:  { lt: checkOutDate },
            checkOut: { gt: checkInDate },
          },
        },
      },
    });
    ```
  - (Decisión de diseño) ¿el `type` es obligatorio u opcional? → **Resuelto: obligatorio.**
    Coincide con el caso de uso; relajarlo después es trivial.
  - (Decisión de diseño) ¿excluir cuartos en `MAINTENANCE`? → **Resuelto: se excluye solo
    `MAINTENANCE`** (estado indefinido sin fecha fin). `OCCUPIED`/`CLEANING` SÍ se ofrecen para
    fechas futuras, pues son transitorios y excluirlos reintroduce el falso rechazo.
- [x] **Check-in conserva su chequeo de `AVAILABLE`** — esto SÍ es correcto: no puedes meter
  un huésped a un cuarto sucio u ocupado físicamente. El check-in es operativo (presente), no temporal.

---

## Fase 2 — Frontend: Flujo de reserva "fecha + tipo primero"

*El formulario se invierte: primero fechas y tipo, luego los cuartos libres que cumplen.*

- [x] En "Nueva Reserva", el recepcionista elige primero: **check-in**, **check-out** y **tipo de habitación**.
- [x] Con esos 3 datos, llamar a `GET /rooms/availability?checkIn=&checkOut=&type=` y mostrar
  **solo los cuartos de ese tipo libres** en el rango. (Reemplaza el filtro actual de "cuartos AVAILABLE ahora mismo".)
- [x] El recepcionista elige una habitación de la lista devuelta y completa los datos del huésped.
- [x] Bloquear en el date picker que `checkOut <= checkIn`.
- [x] Manejar el `409` de overbooking con un toast claro.

---

## Fase 3 — Visualización en Calendario / Timeline

*"Trabajar con fechas y calendarios": ver de un vistazo cuándo está ocupado cada cuarto.*

- [x] Vista tipo **timeline**: cada habitación es una fila, las reservas son barras a lo largo de un eje de fechas.
  Implementado en página propia `apps/web/src/app/dashboard/calendario/` (no se tocó el Gantt del curso).
- [x] Reutilizar el patrón visual del Gantt: se creó `OccupancyTimeline.tsx` reutilizando su lenguaje
  visual pero con eje de **días reales**, tema semántico actual y varias barras por fila.
- [x] Navegación por semana (←/→, botón "Hoy"); colores por estado de reserva (PENDING/ACTIVE/COMPLETED).
- [ ] (Opcional) crear reserva haciendo click-y-arrastre sobre un cuarto libre. **Pendiente.**

---

## Fase 4 — Ciclo de vida de la reserva

*Sin esto no se pueden corregir errores ni liberar fechas.*

- [ ] `GET /reservations/:id` — detalle completo.
- [ ] `PATCH /reservations/:id` — modificar fechas o cuarto → **re-validar overbooking**.
- [ ] `DELETE /reservations/:id` (o `PATCH .../cancel`) — pasar a `CANCELLED` (libera las fechas, no borra).
- [ ] Filtros en el listado: por estado, por cuarto, por fecha.
- [ ] Frontend: botones de editar/cancelar en la tabla de reservas.

---

## Fase 5 — Robustez (avanzado / opcional)

- [ ] **Constraint a nivel de BD contra doble-reserva:** `EXCLUDE USING gist` con `tsrange`
  sobre `(roomId, [checkIn, checkOut))` (requiere extensión `btree_gist`). Evita la condición de
  carrera donde dos requests simultáneos pasan ambos la validación de aplicación. Es el estándar
  de oro; la validación en código cubre el 99% pero esto lo blinda.
  > Ya registrado como **TD-001** en `docs/technical-debt.md` (riesgo 5/10).
- [ ] Registrar qué empleado creó la reserva y quién recibió el pago (`employeeId`).

---

## Fase 6 — Cierre y entrega

- [ ] Prueba E2E del nuevo flujo: crear dos reservas solapadas → la segunda debe rechazarse (409).
- [ ] Verificar que una reserva futura se puede crear aunque el cuarto esté ocupado HOY.
- [ ] Documento de entrega: URL pública + credenciales de prueba (OWNER / MANAGER / EMPLOYEE).

---

## Qué falta, en una frase

> El modelo de datos ya está listo; falta **cambiar la lógica de validación de "estado actual" a
> "solapamiento de fechas"** (Fase 1), **invertir el formulario a fecha-primero** (Fase 2), y darle
> una **vista de calendario** (Fase 3). Lo demás (editar/cancelar, constraint de BD) es refinamiento.
