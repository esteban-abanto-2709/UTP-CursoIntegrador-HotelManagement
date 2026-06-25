# Changelog

Registro permanente de todo el trabajo terminado. Indexado por código de tarea
(`TD-`, `RM-`, `WL-`). Orden inverso: lo más nuevo arriba.

**Formato de cada entrada:**

```
## [CÓDIGO] Título (YYYY-MM-DD HH:MM)
Resumen en ≤2 líneas de lo que se hizo.
```

> Las entradas históricas migradas desde el `CHANGELOG.md` original venían
> agrupadas por milestone y sin fecha; se conservan así (sin fecha, no se
> consulta git para inventarla). Cada milestone lista los códigos `RM` que cubre.

---

## [TD-027] Seeds ejecutables en producción sin `ts-node` (2026-06-25 09:32)
Los seeds dejaron de depender de `ts-node` en runtime (causaba `spawn ts-node ENOENT` y dejaba la BD migrada pero vacía): nuevo `apps/api/prisma/tsconfig.seed-build.json` los compila a `prisma/dist-seed/*.js` en el stage `build` del Dockerfile y el `runner` los corre con `node` desde `docker-entrypoint.sh` tras `migrate deploy`, según el flag `SEED_MODE` (`none|base|demo`) del `.env` (documentado en `apps/docker/.env.example`). Probado en local: build + migración + seed + login OK. (Código corregido de TD-026 a TD-027 por colisión: TD-026 ya estaba usado en este changelog.)

## [RM-049] Dockerizar `apps/web` para el deploy en Digital Ocean (2026-06-23 14:27)
`apps/web` ahora corre en contenedor: nuevo `Dockerfile` multi-stage (base `node:22-alpine` + corepack, etapas deps→build→runner) con build standalone de Next 16 (`output: "standalone"` en `next.config.ts`), copiando `.next/standalone` + `.next/static` + `public` y arrancando con `node server.js` como usuario no-root en el puerto 3000. `NEXT_PUBLIC_API_URL` (se hornea en build) se pasa como build ARG con default `http://localhost:4000`; nuevo servicio `web` en `docker-compose.yml` (build con ese arg, `ports 3000:3000`, `depends_on api`, red `hotel-net`) y `.env.example` documentado. Build local de Next verde (genera `standalone/server.js`); el build/levantado del contenedor y el deploy lo corre el usuario.

## [RM-038] Filtros en el calendario de ocupación (2026-06-23 14:32)
`GET /rooms` ahora filtra server-side por `type`, `status` y `search` (número de cuarto, `contains` insensitive): `FindRoomsDto` extendido reusando `VALID_ROOM_TYPES`/`VALID_ROOM_STATUSES` y `rooms.service.findAll` construye `where` (aplicado también al `count`), replicando el patrón de `ReservationsService` (RM-020–RM-023). El calendario (`dashboard/calendario/page.tsx`) suma barra de filtros (búsqueda con debounce 300ms + selects de tipo y estado + "Limpiar filtros") que acota las filas del `OccupancyTimeline`; `routes.rooms.list` admite los nuevos params. Reservas se siguen trayendo completas (ventana de 14 días client-side). Builds api/web verdes.

## [TD-026] Detalle de huésped rompía por relaciones sin aplanar (2026-06-21 13:37)
`GET /guests/:id` (`guests.service.findOne`) devolvía cada reserva con las relaciones crudas tras la normalización a catálogos (M6): `statusId` en vez de `status` y `room.type` como objeto `{id,name}`. El diálogo de historial en `huespedes/page.tsx` pasaba ese objeto a `getRoomTypeLabel`, que lo retornaba tal cual y React lo renderizaba como hijo → crash "Objects are not valid as a React child" al abrir cualquier fila. Fix: `findOne` ahora incluye `status.name` y `room.type.name` y aplana a string (`status`, `room.type`), replicando el patrón `flattenReservation` del módulo de reservas. Build API verde; verificación en runtime pendiente de reinicio del backend por el usuario.

