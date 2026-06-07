# Wishlist — Cambios deseables

Lista de mejoras, ajustes y detalles que quiero corregir o agregar en el futuro.
No son bugs ni deuda técnica (eso va en `technical-debt.md`): son cosas que *me gustaría*
que el sistema tuviera o hiciera mejor.

**Formato de cada entrada:**
- **Área:** Frontend / Backend / UX / BD / DevOps / Otro.
- **Prioridad:** Alta / Media / Baja.
- **Deseo:** qué quiero que cambie o se agregue.
- **Motivo:** por qué lo quiero (problema que veo o valor que aporta).
- **Fecha** y **Estado** (Pendiente / En progreso / Hecho / Descartado).

---

## [W-001] Descuentos acumulables en el check-out
- **Área:** Backend + Frontend + BD
- **Prioridad:** Media
- **Deseo:** Poder aplicar varios descuentos a la vez en el check-out de forma acumulativa, no solo uno.
- **Motivo:** Hoy `Payment` guarda un único `discountId` y el diálogo solo permite elegir un descuento. Limita combinar promociones. Implica pasar de relación 1-a-1 a varios descuentos por pago.
- **Fecha:** 2026-06-07 · **Estado:** Pendiente

## [W-002] Tabla de huéspedes hospedados actualmente
- **Área:** Frontend / UX
- **Prioridad:** Media
- **Deseo:** En `/dashboard/huespedes`, agregar una tabla superior con los huéspedes que están hospedados ahora mismo (reservas en estado ACTIVE), manteniendo debajo el historial completo actual.
- **Motivo:** Ver de un vistazo quién está en el hotel en este momento, sin filtrar manualmente el historial.
- **Fecha:** 2026-06-07 · **Estado:** Pendiente

## [W-003] Ordenamiento de tablas por cabecera
- **Área:** Frontend / UX
- **Prioridad:** Media
- **Deseo:** Que las tablas del frontend se puedan ordenar al hacer clic en la cabecera de una columna (ascendente/descendente).
- **Motivo:** Facilita encontrar y organizar registros. Aplica de forma transversal a todas las tablas (reservas, habitaciones, staff, huéspedes).
- **Fecha:** 2026-06-07 · **Estado:** Pendiente

## [W-004] Flujo de limpieza con empleado asignado
- **Área:** Backend + Frontend + BD
- **Prioridad:** Baja (futuro)
- **Deseo:** Tras el check-out, cuando el cuarto pasa a limpieza, que un empleado "tome" ese trabajo de housekeeping (quede asignado a él y controlado), y que ese mismo empleado libere el cuarto (pase a AVAILABLE) cuando termine.
- **Motivo:** Dar trazabilidad al trabajo de limpieza: saber qué empleado está limpiando cada cuarto y cuándo lo libera. Hoy el cuarto pasa a CLEANING pero sin responsable asignado.
- **Fecha:** 2026-06-07 · **Estado:** Pendiente
