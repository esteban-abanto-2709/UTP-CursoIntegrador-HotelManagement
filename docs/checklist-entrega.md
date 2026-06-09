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
- [x] **Reporte de Rendimiento** usando un software (k6) → `docs/reporte-rendimiento.md`.
- [ ] **Conclusiones** tomando como input los resultados de la encuesta elaborada.
- [ ] **Ejecución del sistema** cubriendo los nuevos requerimientos.

---

## Pruebas de rendimiento (detalle)

Para el reporte de rendimiento, probar los **dos endpoints más solicitados** del sistema
(uno `GET` y uno `POST`) con **k6** (herramienta script-based, ver `apps/api/perf/`):

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

### Ejecución con k6

El harness está en `apps/api/perf/` (script `reservations.js` + runner `run-all.ps1`).
Cada escenario usa `vus = N` con 1 loop → **N hilos × 1 loop = N peticiones** (análogo a un
Thread Group de JMeter).

- [x] Script de carga con un escenario por cada nivel (250 / 500 / 1000).
- [x] Login automático en `setup()` → token `Bearer` inyectado en todas las peticiones.
- [x] `POST` con body JSON y **datos únicos por petición** (evita `409` por solapamiento).
- [x] Reporte con throughput, media, percentiles p90/p95/p99 y % de error.
- [x] Ejecutar `run-all.ps1` con el stack local arriba y BD sembrada.
- [x] Resultados consolidados en `results/summary.md` y analizados en `docs/reporte-rendimiento.md`.
- [ ] Exportar/captura de los reportes para incluirlos en la presentación.