## [RM-036] "Nueva reserva" del header abre el diálogo desde cualquier página (2026-06-21 13:37)
El diálogo de creación de reserva se extrajo a `components/reservation-form-dialog.tsx` y se montó una sola vez vía `components/reservation-dialog-provider.tsx` (contexto con `openCreate`/`openEdit`/`onSaved`), envuelto en `dashboard/layout.tsx`. El botón "Nueva reserva" del header llama `openCreate()` en vez de navegar a `/dashboard/reservas`; la página de reservas consume el contexto para crear/editar y refresca su tabla vía `onSaved`, y se le quitó su botón "Nueva Reserva" local (redundante con el del header). Builds api/web verdes. **Cierre tal cual (decisión del usuario):** los otros controles de RM-036 —buscador y notificaciones del header— siguen como UI sin feature (flags en `true`) y quedan **fuera de seguimiento** del roadmap.

## [RM-048] Ajustar el Dockerfile del API a pnpm 11.8 (2026-06-21 11:34)
Imagen base `node:20-alpine` → **`node:22-alpine`** (pnpm 11.8 exige Node ≥22.13) y `corepack enable` precedido de `npm install -g corepack@latest` para evitar el fallo de verificación de firma al descargar la versión nueva de pnpm. Añadido `prisma.config.ts` al `COPY` de la etapa `prod-deps` (su `prisma generate` corría sin la config, a diferencia del runner). **Fix del build de Docker:** pnpm 11 ya no honra la lista `onlyBuiltDependencies` de `pnpm-workspace.yaml` (con `strictDepBuilds` default ahora es error duro `ERR_PNPM_IGNORED_BUILDS`, no warning); se migró al mapa `allowBuilds` (`bcrypt`/`prisma`/`@prisma/client`/`@prisma/engines`/`@nestjs/core: true`, `unrs-resolver: false`). En local no fallaba porque pnpm cacheaba la aprobación de builds en su config global; reproducido y validado e2e con config global aislada (install + `prisma generate` + `nest build` verdes). Cierra el "Docker en otra iteración" de [[RM-047]]; el build/levantado del contenedor lo corre el usuario.

## [RM-047] Migrar `apps/api` a pnpm 11.8 (2026-06-21 10:48)
`packageManager` de `apps/api` subido de pnpm 10.17.1 a **11.8.0** (hash fijado con `corepack use`); lockfile regenerado bajo 11.8.0 (sigue `lockfileVersion '9.0'`, sin migración de formato). Sin tocar ajustes (el move del campo `pnpm` a `pnpm-workspace.yaml` ya estaba absorbido) ni `apps/web` (queda en pnpm 10 por Vercel). `prisma generate` + `pnpm build` (`nest build`) verdes; Docker se ajusta en otra iteración.

## [RM-035] Varios descuentos en un mismo checkout (2026-06-20 20:47)
Relación `Payment`↔`Discount` pasó a muchos-a-muchos vía tabla puente explícita `PaymentDiscount` (`paymentId`, `discountId`, `percentage` snapshot por fila); migración única `payment_multiple_discounts` (crear tabla+FKs → backfill del `discountId` único → drop de columna/FK/índice viejos). `CheckoutReservationDto.discountId?` → `discountIds?: number[]`; `checkOut()` valida cada descuento (existe+activo) y aplica **en cascada** (`running -= running·pct/100`; total order-independent, sin tope) en un `$transaction` interactivo; `discountAmount` total agregado y `grandTotal` se conservan en `Payment` (snapshot financiero que usa analytics). `GET /payments/:id` deriva el monto por fila on-read y expone `discounts[]`. Seed enriquecido: nuevos `DiscountType` (GROUP, EARLY_BIRD) y 11 descuentos repartidos por tipo; `seed:demo` reparte 0/1/2 descuentos por pago. Front: el `<select>` único del checkout pasó a descuentos **agrupados por tipo** con un dropdown por grupo (uno por tipo); desglose en cascada en diálogo, detalle y comprobante. Decisión cascada = regla deliberada (no TD). Builds api/web verdes.

