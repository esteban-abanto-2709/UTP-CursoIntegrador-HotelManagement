# Informe de Pruebas — Mirador Hotel Suite

Verificación funcional del backend del sistema mediante **pruebas unitarias** y
**pruebas end-to-end**, ejecutadas con **Jest** y **Supertest**.

---

## 1. Marco teórico

### 1.1 Tipos de prueba utilizados

| Tipo | Herramienta | Qué verifica |
|------|-------------|--------------|
| **Unitarias** | Jest + mocks | Una pieza de lógica aislada (un servicio, un guard), reemplazando sus dependencias (base de datos, correo, JWT) por dobles de prueba (*mocks*). Son rápidas y deterministas: no necesitan base de datos ni red. |
| **End-to-end (e2e)** | Jest + Supertest | El sistema ensamblado: se levanta la aplicación NestJS completa y se le hacen peticiones HTTP reales, verificando la respuesta como la vería un cliente. |

### 1.2 ¿Por qué Jest y Supertest?

- **Jest** es el framework de pruebas estándar del ecosistema NestJS: viene
  integrado en el scaffold del proyecto, corre desde CLI (`pnpm test`) y genera
  reportes de cobertura sin configuración adicional (`pnpm test:cov`).
- **Supertest** permite hacer peticiones HTTP contra la aplicación en memoria,
  sin necesidad de desplegarla ni de ocupar un puerto, lo que hace las pruebas
  e2e reproducibles en cualquier máquina.
- Las pruebas viven versionadas junto al código que verifican (`*.spec.ts` al
  lado de cada módulo), el mismo criterio de reproducibilidad usado en el
  reporte de rendimiento con k6.

### 1.3 Estrategia: priorizar por riesgo

No se buscó cobertura total, sino cubrir primero la lógica cuyo fallo tiene
mayor costo para el negocio:

1. **Integridad de datos** — una reserva duplicada (overbooking) o un cobro mal
   calculado dañan directamente la operación del hotel.
2. **Control de acceso** — un fallo en la autenticación o en los roles expone
   funciones administrativas a usuarios sin permiso.

## 2. Alcance

Módulos probados, en orden de prioridad:

| Módulo | Riesgo que cubre |
|--------|------------------|
| `reservations.service` | **Overbooking**: que dos reservas no puedan solaparse en la misma habitación. **Validación de fechas**: check-out posterior al check-in. **Cálculo del cobro**: roomTotal + cargos − descuentos = total, sobre `Prisma.Decimal` (sin errores de redondeo de punto flotante). |
| `auth.service` | Login: credenciales correctas emiten JWT; contraseña incorrecta o usuario inexistente son rechazados. La contraseña nunca se devuelve al cliente. |
| `roles.guard` | RBAC: los tres roles (OWNER / MANAGER / EMPLOYEE) contra rutas restringidas; petición sin usuario autenticado recibe 403. |
| `comprobante-pdf` | El comprobante de pago genera un PDF válido y no vacío. |
| `app.controller` (unit + e2e) | Endpoints raíz y `/health` responden correctamente con la aplicación ensamblada. |

Las pruebas unitarias reemplazan `PrismaService` por un mock, de modo que
verifican la **lógica de negocio** (condiciones, cálculos, excepciones) sin
depender de una base de datos.

## 3. Resultados

Ejecución del 2026-07-14 (`pnpm test`, `pnpm test:e2e`, `pnpm test:cov`):

| Suite | Tests | Resultado | Tiempo |
|-------|-------|-----------|--------|
| Unitarias (5 suites) | 23 | ✅ 23 passing, 0 failing | ~2.2 s |
| End-to-end (1 suite) | 2 | ✅ 2 passing, 0 failing | ~4.0 s |
| **Total** | **25** | **✅ 100 % passing** | |

Cobertura de los módulos probados (statements / branches / functions / lines):

| Archivo | % Stmts | % Branch | % Funcs | % Lines |
|---------|---------|----------|---------|---------|
| `roles.guard.ts` | 100 | 87.5 | 100 | 100 |
| `auth.service.ts` | 100 | 75 | 100 | 100 |
| `comprobante-pdf.ts` | 100 | 70.6 | 100 | 100 |
| `app.controller.ts` | 100 | 75 | 100 | 100 |
| `app.service.ts` | 100 | 100 | 100 | 100 |
| `reservations.service.ts` | 45.2 | 33.1 | 45.5 | 44.7 |
| **Global del backend** | **26.6** | **17.4** | **19.7** | **26.7** |

En `reservations.service.ts` la cobertura corresponde a los métodos críticos
(`create`, `assertNoOverlap`, `checkOut`, `calcNights`); lo no cubierto son
listados, filtros y actualizaciones (ver §5).

## 4. Casos de prueba

### 4.1 Reservas — validación de fechas y overbooking (`reservations.service.spec.ts`)

