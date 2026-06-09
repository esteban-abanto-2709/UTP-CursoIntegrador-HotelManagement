# Checklist de Entrega — Tercera Nota (Exposición Semana 12)

> Tareas a completar **después** de terminar los cambios de código del proyecto.
> Es principalmente documentación, diagramas y el reporte de rendimiento.

**Exposiciones inician:** 09/06/2026 · Exponen Grupo 4, Grupo 5 y Grupo 6.

---

## Informe

- [ ] Informe escrito cubriendo **todos los capítulos**.

## Presentación

- [ ] **Marco Teórico:**
  - [ ] Herramientas para la gestión de la configuración.
  - [ ] Herramienta de evaluación de rendimiento.
- [x] **Diagrama de Casos de Uso** (completo).
- [x] **Diagrama de Clases** (completo).
- [x] **Diagramas de Secuencia** (nuevos).
- [x] **Diagrama de Componentes.**
- [x] **Modelo de datos** (corregido).
- [ ] **Reporte de Rendimiento** usando un software (JMeter u otro).
- [ ] **Conclusiones** tomando como input los resultados de la encuesta elaborada.
- [ ] **Ejecución del sistema** cubriendo los nuevos requerimientos.

---

## Pruebas de rendimiento (detalle)

Para el reporte de rendimiento, probar los **dos endpoints más solicitados** del sistema
(uno `GET` y uno `POST`) con **Apache JMeter**:

- [x] Identificar el endpoint `GET` más solicitado y el `POST` más solicitado.

### Endpoints elegidos

| Método | Endpoint | Servicio |
|--------|----------|----------|
| `GET`  | `/reservations` | `ReservationsService.findAll` |
| `POST` | `/reservations` | `ReservationsService.create` |

**`GET /reservations` — ¿por qué?**
Es la **lectura más frecuente** del sistema: la lista de reservas es la pantalla
operativa que el front desk mantiene abierta durante toda la jornada y se recarga
ante cada filtro (estado, fechas, huésped). Internamente arma un `where` dinámico
y resuelve varios *joins* (`reservationInclude`: habitación, estado, huésped),
por lo que su costo crece con el volumen de reservas. Es el mejor candidato para
medir rendimiento de **lectura bajo concurrencia**.

**`POST /reservations` — ¿por qué?**
Es la **transacción central del negocio** (crear una reserva) y la escritura más
pesada del backend. Una sola petición encadena 5+ operaciones de BD: busca la
habitación, ejecuta el chequeo de solapamiento de fechas (*range query*), hace
`upsert` del huésped por DNI, crea la reserva con sus *joins* y registra la
auditoría. Mide el camino crítico de **escritura/validación bajo carga** y es
donde antes aparecerían cuellos de botella o condiciones de carrera.

> **Info (no es lo que pediste, solo dato):** si más adelante quisieras que yo
> configure las pruebas directamente sin GUI, **k6** o **Artillery** son script-based
> (se versionan en el repo y corren por CLI), y podría dejarlos listos sin tu
> intervención. Para esta entrega seguimos con **JMeter** como indica el checklist.

- [ ] Crear un Test Plan en JMeter con un Thread Group por cada escenario de carga.
- [ ] Ejecutar cada endpoint con **250**, **500** y **1000** peticiones (número de hilos/loops).
- [ ] Para el `POST`: configurar el HTTP Header Manager con `Authorization: Bearer <token>` y el body JSON.
- [ ] Agregar listeners (Summary Report / Aggregate Report) y registrar los resultados
      (throughput, tiempo medio, percentiles 90/95/99, % de error).
- [ ] Exportar/captura de los reportes para incluirlos en la presentación.