## [RM-034] DiscountType — clasificar los descuentos por categoría (2026-06-20 19:54)
Nueva tabla-catálogo `DiscountType` (SEASONAL/LOYALTY/PROMOTIONAL/CORPORATE) + `typeId` (FK NOT NULL) y `createdAt` en `Discount`; migración única `add_discount_type_table` (crear→sembrar→nullable→backfill por nombre→NOT NULL→FK). Seed reejecutable `discount-types.ts` en `seed.ts`, `discounts.ts` conecta su tipo por nombre, y `GET /discounts` aplana `type` a string. Build API verde.

## [RM-046] Paginación server-side (cursor) en los listados del dashboard (2026-06-20 13:18)
Paginación por cursor en los 5 listados (reservas, huéspedes, staff, auditoría, habitaciones): nuevo `common/pagination/` (DTO + helpers `cursorArgs`/`buildPage`, técnica take+1, ventana opt-in vía `take`) reusado por los services, que ahora devuelven `{ data, total, nextCursor, hasNext }` con `orderBy` desempatado por `id`. Front: componente compartido `PaginationControls` (Anterior/Siguiente + total) y pila de cursores local por página; búsqueda de reservas movida a la API (`search` en `FilterReservationsDto`). Consumidores no paginados (dashboard home, calendario, servicio, autocomplete de huéspedes, dropdown de empleados, dropdown de habitaciones de reservas) adaptados a `.data`. Sin migración de BD. Builds api/web verdes.

## [RM-043] Pase de rediseño del dashboard — estado de un vistazo (2026-06-20 10:31)
Dashboard (`dashboard/page.tsx`) ahora muestra los 4 estados en el resumen superior: se agregó la tarjeta KPI **Mantenimiento** (reusando estilo y colores `status-maintenance-*`) y la grilla pasó a `sm:grid-cols-2 lg:grid-cols-4`. El rediseño visual general se sigue afinando vía **Claude Design** (diseño mapeado por el usuario, fuera del repo). Build web verde.

## [RM-042] Detalle de consumos + regenerar comprobante en reservas (2026-06-20 09:24)
Nuevo diálogo en solo lectura `reservas/ReservationDetailDialog.tsx` accesible con "Ver detalle" en filas COMPLETED/CANCELLED: muestra huésped/habitación/fechas, el desglose de consumos (`/reservations/:id/charges`) y, para COMPLETED, el desglose de pago (`/payments/:id`) con botón **Regenerar comprobante** que reusa `generarComprobante`. Se retiró el botón de impresora inline de `reservas/page.tsx` (un solo camino: ver detalle → regenerar). Sin cambios de API/schema. Filtros por fecha/huésped/estado ya existían. Build web verde.

## [TD-013] Badge de estado de reserva unificado en un módulo compartido (2026-06-20 09:09)
Nuevo `lib/reservation.ts` (tipo `ReservationStatus`, labels + clases por estado) y componente `components/reservation-status-badge.tsx`. `reservas/page.tsx` y `huespedes/page.tsx` borran su `getStatusBadge`/tipo local y usan `<ReservationStatusBadge>`. Labels canónicos singulares (`Próxima`/`En hotel`/`Finalizada`/`Cancelada`); el filtro plural de reservas se mantiene aparte. Build web verde.

## [TD-022] Rebrand Lumina → Mirador Hotel Suite (2026-06-19 21:09)
Reemplazada la marca vieja "Lumina" por "Mirador Hotel Suite" en metadatos de la web (`layout.tsx`, `dashboard/layout.tsx`), landing del API (`app.service.ts`), docs/diagramas, READMEs, `CLAUDE.md` y fixtures `employees.http` (`@miradorhotel.pe`). El comprobante ya estaba en Mirador. Se dejaron intactas las claves internas de storage (`lumina-auth-storage`, `lumina-api-awake`) por desloguear. Builds de API y web en verde.

