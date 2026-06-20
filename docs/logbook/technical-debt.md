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

- **Ubicación:** `apps/api/src/modules/reservations/reservations.service.ts` (`assertNoOverlap`, ~línea 127; invocado desde `create` y `update`)
- **Riesgo:** 5/10
- **Problema:** La validación de solapamiento (`assertNoOverlap` → `findFirst` con `checkIn < checkOut` y `checkOut > checkIn`) y el `create`/`update` de la reserva son dos operaciones separadas. Dos peticiones simultáneas para el mismo cuarto y fechas pueden pasar ambas el chequeo antes de que cualquiera inserte, generando doble reserva.
- **Impacto futuro:** Overbooking real bajo concurrencia. La validación en código cubre el flujo normal, pero no la carrera. Solución planificada en RM-024: constraint a nivel de BD `EXCLUDE USING gist` con `tsrange` sobre `(roomId, [checkIn, checkOut))` (requiere extensión `btree_gist`).
- **Fecha:** 2026-05-30 · **Estado:** Abierto

## [TD-002] Contrato HTTP de Employee aún en español (capa de mapeo temporal)

- **Ubicación:** `apps/api/src/modules/employees/employees.service.ts` (mapas `TURNO_TO_SHIFT_NAME` ~línea 21 / `SHIFT_NAME_TO_TURNO` ~línea 27, `toSpanishShape` ~línea 38), `apps/api/src/modules/employees/dto/create-employee.dto.ts`, `apps/api/src/modules/employees/dto/update-employee.dto.ts`
- **Riesgo:** 3/10
- **Problema:** La DB y la capa Prisma quedaron en inglés (`firstName`, `shift`, etc.; el turno se normalizó a la tabla `Shift` con nombres `MORNING/AFTERNOON/NIGHT`), pero el contrato HTTP sigue en español (`nombres`, `turno`, valores `MAÑANA/TARDE/NOCHE`). El service traduce en ambas fronteras: a la entrada conecta por nombre traducido (`TURNO_TO_SHIFT_NAME`) y a la salida reconstruye la forma española (`toSpanishShape`/`SHIFT_NAME_TO_TURNO`), para no tocar el frontend. Es código puente, no estado final.
- **Impacto futuro:** Doble fuente de verdad de nombres; cualquier campo nuevo hay que mapearlo en dos sitios y es fácil olvidarlo. Se elimina cuando se traduzca el frontend a inglés (DTOs pasan a passthrough directo y se borran los mapas).
- **Fecha:** 2026-05-31 · **Estado:** Abierto

## [TD-003] Valores de `Cargo` en español como nombres del catálogo `JobPosition`

- **Ubicación:** `apps/api/src/modules/employees/dto/create-employee.dto.ts:10` (`VALID_CARGOS`), `employees.service.ts:14` (`CARGO_TO_ROLE`), conexión por nombre en `create`/`update` (`jobPosition: { connect: { name: data.cargo } }`)
- **Riesgo:** 2/10
- **Problema:** El antiguo `position` se normalizó a la tabla-catálogo `JobPosition` (`positionId` FK), pero los valores `'Manager' | 'Recepcionista' | 'Botones' | 'Limpieza'` se mandan desde el front y se persisten tal cual como `JobPosition.name` (y la conexión se hace **por nombre**). Quedan como dato en español dentro de una DB ya estandarizada a inglés, y el `name` es además la clave funcional con la que se enlaza al empleado.
- **Impacto futuro:** Traducir los cargos a inglés exige renombrar las filas de `JobPosition`, migrar el `connect by name` y actualizar front + `CARGO_TO_ROLE` de forma coordinada. Al ser el `name` la clave de conexión, el cambio es más delicado que un simple update de columna.
- **Fecha:** 2026-05-31 · **Estado:** Abierto

## [TD-004] Frontend habla español en el contrato (campos y valores de turno)

- **Ubicación:** `apps/web/src/app/dashboard/staff/EmployeeFormDialog.tsx`, `apps/web/src/app/dashboard/staff/page.tsx`, `apps/web/src/store/authStore.ts`, `apps/web/src/components/app-sidebar.tsx`
- **Riesgo:** 2/10
- **Problema:** El frontend envía/lee campos en español (`nombres`, `apellidoPaterno`, `cargo`, `turno`) y los valores de turno `MAÑANA/TARDE/NOCHE`. Es lo que obliga a mantener la capa de mapeo de [[TD-002]].
- **Impacto futuro:** Mientras siga así, el backend no puede ser 100% inglés en su frontera. Migrarlo es el paso que cierra TD-002 (mover el contrato a inglés y eliminar el mapeo del service).
- **Fecha:** 2026-05-31 · **Estado:** Abierto

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

## [TD-015] Seed real del owner con credenciales por defecto `admin/admin`

