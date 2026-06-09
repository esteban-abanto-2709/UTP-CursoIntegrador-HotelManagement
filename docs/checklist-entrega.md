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

- [ ] Identificar el endpoint `GET` más solicitado y el `POST` más solicitado.
- [ ] Crear un Test Plan en JMeter con un Thread Group por cada escenario de carga.
- [ ] Ejecutar cada endpoint con **250**, **500** y **1000** peticiones (número de hilos/loops).
- [ ] Para el `POST`: configurar el HTTP Header Manager con `Authorization: Bearer <token>` y el body JSON.
- [ ] Agregar listeners (Summary Report / Aggregate Report) y registrar los resultados
      (throughput, tiempo medio, percentiles 90/95/99, % de error).
- [ ] Exportar/captura de los reportes para incluirlos en la presentación.