## [RM-041] Comprobante/boleta de pago con el desglose del huésped (2026-06-19 20:14)
Vista derivada en la web (sin tocar API ni schema): `lib/printComprobante.ts` (`generarComprobante`) arma la boleta desde `reservations.getOne` + `payments.getByReservation` + `reservations.charges` y la **imprime directo en un iframe oculto** (sin navegar), con el `title` del documento fijando el nombre del PDF (`Comprobante B001-xxxxxxx - {cliente}`). Réplica del PDF de referencia (marca Mirador, correlativo sintético desde `payment.id`, IGV 18% derivado del total, monto en letras). Nuevos helpers `lib/numeroALetras.ts` y `lib/comprobante.ts`; botón de impresión directa en `reservas/page.tsx` (filas COMPLETED). Datos placeholder/faltantes registrados en TD-021. Build verde.

## [TD-010] Helper único de tipo de habitación en `lib/room.ts` (2026-06-19 19:53)
Nuevo `lib/room.ts` (`getRoomTypeLabel`, `ROOM_TYPES`, `ROOM_TYPE_OPTIONS`, tipo `RoomType`) como fuente única del mapeo `SINGLE/DOUBLE/SUITE → Sencilla/Doble/Suite`. Eliminadas 7 copias del mapeo (`getRoomTypeLabel`/`getTypeTranslation`/`getTypeLabel`/`TYPE_LABELS`) en `huespedes`, `servicio`, `reservas/page`, `dashboard/page`, `rooms/page`, `calendario/OccupancyTimeline` y `ReservationFormDialog` (que además reusa `ROOM_TYPE_OPTIONS` en su `<select>` y el tipo local `RoomTypeValue` pasó a `RoomType`). Build verde.

## [TD-011] Helper único `getApiErrorMessage` para errores de Axios (2026-06-19 19:49)
Extraído el helper a un módulo puro `lib/api-error.ts` (antes vivía inline en `analytics-ui.tsx`, que ahora lo re-exporta para no romper sus consumidores). Reemplazados los 8 catch manuales duplicados en `login`, `reservas/page.tsx` (×3), `RoomChargesSheet`, `ReservationFormDialog`, `staff/EmployeeFormDialog` y `rooms/page.tsx`. Build verde.

## [RM-045] Reorganizar pestañas: Finanzas + Analíticas (2026-06-19 19:39)
Separada la antigua pestaña «Reportes» (que mezclaba finanzas y operativo) en dos: `/dashboard/finanzas` (solo KPIs e ingresos mensual/anual) y `/dashboard/analiticas` (ocupación, top habitaciones, ranking de empleados + la tabla de auditoría reubicada y re-estilada a la paleta crema Mirador). Eliminadas las rutas/carpetas `reportes` y `auditoria`; nuevo módulo compartido `lib/analytics-ui.tsx` (`ChartFrame`, `KpiCard`, paleta, helpers) reusado por ambas páginas. Actualizados `routes.ts`, `app-sidebar.tsx` y `dashboard-header.tsx`. Build verde.

## [RM-040] Panel de analítica con gráficos para el Owner (2026-06-19 19:10)
Tres endpoints OWNER-only nuevos en el módulo `analytics` (`GET /analytics/top-rooms`, `/employee-ranking`, `/occupancy?year`) que agregan on-read con SQL (top habitaciones por reservas/noches, ranking de empleados, ocupación mensual; sin tablas de acumulados). Página `/dashboard/reportes` extendida con 3 gráficos recharts. El ranking se basa en `RoomCharge.registeredBy` (autoría siempre real) para esquivar el placeholder de cobros migrados antes de RM-011 (`Payment.processedBy` = primer empleado; dato real irrecuperable). La entrada TD-006 que documentaba ese placeholder se eliminó por no tener arreglo posible. Builds verdes.

