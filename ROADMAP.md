# Roadmap de Entrega: Lumina Resort PMS

**Proyecto:** Sistema de Gestión Hotelera B2B — Curso Integrador UTP  
**Stack:** NestJS + Prisma + PostgreSQL (API) | Next.js 16 + TailwindCSS (Frontend)  
**Semanas disponibles:** 7 a la 16 (~9 semanas). Semanas 7-12 completadas.  
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
| Housekeeping | Completo (API) | Pendiente | EN PROGRESO |
| Cobro / Facturación | Pendiente | Pendiente | PENDIENTE |
| Deploy | — | — | PENDIENTE |

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

## Sprint 3: Base de Datos de Operaciones (Semanas 11 y 12)

*Objetivo: Agregar al schema los modelos que soportan el negocio central: huéspedes, reservas y pagos.*

### Nuevos modelos en Prisma

- [ ] **Modelo `Guest` (Huésped):**
  - `id`, `dni` (unique), `fullName`, `email`, `phone`, `createdAt`
  - Relación: un huésped puede tener N reservas

- [ ] **Modelo `Reservation` (Reserva):**
  - `id`, `checkIn` (DateTime), `checkOut` (DateTime), `status` (enum)
  - Estado enum: `PENDING` (creada, sin llegar) / `ACTIVE` (huésped adentro) / `CHECKED_OUT` (salió) / `CANCELLED`
  - Relaciones: `guestId → Guest`, `roomId → Room`, `employeeId → Employee` (quien la creó)
  - `totalNights` (calculado), `pricePerNight` (snapshot al crear), `totalAmount` (calculado al checkout)

- [ ] **Modelo `Payment` (Pago):**
  - `id`, `reservationId` (unique), `amount`, `method` (CASH/CARD/TRANSFER), `paidAt`, `receivedBy` (employeeId)
  - Se crea una vez al hacer checkout

- [ ] Ejecutar `npx prisma migrate dev` y `npx prisma generate`

### Backend: Módulo de Huéspedes

- [ ] `POST /guests` — Crear huésped (con validación de DNI único)
- [ ] `GET /guests` — Listar (con búsqueda por nombre o DNI via query param `?search=`)
- [ ] `GET /guests/:id` — Detalle del huésped con su historial de reservas
- [ ] `PATCH /guests/:id` — Actualizar datos de contacto

---

## Sprint 4: Reservas, Check-in y Check-out (Semanas 12 y 13)

*Objetivo: El flujo operativo central del hotel funciona de extremo a extremo.*

### Backend: Módulo de Reservas

**Crear Reserva** (`POST /reservations`):
- [ ] Recibir: `guestId`, `roomId`, `checkIn`, `checkOut`
- [ ] Validar que `checkOut > checkIn`
- [ ] **Validar overbooking:** Consultar en DB si existe alguna reserva `PENDING` o `ACTIVE` para esa habitación donde las fechas se solapan. Condición de solapamiento: `newCheckIn < existingCheckOut AND newCheckOut > existingCheckIn`. Si hay conflicto, devolver `409 Conflict`.
- [ ] Calcular `totalNights` y guardar `pricePerNight` (snapshot de la tarifa actual de la habitación)
- [ ] La reserva se crea en estado `PENDING`

**Otros endpoints de reservas:**
- [ ] `GET /reservations` — Listar con filtros (`?status=`, `?roomId=`, `?guestId=`, `?date=`)
- [ ] `GET /reservations/:id` — Detalle completo (incluye huésped y habitación)
- [ ] `PATCH /reservations/:id` — Modificar fechas o habitación (re-validar overbooking)
- [ ] `DELETE /reservations/:id` — Cancelar (cambia status a `CANCELLED`, no borra el registro)

**Check-in** (`POST /reservations/:id/checkin`):
- [ ] Validar que la reserva esté en estado `PENDING`
- [ ] Validar que la habitación esté en estado `AVAILABLE`
- [ ] Cambiar estado de la reserva a `ACTIVE`
- [ ] Cambiar estado de la habitación a `OCCUPIED`
- [ ] Registrar `actualCheckIn` (timestamp real de llegada)

**Check-out** (`POST /reservations/:id/checkout`):
- [ ] Validar que la reserva esté en estado `ACTIVE`
- [ ] Calcular `totalAmount` = noches reales × `pricePerNight` (usar la fecha real de salida)
- [ ] Recibir `paymentMethod` (CASH / CARD / TRANSFER) en el body
- [ ] Crear registro en `Payment` (amount, method, receivedBy = empleado logueado)
- [ ] Cambiar estado de la reserva a `CHECKED_OUT`
- [ ] Cambiar estado de la habitación a `CLEANING` (pasa automáticamente a la cola de housekeeping)
- [ ] Devolver resumen del cobro para mostrar en el frontend

### Frontend: Conectar el Dashboard al Backend

- [ ] **Modal de habitación (click en el grid):**
  - Estado `AVAILABLE`: mostrar botón "Registrar Check-in directo" (sin reserva previa) o "Ver reserva pendiente"
  - Estado `OCCUPIED`: mostrar datos del huésped actual y botón "Efectuar Check-out"
  - Estado `CLEANING`: mostrar mensaje "Pendiente de limpieza"
  - Estado `MAINTENANCE`: mostrar mensaje y opción de volver a disponible (solo MANAGER/OWNER)
  - Cada acción llama al endpoint correspondiente y refresca el grid

### Frontend: Página de Reservas (`/dashboard/reservas`)

