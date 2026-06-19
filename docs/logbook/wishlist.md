# Wishlist

Ideas y mejoras posibles, sin compromiso (quizá nunca). Código `WL-###` (nunca se reutiliza).
Si una idea se promueve, se borra de aquí y nace un `RM` nuevo.

**Formato:** título + idea en 1–2 líneas, sin campos.

---

## [WL-001] Descuentos acumulables en el check-out
Aplicar varios descuentos a la vez en el check-out, de forma acumulativa. Hoy `Payment` guarda un único `discountId` y el diálogo solo permite elegir uno (pasar de 1-a-1 a varios por pago).

## [WL-002] Tabla de huéspedes hospedados actualmente
En `/dashboard/huespedes`, una tabla superior con los huéspedes hospedados ahora mismo (reservas `ACTIVE`), manteniendo debajo el historial completo, para ver de un vistazo quién está en el hotel.

## [WL-003] Ordenamiento de tablas por cabecera
Que las tablas del frontend (reservas, habitaciones, staff, huéspedes) se ordenen al hacer clic en la cabecera de una columna (asc/desc).

## [WL-004] Flujo de limpieza con empleado asignado
Tras el check-out, que un empleado "tome" el trabajo de housekeeping del cuarto (quede asignado a él) y sea ese mismo quien lo libere a `AVAILABLE`, dando trazabilidad a la limpieza.
