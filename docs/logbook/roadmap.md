# Roadmap

Trabajo comprometido: lo que sí se va a hacer. Código `RM-###` (nunca se reutiliza).
Al terminar una tarea se mueve al changelog y se borra de aquí.

**Formato de cada entrada:**

- **Objetivo:** qué se quiere lograr.
- **Hecho cuando:** criterio claro de finalización.
- **Fecha** y **Estado** (Abierto / En progreso).

---

> Lo ya resuelto vive en `changelog.md`. Aquí solo queda lo pendiente.
> **Requisito clave de BD:** debe quedar **100% normalizada** (lo exige el profesor). No denormalizar; preferir derivar on-read salvo *snapshots* legítimos (valores no reconstruibles desde el dato actual, ej. tarifa pactada).

## Convención Prisma

- **Una sola migración por cambio.** Una única migración hace todo de una (crear tabla, sembrar, FK, backfill, drop de columna/enum viejo). Nunca se parte en una segunda.
- Flujo: Claude edita `schema.prisma` → **tú corres** `pnpm prisma migrate dev --create-only --name <n>` → Claude ajusta el `migration.sql` → **tú aplicas**. Claude nunca corre migraciones.
- Es normal que la migración rompa el build/API temporalmente; se corrige antes de pushear. **No se pushea al remoto hasta que el build esté verde.**
- Catálogos sin CRUD se mantienen vía seed reejecutable: `prisma/seeds/<x>.ts` registrado en `seed.ts` (además del seed inline de la migración).

---

## Milestone 5 — Pulido y filtros *(opcional)*

## [RM-024] Constraint anti doble-reserva en PostgreSQL *(cierra [[TD-001]])*

- **Objetivo:** Cerrar la condición de carrera de overbooking a nivel de BD (hoy solo cubierta por validación en código).
- **Hecho cuando:** Existe `btree_gist` + `EXCLUDE USING gist` sobre `(roomId, tsrange("checkIn","checkOut",'[)'))` y dos reservas solapadas concurrentes no pueden coexistir.
- **Estado:** Abierto

---

## Milestone 6 — Normalización de enums a tablas *(opcional, confirmado con el profesor)*

> **Patrón** (una sola migración): crear tabla catálogo → sembrar → FK nullable → backfill desde el enum → drop del enum/columna vieja — todo junto. Luego actualizar API (DTOs, services, `include`) y front (selectores poblados desde el catálogo). Seed reejecutable por catálogo.

## [RM-031] Role — normalizar el RBAC a tabla *(mayor blast radius: todo el RBAC)*

- **Objetivo:** Convertir el `enum Role` en tabla-catálogo `Role` (OWNER/MANAGER/EMPLOYEE) + `roleId` (FK nullable) en `Employee`, eliminando `role` y el enum. Migración `add_role_table`.
- **Hecho cuando:** El enum desaparece, `Employee` referencia `roleId`, y JWT / `@CurrentUser()` siguen exponiendo el rol por **nombre** (string) para no romper `@Roles()`/`RolesGuard`/front (internamente se resuelve `roleId` por nombre).
- **Nota:** Hacer al final por su blast radius.
- **Estado:** Abierto

---

## Milestone 7 — Huecos restantes del modelo *(opcional)*

> Independientes entre sí. RM-034 y RM-035 ambas tocan `Discount`/`Payment` pero no dependen entre sí.

## [RM-034] DiscountType — clasificar los descuentos por categoría

- **Objetivo:** Añadir una dimensión de tipo/categoría sobre los descuentos. **Contexto:** hoy `Discount` (`name @unique`, `percentage`, `isActive`) tiene descuentos concretos que ya se aplican en checkout; `seeds/discounts.ts` siembra 4. No existe tabla `DiscountType`, ni `typeId`, ni `createdAt` en `Discount`.
- **Hecho cuando:** Existe tabla-catálogo `DiscountType` (`name @unique`: `SEASONAL`/`LOYALTY`/`PROMOTIONAL`/`CORPORATE`) + `typeId` (FK **NOT NULL**) y `createdAt` en `Discount`, sembrada y conectada, y `GET /discounts` devuelve `type` aplanado a string.
- **Migración `add_discount_type_table` (todo en una, patrón RM-028–RM-030):** crear tabla → sembrar los 4 tipos → `typeId` **nullable** → **backfill** (mapear por nombre: «Cliente frecuente»→`LOYALTY`, «Temporada baja»→`SEASONAL`, «Convenio corporativo»→`CORPORATE`, «Estadía larga»→`PROMOTIONAL`) → recién entonces FK **NOT NULL**.
- **Código:** seed reejecutable `seeds/discount-types.ts` (en `seed.ts`), `seeds/discounts.ts` conecta cada descuento con su `type` por nombre, y `GET /discounts` devuelve `type` con `include`.
- **Estado:** Abierto