- **Ubicación:** `apps/api/prisma/seeds/owner.ts:9`
- **Riesgo:** 6/10
- **Problema:** El seed de producción (`seed.ts` → `seedOwner`, distinto del de [[TD-007]] en `seeds/testing/`) crea la cuenta OWNER con `username: 'admin'` / `password: 'admin'`. La única salvaguarda es un comentario que pide editar el archivo antes de sembrar.
- **Impacto futuro:** Si se siembra sin editar, queda una cuenta de máximo privilegio trivialmente adivinable en cualquier entorno (incluida la BD remota/Docker). Solución: tomar las credenciales del owner desde variables de entorno y/o forzar cambio de contraseña en el primer login.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

## [TD-017] `ValidationPipe` global sin whitelist ni transform

- **Ubicación:** `apps/api/src/main.ts:7`
- **Riesgo:** 4/10
- **Problema:** Se registra `new ValidationPipe()` sin `whitelist: true`, `forbidNonWhitelisted: true` ni `transform: true`. Las propiedades no declaradas en los DTOs no se filtran ni se rechazan, y no hay coerción de tipos automática.
- **Impacto futuro:** La protección contra payloads con campos extra depende de que cada service mapee campos a mano (hoy lo hace, pero es frágil ante futuros `create`/`update` que confíen en el DTO). Solución: habilitar `whitelist`, `forbidNonWhitelisted` y `transform` en el pipe global.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

## [TD-020] `pnpm lint` rojo repo-wide por `react-hooks/set-state-in-effect`

- **Ubicación:** `apps/web/src/app/dashboard/{auditoria,calendario,reservas,rooms,servicio,staff,reportes}/page.tsx` y `reservas/ReservationFormDialog.tsx`
- **Riesgo:** 3/10
- **Problema:** La regla `react-hooks/set-state-in-effect` (error) marca el patrón establecido `useEffect(() => { fetchX(); }, [fetchX])` —donde `fetchX` hace `setState`— en todas las páginas del dashboard. `pnpm lint` falla con ~12 errores; `next build` (que solo corre TypeScript) sí pasa.
- **Impacto futuro:** El lint no puede usarse como gate en CI hasta resolverlo. Es transversal: cualquier página nueva que siga el patrón hereda el error. Solución: o ajustar el patrón de fetching (p. ej. effect que sincroniza sin setState directo / mover loading a la data), o relajar/configurar la regla a `warn` de forma deliberada.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

## [TD-019] Reportería muestra solo ingreso bruto (utilidad neta diferida)

- **Ubicación:** `apps/api/src/modules/analytics/analytics.service.ts`, `apps/web/src/app/dashboard/reportes/page.tsx`
- **Riesgo:** 2/10
- **Problema:** RM-037 pedía "utilidad" (ingresos − egresos), pero la BD no tiene ninguna fuente de egresos/costos (empleados sin sueldo, habitaciones sin costo). La primera iteración entrega solo **ingreso bruto** mensual/anual derivado de `Payment`; no hay cálculo de utilidad neta real.
- **Impacto futuro:** El Owner ve ingresos, no rentabilidad. Para la utilidad neta hay que modelar costos primero (planilla con sueldos y/o costos operativos fijos), conectarlos a la agregación y reetiquetar la página. Mientras no exista esa fuente, "utilidad neta" sigue siendo inderivable.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

## [TD-018] Uso extendido de `any` en la frontera de auth

- **Ubicación:** `apps/api/src/modules/auth/auth.service.ts` (`validateUser`, `login`), `auth/jwt.strategy.ts:18` (`validate`), `auth/auth.controller.ts:37` (`getProfile`), `modules/employees/employees.controller.ts` (`currentUser: any`)
- **Riesgo:** 3/10
- **Problema:** El payload del JWT, el usuario actual y el objeto de login se tipan como `any` en toda la cadena de autenticación/autorización.
- **Impacto futuro:** Se pierde el chequeo de tipos justo donde vive el modelo de seguridad; un typo en `user.role`/`user.id` no lo detecta el compilador. Solución: definir una interfaz `AuthUser`/`JwtPayload` y usarla en strategy, decorador `@CurrentUser` y services.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

## [TD-021] Comprobante con datos de empresa/fiscales placeholder y sin dirección del huésped

- **Ubicación:** `apps/web/src/lib/comprobante.ts` (`EMPRESA`, `formatCorrelativo`), `apps/web/src/lib/printComprobante.ts` (armado de la boleta)
- **Riesgo:** 3/10
- **Problema:** El comprobante (RM-041) usa datos de empresa/fiscales **hardcodeados como placeholder** (RUC, dirección, teléfono y email inventados; serie/correlativo `B001-xxxxxxx` sintético derivado de `payment.id`) y **omite la dirección del huésped** —que la boleta de referencia sí muestra— porque el modelo `Guest` no tiene campo `address`. La fila DIRECCIÓN se sustituyó por "Contacto" (teléfono/email).
- **Impacto futuro:** El documento muestra datos ficticios (mitigado por el disclaimer "no válido para SUNAT"). Para datos reales o fidelidad total con la referencia hay que: parametrizar los datos de la empresa (config/env o tabla) y, si se quiere la dirección, agregar `address` (y posibles datos fiscales) a `Guest` manteniendo la BD normalizada.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