| Caso | Qué prueba | Resultado esperado | Resultado obtenido |
|------|-----------|--------------------|--------------------|
| Check-out igual al check-in | `create()` con ambas fechas iguales | `BadRequestException`, no se crea la reserva | ✅ |
| Check-out anterior al check-in | `create()` con fechas invertidas | `BadRequestException` | ✅ |
| Habitación inexistente | `create()` con `roomId` que no existe | `NotFoundException` | ✅ |
| Solape de reservas (overbooking) | `create()` sobre una habitación con reserva vigente en fechas que se cruzan | `ConflictException` (HTTP 409), no se crea la reserva | ✅ |
| Criterio de solape | La consulta anti-overbooking | Solo considera reservas `PENDING`/`ACTIVE` y usa la condición de intervalo `checkIn < salida AND checkOut > entrada` | ✅ |
| Reserva válida | `create()` sin conflicto | Se crea la reserva y se registra en la auditoría | ✅ |

### 4.2 Reservas — cálculo del check-out (`reservations.service.spec.ts`)

| Caso | Qué prueba | Resultado esperado | Resultado obtenido |
|------|-----------|--------------------|--------------------|
| Estadía simple | 3 noches × S/ 100, sin cargos ni descuentos | `grandTotal = 300` | ✅ |
| Cargos + descuento | 3 noches × S/ 100 + S/ 50 de cargos, descuento 10 % | `subtotal = 350`, `discountAmount = 35`, `grandTotal = 315`; se registra el descuento aplicado | ✅ |
| Descuento inactivo | Check-out con un descuento deshabilitado | `BadRequestException`, no se crea el pago | ✅ |
| Estado inválido | Check-out de una reserva que no está `ACTIVE` | `BadRequestException` | ✅ |
| Estadía < 1 día | Check-in y check-out el mismo día | Se cobra mínimo 1 noche | ✅ |

### 4.3 Autenticación (`auth.service.spec.ts`)

| Caso | Qué prueba | Resultado esperado | Resultado obtenido |
|------|-----------|--------------------|--------------------|
| Login válido | Usuario y contraseña correctos (hash bcrypt real) | Devuelve el usuario **sin** el campo `password` | ✅ |
| Contraseña incorrecta | Usuario correcto, contraseña errada | `null` (login rechazado) | ✅ |
| Usuario inexistente | Username no registrado | `null` | ✅ |
| Emisión del JWT | `login()` | El token se firma con `sub`, `username` y `role`; la respuesta incluye el token y los datos públicos del usuario | ✅ |

### 4.4 Control de acceso por roles (`roles.guard.spec.ts`)

| Caso | Qué prueba | Resultado esperado | Resultado obtenido |
|------|-----------|--------------------|--------------------|
| Ruta sin `@Roles()` | Ruta pública | Acceso permitido | ✅ |
| OWNER en ruta OWNER/MANAGER | Rol suficiente | Acceso permitido | ✅ |
| MANAGER en ruta OWNER/MANAGER | Rol suficiente | Acceso permitido | ✅ |
| EMPLOYEE en ruta OWNER/MANAGER | Rol insuficiente | `ForbiddenException` (HTTP 403) | ✅ |
| Sin usuario autenticado | Petición sin JWT válido | `ForbiddenException` | ✅ |

### 4.5 Comprobante y aplicación (`comprobante-pdf.spec.ts`, `app.controller.spec.ts`, e2e)

| Caso | Qué prueba | Resultado esperado | Resultado obtenido |
|------|-----------|--------------------|--------------------|
| Generación de comprobante | `buildComprobantePdf()` con datos completos | Buffer no vacío con cabecera `%PDF-` | ✅ |
| Info de la API (unit) | `GET /` | Nombre y versión de la API | ✅ |
| Health check (unit) | `GET /health` | `status: ok` | ✅ |
| Info de la API (e2e) | HTTP real contra la app ensamblada | 200 con el JSON esperado | ✅ |
| Health check (e2e) | HTTP real contra la app ensamblada | 200 con `status: ok` | ✅ |

## 5. Limitaciones conocidas

- **Cobertura global baja (≈27 %) por diseño.** Se priorizó la lógica de mayor
  riesgo (overbooking, cobros, autenticación, roles). Quedan sin pruebas
  unitarias los módulos CRUD de menor riesgo (rooms, guests, employees,
  discounts, analytics, reports), cuya lógica es mayormente delegación directa
  a Prisma.
- **En `reservations.service` no se cubren** los listados con filtros
  (`findAll`), la edición (`update`), la cancelación ni el `checkIn`; se cubrió
  la creación y el `checkOut`, que concentran las reglas de negocio.
- **Las pruebas e2e no ejercitan el flujo completo de negocio**
  (crear reserva → check-in → check-out) porque requeriría una base de datos de
  prueba con seed dedicado; ese flujo se verifica hoy a nivel unitario con la
  base de datos mockeada.
- **El envío de correo y la capa Prisma no se prueban**: se reemplazan por
  mocks, así que un error de configuración SMTP o de esquema de base de datos
  no sería detectado por esta suite (el esquema sí lo valida `prisma migrate`).

## 6. Reproducción

```bash
cd apps/api
pnpm test        # unitarias
pnpm test:e2e    # end-to-end
pnpm test:cov    # unitarias + reporte de cobertura
```

Las pruebas no requieren base de datos ni servicios externos.
