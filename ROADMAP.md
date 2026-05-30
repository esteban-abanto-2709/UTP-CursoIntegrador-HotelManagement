# Roadmap de Entrega: Lumina Resort PMS

**Proyecto:** Sistema de Gestión Hotelera B2B — Curso Integrador UTP  
**Stack:** NestJS + Prisma + PostgreSQL (API) | Next.js 16 + TailwindCSS (Frontend)  
**Infraestructura:** Backend en Render · Frontend en Vercel · Base de datos en Supabase  
**Estado:** Sistema completo y desplegado en producción. Ciclo operativo funcional de extremo a extremo.  
**Enfoque:** Desarrollo vertical por módulo (Backend + Frontend juntos). Primero funciona, luego se pule.

---

## Estado Actual del Proyecto

| Módulo | Backend | Frontend | Estado |
|---|---|---|---|
| Autenticación (JWT + Roles) | Completo | Completo | LISTO |
| Gestión de Empleados (CRUD) | Completo | Completo | LISTO |
| Inventario de Habitaciones | Completo | Completo | LISTO |
| Dashboard de Estados | Completo | Completo | LISTO |
| Reservas (CRUD básico) | Completo | Completo | LISTO |
| Check-in / Check-out | Completo | Completo | LISTO |
| Housekeeping (Limpieza) | Completo | Completo | LISTO |
| Cobro / Facturación | Completo | Completo | LISTO |
| Deploy (Render + Vercel) | Completo | Completo | LISTO |

---

## Sprint 1: Autenticación y Usuarios — COMPLETADO

- [x] Modelo `Employee` con roles (OWNER, MANAGER, EMPLOYEE) en Prisma
- [x] Login con JWT y bcrypt
- [x] Guards y decoradores (`JwtAuthGuard`, `RolesGuard`, `@Roles`, `@CurrentUser`)
- [x] CRUD de empleados con filtrado por rol
- [x] Pantalla de login con validación y almacenamiento del token en Zustand
- [x] Interceptor de Axios que adjunta el JWT en cada request

---

## Sprint 2: Inventario y Dashboard Base — COMPLETADO

- [x] Modelo `Room` con tipo (SINGLE/DOUBLE/SUITE) y estado (AVAILABLE/OCCUPIED/CLEANING/MAINTENANCE)
- [x] CRUD de habitaciones protegido por rol
- [x] Página de setup de habitaciones en frontend
- [x] Grid visual de habitaciones con colores por estado
- [x] **Backend:** Endpoint `PATCH /rooms/:id/status` para cambiar el estado de una habitación
- [x] **Frontend:** KPIs del Dashboard conectados a datos reales del backend
- [x] **Frontend:** Modal operativo conectado al backend con loading state y manejo de errores

---

## Sprint 3: Modelos de Operaciones — COMPLETADO

*Objetivo: Agregar al schema los modelos que soportan el negocio central.*

> **Desviación del plan original:** Se optó por un diseño simplificado. No se creó un modelo `Guest`
> separado ni un modelo `Payment` separado — los datos del huésped y del cobro se embebieron
> directamente en `Reservation`. Esto reduce complejidad y es suficiente para el alcance del curso.

- [x] **Modelo `Reservation`:**
  - `id`, `guestName`, `dni`, `checkIn`, `checkOut`, `status` (enum)
  - Timestamps reales: `actualCheckIn`, `actualCheckOut` (nullable)
  - Estado enum: `PENDING` / `ACTIVE` / `COMPLETED` / `CANCELLED`
  - Relación: `roomId → Room`
- [x] **Facturación embebida en `Reservation`** (en vez de modelo `Payment` aparte):
  - `pricePerNight` (snapshot al crear), `totalAmount` (calculado al checkout)
  - `paymentMethod` (enum CASH/CARD/TRANSFER), `paidAt`
- [x] **Precio en `Room`:** campo `price` (Decimal) — tarifa por noche
- [x] Migraciones aplicadas con `prisma migrate deploy` y cliente regenerado
- [x] ~~Datos del huésped embebidos en Reservation~~ — sin modelo `Guest` separado (simplificación)

---

## Sprint 4: Reservas, Check-in y Check-out — COMPLETADO

*Objetivo: El flujo operativo central del hotel funciona de extremo a extremo.*

### Backend: Módulo de Reservas

**Crear Reserva** (`POST /reservations`):
- [x] Recibir `guestName`, `dni`, `roomId`, `checkIn`, `checkOut`
- [x] Validar que `checkOut > checkIn`
- [x] Validar que la habitación exista y esté `AVAILABLE`
- [x] Guardar `pricePerNight` (snapshot de la tarifa actual de la habitación)
- [x] La reserva se crea en estado `PENDING`

**Listado:**
- [x] `GET /reservations` — Listar reservas con su habitación incluida

**Check-in** (`PATCH /reservations/:id/checkin`):
- [x] Validar que la reserva esté en estado `PENDING`
- [x] Validar que la habitación esté en estado `AVAILABLE`
- [x] Reserva → `ACTIVE`, habitación → `OCCUPIED`, registrar `actualCheckIn` (transacción atómica)

**Check-out** (`PATCH /reservations/:id/checkout`):
- [x] Validar que la reserva esté en estado `ACTIVE`
- [x] Calcular `totalAmount` = noches × `pricePerNight` (mínimo 1 noche)
- [x] Recibir `paymentMethod` (CASH / CARD / TRANSFER) en el body
- [x] Guardar cobro en la reserva (`totalAmount`, `paymentMethod`, `paidAt`)
- [x] Reserva → `COMPLETED`, habitación → `CLEANING` (transacción atómica)
- [x] Devolver resumen del cobro (`billing`) para el frontend