## [RM-037] Utilidad (ingreso bruto) mensual y anual para el Owner (2026-06-19 18:50)
Nuevo módulo backend OWNER-only `analytics` (`GET /analytics/revenue/monthly?year` y `/annual`) que agrega ingreso bruto on-read desde `Payment` con SQL (sin denormalizar), y página `/dashboard/reportes` con KPIs + gráficos recharts (barras mensuales, línea anual). Alcance = ingreso bruto; utilidad neta diferida (no hay fuente de egresos) → [[TD-019]]. Módulo dejado extensible para [[RM-040]]. Builds verdes.

## [TD-016] `PrismaService` ya no traga el fallo de conexión al arrancar (2026-06-19 18:33)
Quitado el try/catch de `onModuleInit` en `apps/api/src/providers/prisma/prisma.service.ts`; ahora `$connect()` propaga el error y el arranque aborta (fail-fast) si la BD está caída o mal configurada, en vez de levantar la app y fallar tarde en cada query.

## [TD-014] Quitar el fallback hardcodeado de `JWT_SECRET` (2026-06-19 17:05)
Centralizado el secreto en `apps/api/src/modules/auth/jwt.constants.ts`, que lee `process.env.JWT_SECRET` y **lanza al arrancar** si falta (ya no usa `'super-secret-key-123'`). `auth.module.ts` y `jwt.strategy.ts` importan `JWT_SECRET` de ahí (fuente única). `.env.example` pasó a placeholder vacío con instrucción. Build del API verde.

## [TD-009] Eliminar la ruta huérfana `app/temporal/` (2026-06-19 16:57)
Borrada la carpeta `apps/web/src/app/temporal/` (Gantt del cronograma académico, `page.tsx` + `Cronograma.tsx`), ruta pública sin guard de auth y sin enlace desde el sidebar. Verificado sin referencias antes de eliminar; saca una ruta innecesaria del árbol y del bundle.

## [TD-012] Eliminar `lib/mocks.ts` (código muerto) (2026-06-19 16:55)
Borrado `apps/web/src/lib/mocks.ts` (mocks/tipos en español sobrantes de las primeras maquetas). Verificado sin referencias en `apps/web/src` antes de eliminar; no afecta build ni rutas.

## [RM-032] Eliminar `createdBy` de la reserva (2026-06-19 16:48)
Revertido el «Creada por» de RM-020/021/023 a nivel UI + API + BD (Nivel 3): quitada la columna y el campo `creator` del front, de `reservationInclude` y de `create()`, y eliminada la columna `createdBy` (+FK e índice) vía migración `drop_reservation_created_by`. La trazabilidad sigue en `AuditLog` (intacto).

## Milestone 7 — Fidelidad de campos [RM-033]
- **RM-033 Reservation — rename de tarifa** *(parcial)*: renombrado `pricePerNight` → `rateSnapshot` (migración `reservation_field_fidelity` + `drop_reservation_derived_fields`).
**Por qué / qué se descartó:** la tarea originalmente proponía agregar `totalNights` y `roomTotal` denormalizados "por fidelidad con el modelo del profesor", pero esa premisa venía de un diagrama generado por IA, **no** de un requisito real (el profesor exige BD **100% normalizada**). Ambos campos eran derivables (`totalNights` de `checkIn`/`checkOut`; `roomTotal` de `rateSnapshot × noches` y ya presente en `Payment`), así que se revirtieron. El total se deriva on-read en `checkOut` y se persiste solo en `Payment`. Sobrevive solo el rename, que es un *snapshot* legítimo (no reconstruible desde `Room.price` actual) y mejor nombre.

