# Deuda Técnica

Registro de atajos, decisiones pendientes y riesgos a futuro de este proyecto.
Código `TD-###` (nunca se reutiliza). Al resolverse, la entrada se mueve al
changelog y se borra de aquí.

**Formato de cada entrada:**
- **Ubicación:** `archivo:línea` afectado.
- **Riesgo:** del 1 al 10 (1-3 cosmético · 4-6 ralentiza/moderado · 7-9 bug latente o seguridad · 10 crítico).
- **Problema:** qué está mal, sintetizado.
- **Impacto futuro:** qué puede causar si no se atiende.
- **Fecha** y **Estado** (Abierto / En progreso).

---

## [TD-001] Validación de overbooking no es atómica (condición de carrera)

- **Ubicación:** `apps/api/src/modules/reservations/reservations.service.ts:34`
- **Riesgo:** 5/10
- **Problema:** La validación de solapamiento (`findFirst`) y el `create` de la reserva son dos operaciones separadas. Dos peticiones simultáneas para el mismo cuarto y fechas pueden pasar ambas el chequeo antes de que cualquiera inserte, generando doble reserva.
- **Impacto futuro:** Overbooking real bajo concurrencia. La validación en código cubre el flujo normal, pero no la carrera. Solución planificada en RM-024: constraint a nivel de BD `EXCLUDE USING gist` con `tsrange` sobre `(roomId, [checkIn, checkOut))` (requiere extensión `btree_gist`).
- **Fecha:** 2026-05-30 · **Estado:** Abierto

## [TD-002] Contrato HTTP de Employee aún en español (capa de mapeo temporal)

- **Ubicación:** `apps/api/src/modules/employees/employees.service.ts:18` (mapas `TURNO_TO_SHIFT`/`SHIFT_TO_TURNO`, `toSpanishShape`), `apps/api/src/modules/employees/dto/create-employee.dto.ts`, `apps/api/src/modules/employees/dto/update-employee.dto.ts`
- **Riesgo:** 3/10
- **Problema:** La DB y la capa Prisma quedaron en inglés (`firstName`, `shift`, etc.), pero el contrato HTTP sigue en español (`nombres`, `turno`, valores `MAÑANA/TARDE/NOCHE`). El service traduce en ambas fronteras (entrada y salida) para no tocar el frontend. Es código puente, no estado final.
- **Impacto futuro:** Doble fuente de verdad de nombres; cualquier campo nuevo hay que mapearlo en dos sitios y es fácil olvidarlo. Se elimina cuando se traduzca el frontend a inglés (DTOs pasan a passthrough directo y se borran los mapas).
- **Fecha:** 2026-05-31 · **Estado:** Abierto

## [TD-003] Valores de `Cargo` en español persistidos en la columna `position`

- **Ubicación:** `apps/api/src/modules/employees/dto/create-employee.dto.ts:12` (`VALID_CARGOS`), `employees.service.ts:13` (`CARGO_TO_ROLE`)
- **Riesgo:** 2/10
- **Problema:** Los valores `'Manager' | 'Recepcionista' | 'Botones' | 'Limpieza'` se mandan desde el front y se guardan tal cual en la columna `position`. Quedan como dato en español dentro de una DB ya estandarizada a inglés.
- **Impacto futuro:** Traducirlos luego exige migrar los datos existentes de `position` y actualizar front + `CARGO_TO_ROLE` de forma coordinada. Cuanto más datos haya, más cara la migración.
- **Fecha:** 2026-05-31 · **Estado:** Abierto

## [TD-004] Frontend habla español en el contrato (campos y valores de turno)

- **Ubicación:** `apps/web/src/app/dashboard/staff/EmployeeFormDialog.tsx`, `apps/web/src/app/dashboard/staff/page.tsx`, `apps/web/src/store/authStore.ts`, `apps/web/src/components/app-sidebar.tsx`
- **Riesgo:** 2/10
- **Problema:** El frontend envía/lee campos en español (`nombres`, `apellidoPaterno`, `cargo`, `turno`) y los valores de turno `MAÑANA/TARDE/NOCHE`. Es lo que obliga a mantener la capa de mapeo de [[TD-002]].
- **Impacto futuro:** Mientras siga así, el backend no puede ser 100% inglés en su frontera. Migrarlo es el paso que cierra TD-002 (mover el contrato a inglés y eliminar el mapeo del service).
- **Fecha:** 2026-05-31 · **Estado:** Abierto

## [TD-006] `Payment.processedBy` placeholder en los cobros migrados desde Reservation