### Frontend: Dashboard

- [x] **Modal de habitación (click en el grid):** acciones operativas según estado
  (Check-in, Check-out, Finalizar limpieza, Habilitar) conectadas al backend con loading state

### Frontend: Página de Reservas (`/dashboard/reservas`)

- [x] Tabla con columnas: ID, Huésped, Documento, Alojamiento, Fechas, Estado, Acciones
- [x] Buscador en tiempo real (filtra por nombre del huésped o DNI)
- [x] Botón "Nueva Reserva" con modal: nombre, DNI, fechas y selector de habitación (solo `AVAILABLE`)
- [x] Botón "Check-in" en reservas `PENDING`
- [x] Botón "Check-out" en reservas `ACTIVE` (abre diálogo de cobro)
- [x] **Diálogo de cobro:** resumen (huésped, habitación, noches × tarifa, total) + selector de método de pago + "Confirmar y Cobrar"
- [x] Reservas finalizadas muestran el monto cobrado y el método de pago

---

## Sprint 5: Housekeeping y Pulido — COMPLETADO

*Objetivo: Cerrar el ciclo operativo con la vista de limpieza.*

### Frontend: Página de Limpieza (`/dashboard/servicio`)

- [x] Lista de habitaciones filtrada a estado `CLEANING` (datos reales del backend)
- [x] Cada tarjeta muestra número de habitación y tipo
- [x] Botón "Liberar Habitación" que ejecuta `PATCH /rooms/:id/status` con `AVAILABLE`
- [x] Al liberar, la habitación desaparece de la lista y vuelve al grid verde del Dashboard
- [x] Empty state ("¡Todo impecable!") cuando no hay habitaciones en limpieza

### UX

- [x] Loading states (spinners) mientras cargan los datos
- [x] Manejo de errores con toasts (sonner)
- [x] Validación de formularios con Zod + React Hook Form (form de habitaciones)
- [x] Eliminación de todos los mocks — la app usa 100% datos reales del backend

---

## Sprint 6: Deploy — COMPLETADO

- [x] **Backend:** Desplegado en Render
  - Variables de entorno: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `FRONTEND_URL`
  - `prisma migrate deploy` ejecutado en producción
- [x] **Frontend:** Desplegado en Vercel
  - Variable `NEXT_PUBLIC_API_URL` apuntando al backend en Render
- [x] **Base de datos:** PostgreSQL en Supabase (pooler + direct URL para migraciones)

---

## Pendientes / Mejoras Futuras

*Funcionalidades del plan original que se simplificaron o quedaron fuera del alcance entregado.*

- [ ] **Validación de overbooking:** hoy solo se valida que la habitación esté `AVAILABLE`.
  No se valida solapamiento de fechas entre reservas (`PENDING`/`ACTIVE`) para la misma habitación.
- [ ] **Editar / cancelar reservas:** no hay `PATCH /reservations/:id` (modificar fechas) ni
  `DELETE /reservations/:id` (cancelar → `CANCELLED`).
- [ ] **Detalle de reserva:** no existe `GET /reservations/:id`.
- [ ] **Filtros en el listado de reservas:** por estado, habitación o fecha.
- [ ] **Editar precio/datos de habitación:** no hay endpoint de edición de `Room`
  (las habitaciones creadas antes de la facturación quedaron en `S/. 0.00`).
- [ ] **Restricción de UI por rol:** un `EMPLOYEE` aún puede navegar a `/dashboard/reservas` por URL;
  el plan contemplaba redirigirlo a `/dashboard/servicio`.
- [ ] **Empleado que registra la operación:** las reservas/cobros no guardan qué empleado los ejecutó.
- [ ] **Comprobante imprimible** del cobro tras el check-out.
- [ ] **Documento de entrega:** URL pública + credenciales de prueba (OWNER / MANAGER / EMPLOYEE) para el profesor.

---

## Flujos de Negocio (implementados)

### Flujo principal: Reserva → Check-in → Check-out → Limpieza

```
Recepcionista (OWNER / MANAGER):
1. Crea reserva: nombre del huésped, DNI, fechas y habitación disponible
   → El sistema guarda el precio por noche como snapshot → Reserva creada (PENDING)
2. Al llegar el huésped → Check-in → Habitación pasa a OCCUPIED (reserva ACTIVE)
3. Al salir → Check-out → Se abre el diálogo de cobro:
   - Sistema calcula total = noches × precio por noche (mínimo 1 noche)
   - Recepcionista elige método de pago (Efectivo / Tarjeta / Transferencia)
   - Se registra el cobro en la reserva → Reserva COMPLETED → Habitación pasa a CLEANING

Personal de Limpieza (EMPLOYEE):
4. Ve la habitación en CLEANING en la página de Servicio → La limpia →
   "Liberar Habitación" → Habitación vuelve a AVAILABLE
```

### Cálculo de Cobro al Check-out

```
totalAmount = noches × pricePerNight  (mínimo 1 noche)

noches        = ceil((checkOut - checkIn) en días)   ← fechas planificadas de la reserva
pricePerNight = snapshot guardado al crear la reserva (no cambia aunque luego se edite la tarifa del cuarto)

El cobro se guarda en la propia Reserva: totalAmount, paymentMethod y paidAt.
```
