# Mirador Hotel Suite — Descripción del Proyecto

Sistema de Gestión Hotelera (PMS) **B2B** de uso interno para el personal de un hotel.
Digitaliza la operación diaria —reservas, recepción, housekeeping— eliminando los
registros manuales en papel o Excel.

## Problemas que resuelve

- **Overbooking:** valida disponibilidad por **solapamiento de fechas**, no por el estado
  físico del cuarto, evitando asignar una misma habitación a dos clientes en fechas que se cruzan.
- **Desconexión recepción ↔ limpieza:** el estado de cada habitación
  (Disponible / Ocupada / Limpieza / Mantenimiento) es visible en tiempo real para todo el personal.
- **Pérdida de datos:** historial de reservas y pagos persistido en base de datos.
- **Tiempos de check-in/out:** control visual de estados desde el dashboard.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind v4, Shadcn UI, Zustand, Axios, React Hook Form + Zod |
| Backend | NestJS 11, Prisma ORM, autenticación JWT + RBAC |
| Base de datos | PostgreSQL |
| Infraestructura | Docker Compose en Digital Ocean (web + api + Postgres) expuesto vía Cloudflare Tunnel |

Monorepo: `apps/web` (frontend), `apps/api` (backend), `apps/docker` (infra).

## Roles (RBAC)

`OWNER` > `MANAGER` > `EMPLOYEE`. El acceso a cada módulo se restringe por rol mediante
guards (`JwtAuthGuard`, `RolesGuard`) y el decorador `@Roles()`.

## Módulos

1. **Autenticación** — login con JWT; token persistido en Zustand + localStorage; interceptor
   Axios que adjunta el `Bearer` y desloguea ante un 401.
2. **Habitaciones (inventario)** — CRUD con tipo (SINGLE / DOUBLE / SUITE), estado físico y
   precio por noche. Dashboard de recepción con cuadrícula de estados en tiempo real y colores semánticos.
3. **Personal (staff)** — CRUD de empleados con rol, cargo y turno.
4. **Reservas** — flujo "fecha + tipo primero": el recepcionista elige check-in, check-out y tipo,
   y el sistema devuelve solo las habitaciones libres en ese rango. Soporta creación, edición,
   cancelación, check-in y check-out con cobro (precio snapshot y método de pago).
   La validación de overbooking se hace por solapamiento de fechas sobre reservas `PENDING`/`ACTIVE`.
5. **Calendario** — vista timeline (una fila por habitación, reservas como barras sobre un eje de
   días reales) con navegación por semana.
6. **Housekeeping (servicio)** — vista aislada que lista solo los cuartos pendientes de limpieza y
   permite marcarlos como disponibles.

## Modelo de dominio (resumen)

- **User** — `id`, `username`, `password` (bcrypt), `role`.
- **Room** — `id`, `number`, `type`, `status`, `pricePerNight`.
- **Reservation** — `id`, `roomId`, `checkIn`, `checkOut`, `actualCheckIn`, `actualCheckOut`,
  `status` (PENDING / ACTIVE / COMPLETED / CANCELLED), datos del huésped y snapshot de precio/pago.
- **Employee** — datos del personal (rol, cargo, turno).

> El estado físico de la habitación (`Room.status`) sirve solo para la operación del *presente*
> (housekeeping, autorizar check-in). La decisión de **si se puede reservar** depende exclusivamente
> de la disponibilidad temporal calculada a partir de las reservas.

## Estado y pendientes

El roadmap vivo con lo que falta está en [`logbook/roadmap.md`](logbook/roadmap.md).
La deuda técnica registrada está en [`logbook/technical-debt.md`](logbook/technical-debt.md).