## Milestone 6 — Normalización de enums a tablas [RM-025 – RM-030]
Patrón único de migración (crear catálogo → sembrar → FK nullable → backfill → drop del enum/columna), con seed reejecutable por catálogo:
- **RM-025 JobPosition** — `position: String?` → tabla `JobPosition`; contrato `cargo` por nombre intacto.
- **RM-026 Shift** — `enum Shift` → tabla `Shift` (`add_shift_table`); mapeo por nombre (`TURNO_TO_SHIFT_NAME`), contrato `turno` (MAÑANA/TARDE/NOCHE) intacto.
- **RM-027 PaymentMethod** — `enum PaymentMethod` → tabla `PaymentMethod`; `checkOut` resuelve nombre→id, `flattenPayment` aplana a string, contrato (CASH/CARD/TRANSFER) intacto.
- **RM-028 RoomType** — `enum RoomType` → tabla `RoomType`; DTOs con `@IsIn`, servicio resuelve por `connect`, `flattenType` aplana a string. Contrato (SINGLE/DOUBLE/SUITE) intacto.
- **RM-029 RoomStatus** — `enum RoomStatus` → tabla `RoomStatus`; transiciones check-in/out por `connect`, colores del front mapeados por `name`. Contrato intacto.
- **RM-030 ReservationStatus** — `enum ReservationStatus` → tabla `ReservationStatus`; cada `status === '...'` pasa a comparar por `name`, `create` fija `PENDING`, filtro y anti-solapamiento por `{ name }`. `create` pasó a `connect` de relaciones. Contrato intacto.

**Por qué:** convertir atributos resueltos con `enum` en tablas-catálogo con FK (confirmado con el profesor como parte de la normalización), manteniendo el contrato HTTP por nombre para no romper el front.

## Milestone 5 — Pulido y filtros [RM-020 – RM-023]
`createdBy` (FK → Employee, nullable, `ON DELETE SET NULL`) en `Reservation` vía `add_reservation_created_by`; `POST /reservations` guarda el empleado del JWT; `reservationInclude`/`flattenReservation` exponen `creator` y `/dashboard/reservas` mostró la columna «Creada por». Filtros server-side `from`/`to`/`roomId` + estado combinados (selector de habitación desde `GET /rooms`; búsqueda por texto sigue client-side).
**Por qué:** registrar autoría de la reserva y dar filtros operativos. **Nota:** la columna «Creada por» se revertirá en RM-032 (redundante con `AuditLog` y no debe verla el personal).

## Milestone 4 — Audit Log [RM-015 – RM-019]
`AuditAction` + `AuditLog`, `AuditService` `@Global()`, instrumentación en reservas/empleados/habitaciones, `GET /audit-logs` (`@Roles('OWNER')`) y página `/dashboard/auditoria`.
**Por qué:** trazabilidad central de quién hizo qué (CREATE/UPDATE/CANCEL/CHECKIN/CHECKOUT) con el empleado que ejecutó la acción.

## Milestone 3 — Payment + Descuentos [RM-011 – RM-014]
`Discount` + `Payment` desacoplado con desglose (`Prisma.Decimal`), `checkOut` refactorizado, diálogo de checkout con desglose. Eliminados `totalAmount`/`paymentMethod`/`paidAt` de `Reservation`. Aquí se introdujo el sistema de seeds reejecutable.
**Por qué:** el cobro es un hecho con vida propia (método, montos, quién y cuándo); sacarlo de `Reservation` lo normaliza y permite el desglose histórico.

## Milestone 2 — Room Charges [RM-008 – RM-010]
`ExpenseCategory` + `RoomCharge`, módulo `room-charges` y panel de cargos en `/dashboard/servicio`.
**Por qué:** registrar consumos extra por reserva (no solo la habitación) como entidad propia, clasificados por categoría.

## Milestone 1 — Guest [RM-001 – RM-007]
`Guest` como entidad propia con `nationalId`. Backfill y `guestId NOT NULL` consolidados en la migración `add_guest_normalize_reservation`. Módulo `guests`, formulario de reserva con buscar-por-DNI y página `/dashboard/huespedes`.
**Por qué:** normalizar los datos del huésped fuera de `Reservation` (antes iban inline), evitando duplicación y permitiendo reusar al huésped entre reservas.