## [RM-035] Varios descuentos en un mismo checkout

- **Objetivo:** Aplicar **varios** descuentos a la vez en el pago. **Problema:** el checkout solo admite **un** descuento (`Payment.discountId Int?`, `CheckoutReservationDto.discountId?`, `checkOut()` calcula con un único `%`).
- **Hecho cuando:** Un checkout puede registrar múltiples descuentos con su desglose, persistidos en la tabla puente y reflejados en respuestas y front.
- **Schema (migración `payment_multiple_discounts`):** relación `Payment`↔`Discount` de 1-a-muchos a **muchos-a-muchos** vía tabla puente explícita `PaymentDiscount` (`paymentId`, `discountId`, y **snapshotear** el `percentage` aplicado por fila para que el histórico no cambie si luego se edita el descuento). Quitar `discountId`/`discount` y `@@index([discountId])` de `Payment`.
- **API:** `CheckoutReservationDto`: `discountId?` → `discountIds?: number[]`. En `checkOut()`: validar que cada descuento exista y esté activo; **decisión de negocio a fijar (registrar en `technical-debt.md`):** ¿porcentajes **sumados** (10%+15%=25%) o **en cascada**? y **tope 100%**. Persistir una fila `PaymentDiscount` por descuento y guardar el `discountAmount` total agregado.
- **Respuestas:** donde se expone `payment.discount` pasar a `discounts` como arreglo.
- **Front:** diálogo de checkout (`apps/web/.../servicio`) cambia el `Select` único por selección múltiple y muestra el desglose sumando todos.
- **Estado:** Abierto

---

## Rediseño UI (Mirador)

## [RM-036] Cablear los controles del header de Mirador

- **Objetivo:** Conectar a features reales los controles del `DashboardHeader` que hoy van solo como UI. **Contexto:** el header (cream, estilo Mirador) ya renderiza buscador, pastilla de fecha, notificaciones y botón "Nueva reserva", pero detrás de un objeto `HEADER_FEATURES` en `apps/web/src/components/dashboard-header.tsx`; cada control se oculta poniendo su flag en `false` si no se llega con el feature.
- **Estado actual de cada control:** buscador (input local sin búsqueda real), fecha (dinámica, ya funciona), notificaciones (botón sin panel ni datos), "Nueva reserva" (navega a `/dashboard/reservas`, sin abrir el diálogo de creación).
- **Hecho cuando:** buscador filtra/navega a resultados reales, notificaciones muestra eventos reales, y "Nueva reserva" abre el flujo de creación; o bien el flag correspondiente queda en `false` de forma deliberada.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

---

## Recomendaciones del profesor / curso (revisión de cierre)

> Lote levantado de la retroalimentación del profesor y del curso (2026-06-19). Todas comprometidas. Agrupadas por tema; los códigos no implican orden de ejecución.

### UX / UI

## [RM-046] Paginar las tablas (frontend + API) para que no traigan todo de golpe

- **Objetivo:** Que las tablas con potencial de crecer (reservas, huéspedes, personal, auditoría, etc.) se paginen, de modo que la web muestre páginas y la API sirva solo el bloque pedido, sin traer todo el dataset en una sola petición.
- **Contexto:** Hoy las páginas del dashboard hacen `GET` sin paginación y pintan la lista completa (p. ej. `/dashboard/reservas`, `/dashboard/huespedes`, `/dashboard/staff`, y la tabla de auditoría en `/dashboard/analiticas`). Con muchos registros la respuesta del API y el render se vuelven pesados. Falta un patrón de paginación server-side (limit/offset o cursor) en los endpoints y su control de páginas en el front.
- **Hecho cuando:** Los endpoints de listado aceptan parámetros de paginación (p. ej. `page`/`pageSize` o `limit`/`offset`) y devuelven el bloque + metadatos (total/hasNext), y las tablas del front muestran controles de página consumiendo ese contrato. Reusar el patrón de filtros server-side de reservas (RM-020–RM-023) donde aplique, manteniendo la BD normalizada.
- **Nota:** complementa a [[RM-038]] (acotar filas del calendario) — misma motivación de escalar listas grandes.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

## [RM-038] Filtros en el calendario de ocupación para escalar con muchas habitaciones