- **Ubicación:** `apps/api/prisma/migrations/20260607155007_add_payment_model/migration.sql:50` (bloque DataMigration)
- **Riesgo:** 3/10
- **Problema:** El modelo viejo (`Reservation.totalAmount/paymentMethod/paidAt`) no registraba qué empleado procesó el cobro. Al normalizar a `Payment` (RM-011), el backfill asigna `processedBy = primer empleado existente` como placeholder para no perder el resto del cobro. Ese dato no refleja quién cobró realmente esas reservas históricas.
- **Impacto futuro:** Cualquier reporte o auditoría que agrupe pagos por empleado contará esos `Payment` migrados bajo un empleado que no los procesó. Solo afecta a las reservas pagadas antes de RM-011; los cobros nuevos (RM-013) guardan el empleado real vía `@CurrentUser()`. No hay forma de recuperar el dato original.
- **Fecha:** 2026-06-07 · **Estado:** Abierto

## [TD-007] Data de prueba template (`seeds/testing/`) es desechable

- **Ubicación:** `apps/api/prisma/seeds/testing/` (rooms, guests, staff, reservations, charges, payments), orquestador `apps/api/prisma/seed.placeholder.ts`, script `seed:placeholder` en `apps/api/package.json`
- **Riesgo:** 2/10
- **Problema:** Los seeds bajo `seeds/testing/` (cuartos, huéspedes, personal, reservas, cargos y pagos) son datos template para probar el flujo del PMS, no base real. Incluyen credenciales de prueba (`manager/manager`, `recepcion1/recepcion1`, `limpieza1/limpieza1`). Las reservas/cargos/pagos usan guard por conteo (idempotentes pero no re-sembrables parcialmente).
- **Impacto futuro:** Si esta carpeta llega a producción siembra datos y usuarios falsos con contraseñas triviales. Es deuda intencional y de baja prioridad: existe para que quede registrado que debe eliminarse.
- **Plan:** Al finalizar el proyecto, borrar la carpeta `seeds/testing/`, `seed.placeholder.ts` y el script `seed:placeholder`. Solo debe sobrevivir `npm run seed` (owner + categorías + discounts).
- **Fecha:** 2026-06-07 · **Estado:** Abierto

## [TD-008] Sin guard de rol en el frontend para páginas restringidas

- **Ubicación:** `apps/web/src/app/dashboard/auditoria/page.tsx`, `apps/web/src/app/dashboard/rooms/page.tsx`, `apps/web/src/app/dashboard/staff/page.tsx`, `apps/web/src/components/protected-route.tsx`
- **Riesgo:** 4/10
- **Problema:** `ProtectedRoute` solo valida que exista token, no el rol. La restricción por rol depende únicamente de ocultar el enlace en el sidebar (`allowedRoles`) y del guard del backend (`@Roles('OWNER')` en `/audit-logs`, etc.). Un usuario no-OWNER que navegue directo a `/dashboard/auditoria` ve el cascarón de la página; la data falla con 403 (tabla vacía + toast de error), pero la UI no lo redirige.
- **Impacto futuro:** No es un hueco de seguridad real (el backend protege los datos), pero es una fuga de UX: páginas visibles para roles que no deberían acceder. Mejora: extender `ProtectedRoute` con prop `allowedRoles` y envolver las páginas sensibles (auditoría, rooms, staff) para redirigir a `/dashboard` cuando el rol no coincide.
- **Fecha:** 2026-06-07 · **Estado:** Abierto

## [TD-010] Mapeo de tipo de habitación duplicado en 6 archivos

- **Ubicación:** `apps/web/src/app/dashboard/reservas/page.tsx`, `huespedes/page.tsx`, `servicio/page.tsx`, `reservas/ReservationFormDialog.tsx`, `rooms/page.tsx`, `dashboard/page.tsx`
- **Riesgo:** 3/10
- **Problema:** La traducción `SINGLE/DOUBLE/SUITE → Sencilla/Doble/Suite` está copiada en seis sitios como `getRoomTypeLabel` / `getTypeTranslation` / `getTypeLabel`. No hay fuente única de verdad.
- **Impacto futuro:** Agregar o renombrar un tipo de habitación obliga a editar los seis archivos de forma coordinada; es fácil dejar uno desincronizado. Solución: extraer un helper único (p. ej. `lib/room.ts`) y reusarlo.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

## [TD-011] Extracción del mensaje de error de Axios duplicada en ~6 sitios

- **Ubicación:** `apps/web/src/app/login/page.tsx`, `dashboard/rooms/page.tsx`, `dashboard/reservas/page.tsx` (handleCheckIn, confirmCheckOut, confirmCancel), `dashboard/reservas/ReservationFormDialog.tsx`
- **Riesgo:** 3/10
- **Problema:** En cada `catch` se repite el mismo bloque: castear `error as { response?: { data?: { message?: string | string[] } } }` y resolver `Array.isArray(raw) ? raw[0] : raw ?? fallback`. Lógica idéntica copiada en ~6 lugares.
- **Impacto futuro:** Cualquier cambio en el formato de error del backend (o querer mostrar todos los mensajes del array, no solo el primero) hay que replicarlo en todos los sitios. Solución: helper `getApiErrorMessage(error, fallback)` en `lib/`.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