## [TD-022] Lógica de paginación por cursor duplicada en cada página

- **Ubicación:** `apps/web/src/app/dashboard/rooms/page.tsx`, `reservas/page.tsx`, `huespedes/page.tsx`, `analiticas/page.tsx` (bloque `cursorStack` / `cursor` / `total` / `nextCursor` / `hasNext` + `handleNextPage` / `handlePrevPage`)
- **Riesgo:** 3/10
- **Problema:** El mismo bloque de estado y handlers de paginación por cursor (≈25-30 líneas: `cursorStack`, derivación de `cursor`, `total`, `nextCursor`, `hasNext`, `handleNextPage`, `handlePrevPage` y el `useEffect` que resetea el stack al cambiar filtros) está copiado en cada página listada. Es parte del "ruido" que infla esos componentes.
- **Impacto futuro:** Cualquier ajuste al contrato de paginación (nombres de campos, reseteo de cursor, off-by-one en prev/next) hay que replicarlo a mano en 4+ sitios; fácil que diverjan. Cada página nueva con tabla vuelve a copiar el patrón.
- **Archivo a crear:** `apps/web/src/hooks/use-cursor-pagination.ts` — hook que exponga `{ cursor, cursorStack, total, hasNext, hasPrev, nextPage, prevPage, reset, setPageMeta }` y centralice el reseteo al cambiar filtros. Las páginas pasan a consumirlo y solo conservan su `fetch`.
- **Fecha:** 2026-06-20 · **Estado:** Abierto

## [TD-023] Páginas del dashboard monolíticas (vista + estado + diálogos en un solo archivo)

- **Ubicación:** `apps/web/src/app/dashboard/reservas/page.tsx` (775), `analiticas/page.tsx` (763), `rooms/page.tsx` (648), `page.tsx` (dashboard, 470), `login/page.tsx` (554)
- **Riesgo:** 4/10
- **Problema:** Estas páginas concentran en un único componente el fetching, el estado de filtros/acciones, la tabla/grilla, los diálogos y los helpers de presentación. Son archivos de 450-775 líneas difíciles de leer, revisar y modificar sin conflictos. El patrón correcto ya existe en el repo (`staff/EmployeeFormDialog.tsx`, `reservas/ReservationFormDialog.tsx`, `reservas/ReservationDetailDialog.tsx`); falta aplicarlo al resto. Se excluye a propósito `components/ui/sidebar.tsx` (678) por ser primitivo generado por shadcn.
- **Impacto futuro:** A mayor tamaño, más probabilidad de bugs al editar, peores diffs y más fricción para reutilizar piezas (p. ej. la celda de acciones por estado de reserva, o las tarjetas de habitación). Crece con cada feature.
- **Archivos a crear (propuesta de descomposición):**
  - **reservas:** `reservas/ReservationFilters.tsx` (búsqueda + selects + rango de fechas), `reservas/ReservationsTable.tsx` (o `ReservationRow.tsx` con la celda de acciones por estado), `reservas/CheckoutDialog.tsx` (diálogo de cobro con el cálculo de totales), `reservas/CancelReservationDialog.tsx`, hook `reservas/use-reservations.ts` (fetch + filtros + check-in/out/cancel).
  - **analiticas:** `analiticas/OperationalMetrics.tsx` (top rooms, ranking de empleados, ocupación), `analiticas/AuditLogTable.tsx`, `analiticas/AuditLogFilters.tsx`, `analiticas/AuditLogDetailDialog.tsx`, `analiticas/types.ts`, hooks `analiticas/use-audit-logs.ts` y `analiticas/use-operational-metrics.ts`.
  - **rooms:** mover `STATUS_META`/`formatRate` a `lib/room.ts`; `rooms/RoomStatusPill.tsx`, `rooms/RoomFilters.tsx` (chips + toggle cuadrícula/lista), `rooms/RoomCard.tsx`, `rooms/RoomListRow.tsx`, `rooms/RoomFormDialog.tsx` (extraer el diálogo crear/editar).
  - **dashboard:** `dashboard/RoomStatusCard.tsx` (KPI), `dashboard/RoomTile.tsx` + `dashboard/RoomBoard.tsx` (grilla con cambio de estado), `dashboard/RoomStatusDialog.tsx`, hook `dashboard/use-rooms-board.ts`.
  - **login:** `login/LoginBrandPanel.tsx` (panel izquierdo decorativo), `login/LoginForm.tsx`, y los SVG del patrón de montaña a `components/brand/MountainPattern.tsx` (reutilizable con el sidebar).
- **Fecha:** 2026-06-20 · **Estado:** Abierto