- [ ] Tabla de datos con columnas: Huésped, Habitación, Check-in, Check-out, Estado, Acciones
- [ ] Buscador en tiempo real (filtra por nombre del huésped o DNI)
- [ ] Filtro por estado de reserva (Pendiente / Activa / Finalizada / Cancelada)
- [ ] Botón "Nueva Reserva" que abre un modal con el formulario:
  - Campo de búsqueda de huésped por DNI (si no existe, botón "Crear huésped nuevo")
  - Selector de habitación (solo muestra AVAILABLE en el rango de fechas elegido)
  - Date pickers para check-in y check-out (check-out bloqueado para fechas menores a check-in)
  - Resumen del costo calculado (noches × tarifa) antes de confirmar
- [ ] Botón "Check-in" en las reservas con estado `PENDING`
- [ ] Botón "Check-out" en las reservas con estado `ACTIVE` (abre diálogo de cobro)
- [ ] **Diálogo de cobro al hacer Check-out:**
  - Muestra resumen: huésped, habitación, fechas, total a cobrar
  - Selector de método de pago (Efectivo / Tarjeta / Transferencia)
  - Botón "Confirmar y Cobrar" que ejecuta el checkout

---

## Sprint 5: Housekeeping, Seguridad UI y Pulido (Semanas 13 y 14)

*Objetivo: Cerrar el ciclo operativo con la vista de limpieza y asegurar que cada rol solo vea lo que le corresponde.*

### Frontend: Página de Housekeeping (`/dashboard/servicio`)

- [ ] Vista dedicada exclusivamente para el rol `EMPLOYEE`
- [ ] Lista de habitaciones filtrada únicamente a las que tienen estado `CLEANING`
- [ ] Cada tarjeta muestra: número de habitación, tipo, hora desde que entró en limpieza
- [ ] Botón "Marcar como Limpia" que ejecuta `PATCH /rooms/:id/status` con `AVAILABLE`
- [ ] Al liberar, la habitación desaparece de esta lista y vuelve al grid verde del Dashboard

### Seguridad y UX

- [ ] Si un `EMPLOYEE` intenta navegar a `/dashboard/reservas` por URL, redirigir a `/dashboard/servicio`
- [ ] Empty states con ilustración cuando no hay habitaciones en limpieza
- [ ] Skeleton loaders mientras cargan los datos (no pantallas en blanco)
- [ ] Manejo de errores: mostrar toast cuando el backend devuelve overbooking (409) o conflicto de estado
- [ ] Validación de formularios con mensajes claros (Zod + React Hook Form)

---

## Sprint 6: Pruebas y Deploy (Semanas 15 y 16)

*Objetivo: El sistema corre en producción y el profesor puede evaluarlo con cuentas reales.*

### Flujo de prueba E2E completo

- [ ] Entrar como OWNER → crear un MANAGER y un EMPLOYEE
- [ ] Entrar como MANAGER → registrar habitaciones al sistema
- [ ] Entrar como MANAGER → crear huésped → crear reserva futura → verificar que el sistema rechaza una segunda reserva en las mismas fechas (overbooking)
- [ ] Entrar como MANAGER → efectuar Check-in a la reserva → verificar que la habitación pasa a OCCUPIED
- [ ] Entrar como MANAGER → efectuar Check-out → verificar resumen de cobro → confirmar pago → verificar que la habitación pasa a CLEANING
- [ ] Entrar como EMPLOYEE → ver la habitación en CLEANING → marcarla como Limpia → verificar que vuelve a verde en el Dashboard

### Deploy

- [ ] **Backend:** Deploy en Railway.app o Render.com
  - Variables de entorno: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `FRONTEND_URL`
  - Ejecutar `prisma migrate deploy` en el entorno de producción
- [ ] **Frontend:** Deploy en Vercel
  - Variable de entorno: `NEXT_PUBLIC_API_URL` apuntando al backend en producción
- [ ] **Documento de entrega:** URL pública del sistema + credenciales de prueba para el profesor (una cuenta OWNER, una MANAGER, una EMPLOYEE)

---

## Flujos de Negocio Resumidos

### Flujo 1: Reserva Anticipada → Check-in → Check-out → Limpieza

```
Recepcionista:
1. Busca huésped por DNI (o crea uno nuevo)
2. Selecciona fechas + habitación disponible
3. Sistema valida que no hay overbooking → Reserva creada (PENDING)
4. Al llegar el huésped → Check-in → Habitación pasa a OCCUPIED
5. Al salir → Check-out → Sistema calcula total → Recepcionista selecciona método de pago → Se registra el pago → Habitación pasa a CLEANING

Empleado de Limpieza:
6. Ve la habitación en su lista → La limpia → Marca "Liberar" → Habitación vuelve a AVAILABLE
```

### Flujo 2: Check-in Directo (sin reserva previa)

```
1. Huésped llega sin reserva
2. Recepcionista crea reserva en el momento (fechas: hoy → mañana/fecha que indique)
3. Inmediatamente hace Check-in desde la misma pantalla
4. El resto del flujo es idéntico al Flujo 1
```

### Regla de Overbooking

```
Al crear o modificar una reserva, el backend consulta:
¿Existe alguna reserva (PENDING o ACTIVE) para la misma habitación
donde el rango de fechas se solape?

Condición SQL: checkIn < nuevaFechaSalida AND checkOut > nuevaFechaEntrada

Si existe → Error 409: "La habitación ya está reservada para esas fechas"
Si no existe → Reserva creada con éxito
```

### Cálculo de Cobro al Checkout

```
totalAmount = nochesReales × pricePerNight

nochesReales = (fechaRealSalida - fechaEntrada).days
pricePerNight = snapshot guardado al crear la reserva (no cambia aunque se modifique la tarifa después)

El pago se registra en el modelo Payment con: monto, método, timestamp, empleado que lo recibió
```
