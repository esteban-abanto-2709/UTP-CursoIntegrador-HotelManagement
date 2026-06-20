# Reporte de Rendimiento — Mirador Hotel Suite

Evaluación de rendimiento de los dos endpoints más solicitados del sistema,
realizada con la herramienta **k6**.

---

## 1. Marco teórico

### 1.1 ¿Qué es k6?

**k6** es una herramienta de código abierto para **pruebas de carga y rendimiento**
desarrollada por Grafana Labs. Permite simular muchos usuarios accediendo a la vez
a un sistema y medir cómo responde bajo presión.

Sus características principales:

- **Las pruebas se escriben como código** (scripts en JavaScript). Esto las hace
  legibles, parametrizables y versionables junto al proyecto (viven en el repositorio,
  en `apps/api/perf/`).
- **Se ejecuta desde la línea de comandos** (CLI), sin interfaz gráfica pesada, lo que
  la hace ligera y fácil de automatizar.
- **Trabaja con usuarios virtuales (VUs, *Virtual Users*)**: cada VU es un hilo
  independiente que ejecuta el script y lanza peticiones, simulando a un usuario real.
- **Entrega métricas precisas**: throughput, tiempos de respuesta, percentiles y
  porcentaje de error, que es justamente lo que se necesita para un reporte de rendimiento.

### 1.2 ¿Por qué usamos k6?

El sistema es un monorepo (NestJS + Next.js) versionado en Git, y se buscó una
herramienta de evaluación de rendimiento coherente con ese flujo de trabajo:

| Criterio | Aporte de k6 |
|----------|--------------|
| **Reproducibilidad** | La prueba es un script: cualquiera la corre con un comando y obtiene el mismo escenario. |
| **Versionado** | El script queda en el repositorio, junto al código que mide. |
| **Precisión** | Calcula percentiles (p90/p95/p99), no solo promedios, que ocultan los picos. |
| **Ligereza** | Corre desde CLI; no requiere instalar ni configurar una GUI. |
| **Mismo objetivo que JMeter** | Cumple la misma función que Apache JMeter (la herramienta clásica del rubro), pero como código en lugar de interfaz gráfica. |

### 1.3 ¿Qué buscamos medir?

El objetivo es entender **cómo se comporta el backend cuando varios usuarios lo usan
al mismo tiempo**, sometiéndolo a una carga creciente (250 → 500 → 1000 usuarios
virtuales simultáneos) sobre los dos endpoints más solicitados:

- `GET /reservations` — la **lectura** más frecuente (listado operativo de reservas).
- `POST /reservations` — la **escritura** central del negocio (crear una reserva).

Para cada nivel de carga se registran las siguientes métricas:

| Métrica | Qué significa |
|---------|---------------|
| **Throughput** (req/s) | Peticiones procesadas por segundo. Mide la capacidad de proceso. |
| **Media** (ms) | Tiempo de respuesta promedio. |
| **p90 / p95 / p99** (ms) | Percentiles: el 90 / 95 / 99 % de las peticiones respondió en ese tiempo o menos. Reflejan la experiencia del *peor caso* habitual, no el promedio. |
| **Máx** (ms) | Peor tiempo de respuesta registrado. |
| **Error %** | Porcentaje de peticiones que no se completaron con éxito (respuesta ≥ 400 o conexión rechazada). |

### 1.4 Metodología y entorno

- **Entorno 100 % local**, levantado con Docker Compose para que la medición refleje
  el rendimiento del sistema y **no la latencia de red** hacia un servicio en la nube:
  - API: **NestJS 11** (puerto 4000).
  - Base de datos: **PostgreSQL 16**, en el mismo *network* de Docker que la API.
  - Acceso a datos: **Prisma** con adaptador `pg` (pool de conexiones).
- **Modelo de carga**: cada escenario usa `N` usuarios virtuales con 1 iteración cada
  uno → **N hilos × 1 loop = N peticiones**, equivalente a un *Thread Group* de JMeter.
- **Autenticación**: el script inicia sesión una sola vez (`setup()`), obtiene un token
  JWT y lo envía como `Authorization: Bearer <token>` en todas las peticiones.
