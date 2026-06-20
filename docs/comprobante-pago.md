# Comprobante de pago — cómo funciona (notas para el video)

Guía de apoyo para explicar en video el sistema de comprobante/boleta de pago
(RM-041). Pensada para leer antes de grabar.

## La idea central (el titular)

**No uso ninguna librería de PDF.** Genero el comprobante con el **motor de
impresión nativo del navegador**. La librería de Java que recomendó el profesor
(típicamente **JasperReports** o **iText**) genera el PDF *en el servidor*; yo lo
resuelvo *en el cliente* sin dependencias externas.

No es un atajo, es una decisión de arquitectura. El comprobante es una **vista
derivada sin valor legal** (lleva el disclaimer "no constituye comprobante de
pago electrónico para efectos tributarios — SUNAT"). No necesito archivarlo,
firmarlo ni que sea idéntico byte a byte: solo presentarlo e imprimirlo. Cuando
quitas el requisito de "documento oficial archivado", generar el PDF en el
backend solo agrega peso (en Java sería JasperReports; en Node sería
puppeteer/pdfkit) sin beneficio real.

## El paralelo con la librería de Java

Cualquier generador de reportes tiene **3 ingredientes**. Es el mismo concepto,
solo cambia *dónde* corre:

| Ingrediente | JasperReports (Java) | Mi sistema |
|---|---|---|
| **Plantilla / diseño** | archivo `.jrxml` | HTML + CSS escrito a mano |
| **Datos** | datasource / query | endpoints REST de mi API (NestJS) |
| **Motor que produce el PDF** | librería en el servidor | motor de impresión del navegador (`window.print()`) |

## Qué librerías uso realmente

- **Para el PDF en sí: ninguna.** Cero dependencias. Lo hace el navegador.
- **Stack de apoyo (ya existente en el proyecto):**
  - **Next.js / React** — el frontend donde vive el botón.
  - **Axios** — para pedir los datos a la API.
  - **NestJS + Prisma** (backend) — sirven los datos; **no se tocó el backend**
    para esta función.
- **Código propio para el comprobante** (sin dependencias):
  - `apps/web/src/lib/numeroALetras.ts` — convierte el total a letras
    ("MIL CUATROCIENTOS VEINTE CON 65/100 SOLES"). *Dato para el video:
    JasperReports trae esto como función incorporada; aquí está implementado
    desde cero.*
  - `apps/web/src/lib/comprobante.ts` — datos de la empresa, el correlativo y el
    cálculo del IGV.
  - `apps/web/src/lib/printComprobante.ts` — arma la boleta e invoca la impresión.

## Cómo funciona, paso a paso (flujo a mostrar en pantalla)

1. En la lista de reservas, clic en el botón 🖨 de una reserva **finalizada**.
2. Se dispara `generarComprobante(id)`, que pide **3 endpoints en paralelo** con
   Axios:
   - la **reserva** (huésped, habitación, fechas, tarifa),
   - el **pago** (desglose ya calculado: subtotal, descuento, total, empleado),
   - los **consumos** (cargos por categoría).
3. Con esos datos se arma un **documento HTML autocontenido** (con su CSS
   adentro) — esa es la "plantilla".
4. Se inyecta ese HTML en un **iframe oculto** y se llama a
   `iframe.contentWindow.print()`.
5. El navegador abre su **diálogo nativo** → el usuario imprime o elige "Guardar
   como PDF".

### Dos decisiones técnicas que conviene resaltar

- **El total se respeta tal cual del backend.** No se recalcula nada en el front;
  el `Payment` ya guarda el desglose, así que el comprobante siempre cuadra con
  lo cobrado. El **IGV (18%) se deriva del total** solo para mostrarlo (es
  presentación, no cambia la base de datos).
- **El nombre del archivo** se controla con el `<title>` del documento, así el
  PDF se descarga como `Comprobante B001-0000247 - {cliente}` en vez del nombre
  genérico de la app.

## Frase de cierre

> "El profesor mostró el camino con una librería de Java; yo apliqué el mismo
> concepto —plantilla, datos y motor— pero adaptado a un stack web: la plantilla
> es HTML/CSS, los datos vienen de mi API REST, y el motor de PDF es el propio
> navegador, sin sumar dependencias."

## Limitaciones conocidas (registradas en el logbook)

- **TD-021** — los datos de la empresa son placeholder (RUC, dirección,
  correlativo sintético) y se omite la dirección del huésped porque el modelo
  `Guest` no tiene ese campo (se muestra "Contacto" en su lugar).
- **TD-022** — quedan textos "Lumina" (marca anterior) en los metadatos de la
  app; parte del rebrand a Mirador (RM-039 / RM-043).