## [TD-013] Badge de estado de reserva duplicado entre dos páginas

- **Ubicación:** `apps/web/src/app/dashboard/reservas/page.tsx:263` (`getStatusBadge`), `apps/web/src/app/dashboard/huespedes/page.tsx:66` (`getStatusBadge`)
- **Riesgo:** 2/10
- **Problema:** El mapeo de `PENDING/ACTIVE/COMPLETED/CANCELLED` a clases de color + etiqueta está implementado por separado en ambas páginas, con labels y estilos que ya divergen (p. ej. "Próximos a llegar" vs "Próxima").
- **Impacto futuro:** Los estados se ven distintos según la página y agregar/renombrar un estado exige tocar ambos. Relacionado con [[TD-010]] (mismo patrón de mapeo duplicado). Solución: componente/helper compartido para el badge de estado.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

## [TD-014] `JWT_SECRET` con fallback hardcodeado y predecible

- **Ubicación:** `apps/api/src/modules/auth/jwt.strategy.ts:11`, `apps/api/src/modules/auth/auth.module.ts:13`
- **Riesgo:** 7/10
- **Problema:** Tanto al firmar (`JwtModule.register`) como al validar (`JwtStrategy`) el secreto es `process.env.JWT_SECRET || 'super-secret-key-123'`. Si la variable de entorno falta, la app arranca sin error usando un secreto público y predecible (está en el repo).
- **Impacto futuro:** Con ese secreto cualquiera puede firmar JWTs válidos con `role: 'OWNER'` y obtener bypass total de auth/RBAC. El fallback silencioso hace que un despliegue mal configurado parezca funcionar. Solución: leer `JWT_SECRET` sin fallback y abortar el arranque si no está definido.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

## [TD-015] Seed real del owner con credenciales por defecto `admin/admin`

- **Ubicación:** `apps/api/prisma/seeds/owner.ts:9`
- **Riesgo:** 6/10
- **Problema:** El seed de producción (`seed.ts` → `seedOwner`, distinto del de [[TD-007]] en `seeds/testing/`) crea la cuenta OWNER con `username: 'admin'` / `password: 'admin'`. La única salvaguarda es un comentario que pide editar el archivo antes de sembrar.
- **Impacto futuro:** Si se siembra sin editar, queda una cuenta de máximo privilegio trivialmente adivinable en cualquier entorno (incluida la BD remota/Docker). Solución: tomar las credenciales del owner desde variables de entorno y/o forzar cambio de contraseña en el primer login.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

## [TD-016] `PrismaService` traga el fallo de conexión al arrancar

- **Ubicación:** `apps/api/src/providers/prisma/prisma.service.ts:24`
- **Riesgo:** 5/10
- **Problema:** `onModuleInit` envuelve `$connect()` en try/catch y ante un error solo hace `console.error`. El módulo se inicializa "ok" aunque la base de datos esté caída o mal configurada.
- **Impacto futuro:** La app levanta y el `/health` puede pasar, pero cada query falla en runtime con errores tardíos y confusos en vez de fallar rápido al boot. Solución: re-lanzar el error (o no atraparlo) para que el arranque aborte si no hay BD.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

## [TD-017] `ValidationPipe` global sin whitelist ni transform

- **Ubicación:** `apps/api/src/main.ts:7`
- **Riesgo:** 4/10
- **Problema:** Se registra `new ValidationPipe()` sin `whitelist: true`, `forbidNonWhitelisted: true` ni `transform: true`. Las propiedades no declaradas en los DTOs no se filtran ni se rechazan, y no hay coerción de tipos automática.
- **Impacto futuro:** La protección contra payloads con campos extra depende de que cada service mapee campos a mano (hoy lo hace, pero es frágil ante futuros `create`/`update` que confíen en el DTO). Solución: habilitar `whitelist`, `forbidNonWhitelisted` y `transform` en el pipe global.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

## [TD-018] Uso extendido de `any` en la frontera de auth

- **Ubicación:** `apps/api/src/modules/auth/auth.service.ts` (`validateUser`, `login`), `auth/jwt.strategy.ts:18` (`validate`), `auth/auth.controller.ts:37` (`getProfile`), `modules/employees/employees.controller.ts` (`currentUser: any`)
- **Riesgo:** 3/10
- **Problema:** El payload del JWT, el usuario actual y el objeto de login se tipan como `any` en toda la cadena de autenticación/autorización.
- **Impacto futuro:** Se pierde el chequeo de tipos justo donde vive el modelo de seguridad; un typo en `user.role`/`user.id` no lo detecta el compilador. Solución: definir una interfaz `AuthUser`/`JwtPayload` y usarla en strategy, decorador `@CurrentUser` y services.
- **Fecha:** 2026-06-19 · **Estado:** Abierto