- **Datos del POST**: cada petición genera datos únicos (DNI y fechas distintas) para
  crear reservas reales y medir el camino exitoso de escritura, evitando rechazos por
  solapamiento de fechas (409 Conflict).

> **Cómo leer las tablas.** A partir de cierta concurrencia el servidor local llega a
> su **punto de saturación**: su cola de conexiones se llena y empieza a rechazar
> peticiones de inmediato (esto se refleja en el `Error %`). Como esas peticiones
> rechazadas fallan al instante, *bajan* artificialmente la media; por eso conviene
> mirar el **Error %** junto con los percentiles, no la media de forma aislada.

---

## 2. Resultados

### 2.1 `GET /reservations` — Lectura del listado de reservas

**Qué solicitamos.** Una petición `GET` al listado completo de reservas. Es la pantalla
operativa que el personal de recepción mantiene abierta durante la jornada, por lo que
es la lectura más solicitada del sistema.

**Detalles técnicos considerados.**

- Requiere autenticación: se envía el token JWT en cada petición.
- En el backend, la consulta resuelve varios *joins* por cada reserva (habitación,
  estado y huésped) y ordena los resultados por fecha de entrada.
- No hay paginación: devuelve el conjunto completo, por lo que su costo crece con el
  volumen de reservas almacenadas.
- Mide el comportamiento de **lectura concurrente**: muchos usuarios consultando la
  misma información a la vez.

| Peticiones | Throughput (req/s) | Media (ms) | p90 (ms) | p95 (ms) | p99 (ms) | Máx (ms) | Error % |
|-----------:|-------------------:|-----------:|---------:|---------:|---------:|---------:|--------:|
| 250  | 307.53  | 363.71 | 642.12 | 671.41 | 739.90 | 740.64 | 9.92 |
| 500  | 938.57  | 111.19 | 376.80 | 426.92 | 467.80 | 473.75 | 55.78 |
| 1000 | 1512.23 | 88.88  | 395.92 | 489.06 | 563.55 | 579.49 | 71.36 |

**Lectura.** Con **250** usuarios concurrentes el endpoint responde de forma estable:
~308 req/s y un error de ~10 %, con el 95 % de las peticiones por debajo de ~671 ms.
Al subir a **500** y **1000**, el error escala a 56 % y 71 %: el servidor está por
encima de su capacidad y rechaza conexiones. La latencia de las peticiones que *sí*
prosperan se mantiene en cientos de milisegundos (p95 ≈ 427–489 ms).

### 2.2 `POST /reservations` — Creación de una reserva

**Qué solicitamos.** Una petición `POST` que crea una reserva nueva, enviando los datos
del huésped, la habitación y las fechas de entrada/salida. Es la transacción central del
negocio y la escritura más solicitada.

**Detalles técnicos considerados.**

- Requiere autenticación (token JWT) y un cuerpo JSON con los datos de la reserva.
- Es la operación **más pesada** del backend: una sola petición encadena varias
  operaciones de base de datos — valida que la fecha de salida sea posterior a la de
  entrada, comprueba que la habitación exista, ejecuta un control de **solapamiento de
  fechas**, hace *upsert* del huésped por DNI, crea la reserva con sus relaciones y
  registra la acción en la auditoría.
- Para medir el camino exitoso (y no rechazos por reserva duplicada), cada petición usa
  **fechas y DNI únicos**.
- Mide el comportamiento de **escritura concurrente** bajo carga.

| Peticiones | Throughput (req/s) | Media (ms) | p90 (ms) | p95 (ms) | p99 (ms) | Máx (ms) | Error % |
|-----------:|-------------------:|-----------:|---------:|---------:|---------:|---------:|--------:|
| 250  | 232.11  | 676.00 | 1019.55 | 1023.66 | 1024.96 | 1025.23 | 12.30 |
| 500  | 1532.14 | 74.92  | 212.05  | 230.74  | 249.04  | 253.54  | 99.60 |
| 1000 | 743.03  | 299.72 | 1224.92 | 1246.07 | 1252.53 | 1255.15 | 67.66 |

**Lectura.** Con **250** usuarios concurrentes la escritura funciona con un error de
~12 %, aunque a mayor costo que la lectura: al ser una operación de varios pasos contra
la base de datos, el p95 ronda ~1 s. A **500** y **1000**, el sistema satura
fuertemente (error 99.6 % y 67.7 %): el pool de conexiones a la base de datos y la cola
de aceptación del servidor no dan abasto ante la concurrencia instantánea, y la mayoría
de las peticiones se rechazan.