- **Objetivo:** Que el calendario siga siendo usable cuando el número de habitaciones crezca.
- **Contexto:** `apps/web/src/app/dashboard/calendario/page.tsx` hace `GET /rooms` + `GET /reservations` **sin filtros** y `OccupancyTimeline` pinta **una fila por cada cuarto**; con muchas habitaciones la vista se vuelve inmanejable y la carga, pesada. No hay filtro por tipo/estado/piso ni paginación, ni acotación por rango de fechas en la query.
- **Hecho cuando:** El calendario permite filtrar/acotar las filas visibles (p. ej. por tipo de habitación, estado o búsqueda) y/o por rango de fechas, manteniendo el rendimiento con un catálogo grande de cuartos. Reusar el patrón de filtros server-side ya existente de reservas (RM-020–RM-023) donde aplique.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

## [RM-039] Cambiar el ícono "de personitas" del root (favicon / identidad)

- **Objetivo:** Reemplazar el ícono genérico de la pestaña/raíz por uno acorde a la identidad "Mirador · Hotel Suite".
- **Contexto:** El favicon vive en `apps/web/public/favicon.ico` y no está declarado en `metadata.icons` de `apps/web/src/app/layout.tsx` (Next lo toma por convención). El sidebar ya tiene una marca propia (logo SVG + "Mirador / Hotel Suite" en `app-sidebar.tsx`); el favicon quedó desalineado con esa identidad. *(Nota: el ícono `Users` de lucide en el sidebar es el del item «Personal»; si la observación apuntaba a ese, ajustar el icono de ese nav-item; confirmar cuál es "las personitas en el root" antes de tocar.)*
- **Hecho cuando:** El ícono del root/pestaña refleja la marca del PMS y reemplaza al placeholder actual.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

## [RM-043] Pase general de rediseño de la app (Claude Design)

- **Objetivo:** Mejorar el diseño general de la aplicación apoyándose en Claude Design, dándole consistencia visual a todas las páginas.
- **Contexto:** El rediseño "Mirador" ya empezó en el sidebar/header (ver [[RM-036]] y commits recientes), pero las páginas internas (rooms, staff, reservas, servicio, huéspedes, auditoría, calendario) conviven con estilos previos. Esto es el paraguas que unifica el lenguaje visual; [[RM-036]] (cablear controles del header) es un sub-pendiente concreto dentro de este esfuerzo.
- **Hecho cuando:** Las páginas del dashboard comparten un lenguaje visual coherente (tipografías Bricolage/Hanken ya cargadas, paleta, tarjetas, espaciados) y la UI luce terminada y consistente.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

### Estandarización de idioma

## [RM-044] Estandarizar idioma: BD/API en inglés, UI en español *(cierra [[TD-002]] [[TD-003]] [[TD-004]])*

- **Objetivo:** Dejar la estructura (BD + API: nombres de campos, valores, contrato HTTP) **en inglés por defecto** y reservar el español únicamente para lo que ve el usuario en la web.
- **Contexto:** La BD/Prisma ya está en inglés, pero el contrato HTTP de `Employee` sigue en español (`nombres`, `apellidoPaterno`, `cargo`, `turno` con valores `MAÑANA/TARDE/NOCHE`), sostenido por una capa de mapeo temporal en el service ([[TD-002]]), datos en español persistidos en `position` ([[TD-003]]) y un frontend que aún habla español en el contrato ([[TD-004]]). El español debe vivir en una **capa de presentación** (labels/i18n) del front, no en el API.
- **Hecho cuando:** El contrato HTTP de Employee (y cualquier otro residuo) está en inglés con DTOs *passthrough* (sin los mapas `TURNO_TO_SHIFT`/`toSpanishShape`), los valores de `position`/turno migrados o traducidos, y la web traduce a español solo en la vista. Quedan cerradas TD-002, TD-003 y TD-004.
- **Nota:** TD-003 implica migrar datos existentes de `position`; planificar como migración coordinada (front + `CARGO_TO_ROLE`). Mantiene BD 100% normalizada.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

---

## Dependencias

Milestones M1–M6 ya resueltos (ver `changelog.md`). Pendientes independientes: **RM-024** (M5), **RM-031** (M6), **RM-034 / RM-035** (M7). Cualquiera es punto de corte válido.

**Recomendaciones del profesor:** **RM-037/RM-040** comparten módulo de agregación (reportería). **RM-041 → RM-042** (el historial reusa el generador de comprobante). **RM-044** cierra TD-002/003/004 y conviene antes de mostrar más textos al usuario. **RM-038/RM-039/RM-043** (UX/UI) son independientes; RM-043 engloba a [[RM-036]].
