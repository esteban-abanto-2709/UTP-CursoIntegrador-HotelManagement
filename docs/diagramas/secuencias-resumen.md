# Diagramas de Secuencia (vista resumida) — Lumina Resort PMS

## Descripción

Esta es la **vista resumida** de los diagramas de secuencia. Modela cada escenario con tres
participantes de alto nivel —**Frontend**, **Backend** y **PostgreSQL**— más el actor, sin
desglosar las capas internas del backend (guards, controlador, servicio, ORM). Su objetivo
es comunicar el flujo de negocio de un vistazo.

La contraparte con el detalle técnico completo (guards, `Controller` → `Service` →
`PrismaService`) está en [`secuencias-detallado.md`](./secuencias-detallado.md).

Convención: flecha continua (`->>`) = invocación · flecha punteada (`-->>`) = retorno ·
`alt`/`else` = caminos excluyentes (error u éxito).

---

## Secuencia 1 · Crear habitación

Realiza el caso de uso **CU-11**. Un Manager u Owner registra una nueva habitación; el
sistema valida que el número no exista y la crea en estado `AVAILABLE`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Manager / Owner
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    U->>FE: Completa formulario (número, tipo, precio)
    FE->>BE: POST /rooms + Bearer JWT
    BE->>DB: Verifica que el número no exista
    DB-->>BE: habitación existente | null

    alt El número ya existe
        BE-->>FE: 409 Conflict
        FE-->>U: "La habitación ya existe"
    else Número disponible
        BE->>DB: Registra la habitación (AVAILABLE) y la auditoría
        DB-->>BE: habitación creada
        BE-->>FE: 201 Created
        FE-->>U: "Habitación creada" + refresca el tablero
    end
```

### Notas

- La validación de token y rol (`OWNER`/`MANAGER`) ocurre en el backend antes de procesar la
  petición; en esta vista se omite por simplicidad y se detalla en la versión completa.
- La creación de la habitación y su registro de auditoría se resumen en un solo paso de
  escritura.

---

## Secuencia 2 · Iniciar sesión

Realiza el caso de uso **CU-01**. El usuario se autentica y el sistema emite un token JWT.

```mermaid
sequenceDiagram
    autonumber
    actor U as Personal del hotel
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    U->>FE: Ingresa usuario y contraseña
    FE->>BE: POST /auth/login
    BE->>DB: Busca empleado por username
    DB-->>BE: empleado | null

    alt Credenciales inválidas
        BE-->>FE: 401 Credenciales inválidas
        FE-->>U: Muestra el error
    else Credenciales válidas
        BE->>BE: Verifica contraseña (bcrypt) y genera JWT
        BE-->>FE: 200 { access_token, user }
        FE-->>U: Guarda el token y redirige al dashboard
    end
```

### Notas

- La contraseña nunca viaja de vuelta: el backend la verifica con bcrypt y solo devuelve el
  token y los datos básicos del usuario.

---

## Secuencia 3 · Crear reserva

Realiza los casos de uso **CU-02** y **CU-03**. El flujo "fecha + tipo primero": el actor
consulta la disponibilidad y luego crea la reserva sobre una habitación libre.

```mermaid
sequenceDiagram
    autonumber
    actor U as Empleado
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    U->>FE: Selecciona check-in, check-out y tipo
    FE->>BE: GET /rooms/availability
    BE->>DB: Busca habitaciones del tipo sin reservas solapadas
    DB-->>BE: habitaciones libres
    BE-->>FE: 200 lista de habitaciones
    FE-->>U: Muestra las habitaciones disponibles

    U->>FE: Elige habitación e ingresa datos del huésped
    FE->>BE: POST /reservations + Bearer JWT
    BE->>DB: Valida no solapamiento y hace upsert del huésped (por DNI)
    DB-->>BE: resultado

    alt La habitación ya está reservada en esas fechas
        BE-->>FE: 409 Conflict
        FE-->>U: "La habitación ya está reservada"
    else Disponible
        BE->>DB: Crea la reserva (PENDING, rateSnapshot) y la auditoría
        DB-->>BE: reserva creada
        BE-->>FE: 201 Created
        FE-->>U: "Reserva creada"
    end