---

## 3. Conclusiones

- **Punto de operación estable:** alrededor de **250 usuarios concurrentes**, ambos
  endpoints responden con tasas de error de un solo dígito a ~12 %. La **lectura**
  (`GET`) es más barata y sostiene mejor la carga que la **escritura** (`POST`), como
  era de esperar por la diferencia de trabajo que implica cada una.
- **Punto de saturación:** a partir de **500 usuarios simultáneos** el entorno local
  llega a su límite y empieza a rechazar conexiones, con el error subiendo de forma
  marcada. Este es el hallazgo central de la prueba: identifica hasta dónde escala el
  sistema en su configuración local actual.
- **El cuello de botella** está en la capa de datos y de conexiones: un único proceso
  Node con un pool de conexiones acotado hacia PostgreSQL. La escritura, al ser
  multi-paso, satura antes que la lectura.

> **Contexto de la medición.** La prueba aplica la carga de forma **instantánea** (todos
> los usuarios virtuales arrancan a la vez), lo que representa un escenario de *ráfaga*
> exigente, y corre sobre una configuración de desarrollo en una sola máquina (sin
> tuning de producción ni réplicas). Los números reflejan ese contexto, no una capacidad
> productiva tope. Una medición con rampa gradual de usuarios y/o un pool de conexiones
> mayor mostraría curvas más suaves y un punto de saturación más alto.

---

## 4. ¿Por qué estos números? Limitaciones del entorno

*(Notas de apoyo para explicar los resultados en la exposición.)*

El alto porcentaje de error no significa que el sistema esté "roto", sino que chocó
contra varios límites de **configuración** a la vez. En realidad hay **dos tipos de
error** mezclados en esa cifra:

- **Conexiones rechazadas** (la mayoría): cuando cientos de usuarios golpean *en el
  mismo instante*, el sistema operativo tiene una **cola de aceptación de conexiones
  TCP** (el *backlog*, ~128 por defecto). Las conexiones que no caben se rechazan al
  instante. Esto explica los tiempos de ~0 ms y la mediana en 0 en los niveles altos:
  son rechazos que ni llegaron a procesarse.
- **Timeouts por saturación interna**: las peticiones que sí entran terminan esperando
  recursos (conexiones a la base de datos) que no alcanzan.

Limitaciones concretas del entorno de prueba, de mayor a menor impacto:

| Limitación | Por qué impacta |
|------------|-----------------|
| **Un solo proceso Node.js** | La API corre en un proceso de un solo hilo. Todas las peticiones pasan por el mismo *event loop* y comparten **un núcleo de CPU**; no hay *clustering* ni varios *workers*. |
| **Pool de conexiones (~10)** | Prisma/`pg` abre por defecto ~10 conexiones a PostgreSQL. Con cientos de peticiones simultáneas, el resto hace **cola esperando una conexión libre** → latencia y timeouts. |
| **El `POST` es multi-paso** | Cada creación encadena varias consultas (valida, chequea solapamiento, *upsert* del huésped, crea, audita). Ocupa la conexión más tiempo y **satura antes que el `GET`**. |
| **Una sola máquina de desarrollo** | Sin caché, sin réplicas, sin *tuning*. Además la base de datos, la API y el propio k6 corrían en la misma máquina, compitiendo por CPU. |
| **Carga instantánea (sin rampa)** | Todos los usuarios arrancan de golpe: el peor escenario posible. En producción la carga sube de forma gradual. |

**Referencia de % de error aceptable.** En producción se apunta a **< 0.1 %** de error
(99.9 % de éxito, "tres nueves"). En una prueba de carga, el umbral de aceptación típico
es **< 1 %** al nivel objetivo; por encima de ~1-5 % se considera que ahí está el límite
de capacidad. Con esa vara, el punto de operación cómodo de este sistema, en su
configuración local actual, estaría por **debajo de 250 usuarios concurrentes**.

---

*Generado con k6. Scripts y resultados crudos en `apps/api/perf/` (ver `README.md`).*
