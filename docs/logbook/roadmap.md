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

## Recomendaciones del profesor / curso (revisión de cierre)

> Lote levantado de la retroalimentación del profesor y del curso (2026-06-19). Todas comprometidas. Agrupadas por tema; los códigos no implican orden de ejecución.

### UX / UI

## [RM-039] Cambiar el ícono "de personitas" del root (favicon / identidad)

- **Objetivo:** Reemplazar el ícono genérico de la pestaña/raíz por uno acorde a la identidad "Mirador · Hotel Suite".
- **Contexto:** El favicon vive en `apps/web/public/favicon.ico` y no está declarado en `metadata.icons` de `apps/web/src/app/layout.tsx` (Next lo toma por convención). El sidebar ya tiene una marca propia (logo SVG + "Mirador / Hotel Suite" en `app-sidebar.tsx`); el favicon quedó desalineado con esa identidad. *(Nota: el ícono `Users` de lucide en el sidebar es el del item «Personal»; si la observación apuntaba a ese, ajustar el icono de ese nav-item; confirmar cuál es "las personitas en el root" antes de tocar.)*
- **Hecho cuando:** El ícono del root/pestaña refleja la marca del PMS y reemplaza al placeholder actual.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

### Estandarización de idioma

## [RM-044] Estandarizar idioma: BD/API en inglés, UI en español *(cierra [[TD-002]] [[TD-003]] [[TD-004]])*

- **Objetivo:** Dejar la estructura (BD + API: nombres de campos, valores, contrato HTTP) **en inglés por defecto** y reservar el español únicamente para lo que ve el usuario en la web.
- **Contexto:** La BD/Prisma ya está en inglés, pero el contrato HTTP de `Employee` sigue en español (`nombres`, `apellidoPaterno`, `cargo`, `turno` con valores `MAÑANA/TARDE/NOCHE`), sostenido por una capa de mapeo temporal en el service ([[TD-002]]), datos en español persistidos en `position` ([[TD-003]]) y un frontend que aún habla español en el contrato ([[TD-004]]). El español debe vivir en una **capa de presentación** (labels/i18n) del front, no en el API.
- **Hecho cuando:** El contrato HTTP de Employee (y cualquier otro residuo) está en inglés con DTOs *passthrough* (sin los mapas `TURNO_TO_SHIFT`/`toSpanishShape`), los valores de `position`/turno migrados o traducidos, y la web traduce a español solo en la vista. Quedan cerradas TD-002, TD-003 y TD-004.
- **Nota:** TD-003 implica migrar datos existentes de `position`; planificar como migración coordinada (front + `CARGO_TO_ROLE`). Mantiene BD 100% normalizada.
- **Fecha:** 2026-06-19 · **Estado:** Abierto

---

## Infraestructura / Deploy

## [RM-049] Dockerizar `apps/web` para el deploy en Digital Ocean

- **Objetivo:** Que el frontend también corra en contenedor, junto al API y la BD, para desplegar todo el stack en Digital Ocean sin depender de Vercel.
- **Contexto:** Solo `apps/api` está dockerizado (`apps/api/Dockerfile`, servicio `api` en `apps/docker/docker-compose.yml`); `apps/web` no tiene `Dockerfile` ni servicio en el compose y hoy se publica en Vercel. Next.js 16 admite build standalone (`output: "standalone"`) para imágenes ligeras. `NEXT_PUBLIC_API_URL` se hornea en build time, así que el contenedor web necesita apuntar al API por la URL pública/ruteable del deploy, no a `localhost`.
- **Hecho cuando:** Existe `apps/web/Dockerfile` (multi-stage, build standalone) + `.dockerignore`, un servicio `web` en `docker-compose.yml` (con `NEXT_PUBLIC_API_URL`, `depends_on` del API y puerto expuesto), y `docker compose up --build` levanta los tres servicios (db + api + web) sirviendo la app end-to-end. El build del contenedor lo corre el usuario.
- **Nota:** Mantener pnpm 10.x en `apps/web` (Vercel) salvo que se confirme abandonar Vercel; verificar el enfoque del Dockerfile de Next 16 con context7 antes de implementar. El levantado/deploy en Digital Ocean lo hace el usuario; Claude solo prueba el build.
- **Fecha:** 2026-06-23 · **Estado:** Abierto

---

## Dependencias

Milestones M1–M7 ya resueltos (ver `changelog.md`). Pendientes independientes: **RM-024** (M5), **RM-031** (M6). Cualquiera es punto de corte válido.

**Recomendaciones del profesor:** **RM-037/RM-040** comparten módulo de agregación (reportería). **RM-041 → RM-042** (el historial reusa el generador de comprobante). **RM-044** cierra TD-002/003/004 y conviene antes de mostrar más textos al usuario. **RM-038/RM-039** (UX/UI) son independientes. El rediseño general (ex-RM-043) y su sub-pendiente RM-036 ya se cerraron.