```

### Notas

- La disponibilidad se calcula por **solapamiento de fechas** sobre reservas
  `PENDING`/`ACTIVE`, no por el estado físico del cuarto.
- El precio se congela en `rateSnapshot` al momento de crear la reserva.

---

## Secuencia 4 · Realizar check-in

Realiza el caso de uso **CU-06**. Registra la llegada del huésped y ocupa la habitación.

```mermaid
sequenceDiagram
    autonumber
    actor U as Empleado
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    U->>FE: Confirma la llegada del huésped
    FE->>BE: PATCH /reservations/:id/checkin + Bearer JWT
    BE->>DB: Carga la reserva y el estado de la habitación
    DB-->>BE: datos

    alt Reserva no PENDING o habitación no disponible
        BE-->>FE: 400 Bad Request
        FE-->>U: Muestra el motivo
    else Válido
        BE->>DB: Reserva → ACTIVE (actualCheckIn) y habitación → OCCUPIED (transacción) + auditoría
        DB-->>BE: ok
        BE-->>FE: 200 Check-in realizado
        FE-->>U: Actualiza el tablero
    end
```

### Notas

- El cambio de estado de la reserva y de la habitación se ejecuta en una **transacción**:
  ambos cambios ocurren juntos o no ocurre ninguno.

---

## Secuencia 5 · Realizar check-out y cobro

Realiza el caso de uso **CU-07**. Cierra la estancia, calcula el total y registra el pago.

```mermaid
sequenceDiagram
    autonumber
    actor U as Empleado
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    U->>FE: Inicia el check-out (método de pago, descuento opcional)
    FE->>BE: PATCH /reservations/:id/checkout + Bearer JWT
    BE->>DB: Carga la reserva, valida descuento y método de pago, suma los cargos
    DB-->>BE: datos

    alt Reserva no ACTIVE, descuento inactivo o método inválido
        BE-->>FE: 400 / 404
        FE-->>U: Muestra el error
    else Válido
        BE->>BE: Calcula totales (noches × tarifa + cargos − descuento)
        BE->>DB: Reserva → COMPLETED, crea el Payment, habitación → CLEANING (transacción) + auditoría
        DB-->>BE: ok
        BE-->>FE: 200 { reserva, pago }
        FE-->>U: Muestra el comprobante de pago
    end
```

### Notas

- El total se compone de `roomTotal` (noches × tarifa) + `chargesTotal` (cargos) −
  `discountAmount`; todos los importes quedan congelados en el `Payment`.
- Tras el cobro la habitación pasa a `CLEANING`, alimentando la vista de housekeeping.

---

## Secuencia 6 · Registrar cargo a la reserva

Realiza el caso de uso **CU-08**. Agrega un consumo o servicio a una reserva en curso.

```mermaid
sequenceDiagram
    autonumber
    actor U as Empleado
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    U->>FE: Agrega un consumo (categoría, descripción, importe)
    FE->>BE: POST /reservations/:id/charges + Bearer JWT
    BE->>DB: Verifica que la reserva esté ACTIVE y que la categoría exista
    DB-->>BE: datos

    alt Reserva no ACTIVE o categoría inexistente
        BE-->>FE: 400 / 404
        FE-->>U: Muestra el error
    else Válido
        BE->>DB: Crea el cargo (RoomCharge)
        DB-->>BE: cargo creado
        BE-->>FE: 201 Created
        FE-->>U: "Cargo agregado"
    end
```

### Notas

- Solo se permiten cargos sobre reservas `ACTIVE` (huésped con check-in hecho y sin
  check-out). El cargo se sumará al `chargesTotal` durante el check-out (Secuencia 5).
