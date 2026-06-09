# Pruebas de rendimiento — k6

Mide los dos endpoints más solicitados del PMS:

- `GET /reservations` — lectura operativa principal (lista con filtros + joins).
- `POST /reservations` — transacción central (crea reserva: valida solapamiento,
  upsert de huésped, escritura con joins y auditoría).

Cada endpoint se prueba con **250, 500 y 1000 peticiones** (= nº de hilos virtuales,
1 loop por hilo → equivalente a un Thread Group de JMeter).

## Requisitos

1. **El stack Docker arriba** (Postgres local + API) y la BD **sembrada**:
   ```powershell
   cd apps/docker
   docker compose up --build
   # en otra terminal, desde apps/api:
   pnpm seed
   pnpm seed:placeholder
   ```
2. **k6 instalado**:
   ```powershell
   winget install k6 --source winget   # o: choco install k6
   k6 version
   ```

## Correr todo (recomendado)

Desde `apps/api/perf`:

```powershell
pwsh ./run-all.ps1
```

Corre los 6 escenarios, guarda un JSON por escenario en `results/` y genera la
tabla consolidada en **`results/summary.md`** (lista para pegar en la presentación).

## Correr un escenario suelto

```powershell
k6 run -e ENDPOINT=get  -e REQUESTS=500  reservations.js
k6 run -e ENDPOINT=post -e REQUESTS=1000 reservations.js
```

Variables disponibles: `ENDPOINT` (`get`|`post`), `REQUESTS`, `BASE_URL`,
`PERF_USERNAME`, `PERF_PASSWORD` (por defecto `admin`/`admin`).

> Nota: las credenciales usan el prefijo `PERF_` a propósito. En Windows
> `USERNAME` ya es una variable de entorno del sistema (tu usuario), así que
> usarla pisaría el valor por defecto y el login fallaría con 401.

## Métricas reportadas

| Métrica | Significado |
|---------|-------------|
| Throughput (req/s) | Peticiones procesadas por segundo |
| Media / Mediana | Tiempo de respuesta promedio y central |
| p90 / p95 / p99 | Percentiles de latencia (el 90/95/99 % responde en ≤ X ms) |
| Max | Peor tiempo de respuesta |
| Error % | Peticiones con respuesta ≥ 400 |

## Notas

- El POST genera **datos únicos por petición** (fecha distinta por iteración,
  DNI distinto) para evitar `409 Conflict` por solapamiento de fechas y medir el
  camino exitoso de escritura.
- `results/` contiene salidas de cada corrida; puedes regenerarlas cuando quieras.
