# Wishlist

Ideas y mejoras posibles, sin compromiso (quizá nunca). Código `WL-###` (nunca se reutiliza).
Si una idea se promueve, se borra de aquí y nace un `RM` nuevo.

**Formato:** título + idea en 1–2 líneas, sin campos.

---

## [WL-002] Tabla de huéspedes hospedados actualmente
En `/dashboard/huespedes`, una tabla superior con los huéspedes hospedados ahora mismo (reservas `ACTIVE`), manteniendo debajo el historial completo, para ver de un vistazo quién está en el hotel.

## [WL-003] Ordenamiento de tablas por cabecera
Que las tablas del frontend (reservas, habitaciones, staff, huéspedes) se ordenen al hacer clic en la cabecera de una columna (asc/desc).

## [WL-004] Flujo de limpieza con empleado asignado
Tras el check-out, que un empleado "tome" el trabajo de housekeeping del cuarto (quede asignado a él) y sea ese mismo quien lo libere a `AVAILABLE`, dando trazabilidad a la limpieza.

## [WL-005] Utilidad neta real en la reportería (no solo ingreso bruto)
La reportería hoy muestra solo ingreso bruto (de `Payment`). Para utilidad neta hay que modelar primero una fuente de egresos (planilla con sueldos y/o costos operativos fijos), conectarla a la agregación y reetiquetar la página. Es una feature, no un fix (la BD no tiene egresos). *(Antes registrado como deuda TD-019; reclasificado a deseo por estar bloqueado en una feature.)*

## [WL-006] Comprobante/voucher con fidelidad visual (Puppeteer HTML→PDF)
El comprobante actual se arma con pdfkit (JS puro, feo pero seguro en Docker). Si algún día se resuelve Chromium en Alpine sin riesgo (o se cambia la base a un slim con glibc), migrar a Puppeteer permitiría renderizar una plantilla HTML/CSS y recuperar la boleta pulida que tenía el front. Se descartó en [[RM-052]] por el riesgo de Chromium ante deadline.
