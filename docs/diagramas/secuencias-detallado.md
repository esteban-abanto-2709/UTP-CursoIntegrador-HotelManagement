# Diagramas de Secuencia (vista detallada) — Lumina Resort PMS

## Descripción

Esta es la **vista detallada** de los diagramas de secuencia. La contraparte resumida
(Frontend · Backend · PostgreSQL), pensada para comunicar el flujo de un vistazo, está en
[`secuencias-resumen.md`](./secuencias-resumen.md).

Los diagramas de secuencia muestran *cómo* se realiza cada caso de uso a lo largo del
tiempo, modelando la interacción entre los componentes del sistema mediante mensajes
ordenados. Se emplea una vista de **caja blanca**: además del actor y el frontend, se
desglosa el backend en sus capas reales —guards de seguridad, controlador, servicio y
acceso a datos (`PrismaService`)— hasta llegar a la base de datos PostgreSQL y retornar la
respuesta al actor.

Cada diagrama corresponde a un escenario clave del sistema. Los mensajes con flecha continua
(`->>`) representan invocaciones; los de flecha punteada (`-->>`) representan retornos. Los
bloques `alt` modelan los caminos alternativos (por ejemplo, una validación fallida que
devuelve un error HTTP). Todos los escenarios, salvo el login, parten de una petición
autenticada con `Bearer` JWT que los guards validan antes de alcanzar el controlador.

---

## Secuencia 1 · Crear habitación

Realiza el caso de uso **CU-11**. Un Manager u Owner registra una nueva habitación; el
sistema valida que el número no exista, la crea en estado `AVAILABLE` y deja traza en la
auditoría.

```mermaid
sequenceDiagram
    autonumber
    actor U as Manager / Owner
    participant FE as Frontend (Next.js)
    participant GD as Guards (JWT + RBAC)
    participant CT as RoomsController
    participant SV as RoomsService
    participant AU as AuditService
    participant PR as PrismaService
    participant DB as PostgreSQL

    U->>FE: Completa formulario (número, tipo, precio)
    FE->>GD: POST /rooms + Bearer JWT
    GD->>GD: Valida token y rol (OWNER / MANAGER)

    alt Token inválido o rol no autorizado
        GD-->>FE: 401 / 403
        FE-->>U: Acceso denegado
    else Autorizado
        GD->>CT: create(CreateRoomDto, user)
        CT->>SV: create(dto, employeeId)

        SV->>PR: room.findUnique({ number })
        PR->>DB: SELECT room WHERE number = ?
        DB-->>PR: habitación existente | null
        PR-->>SV: resultado

        alt El número ya existe
            SV-->>CT: ConflictException
            CT-->>FE: 409 Conflict
            FE-->>U: "La habitación ya existe"
        else Número disponible
            SV->>PR: room.create({ number, type, status=AVAILABLE, price })
            PR->>DB: INSERT room
            DB-->>PR: habitación creada
            PR-->>SV: room

            SV->>AU: log(CREATE, Room, id)
            AU->>PR: auditLog.create({ ... })
            PR->>DB: INSERT audit_log
            DB-->>PR: ok
            PR-->>AU: ok
            AU-->>SV: void

            SV-->>CT: { message, room }
            CT-->>FE: 201 Created
            FE-->>U: "Habitación creada" + refresca el tablero
        end
    end
```

### Notas

- **Guards primero.** `JwtAuthGuard` valida el token y `RolesGuard` el rol (`@Roles('OWNER',
  'MANAGER')`) antes de que la petición llegue al controlador; si fallan, se corta con
  `401`/`403` sin tocar la lógica de negocio.
- **Validación de unicidad.** El servicio consulta por `number` antes de insertar; si ya
  existe, lanza `ConflictException` (`409`) y no se crea nada.
- **Estado inicial.** La habitación se crea siempre en estado `AVAILABLE` (conectado por
  nombre a la tabla catálogo `RoomStatus`).
- **Auditoría.** Tras crear la habitación, `AuditService.log()` inserta un registro
  `CREATE` sobre la tabla `Room`; es parte del mismo flujo de la operación.

---

## Secuencia 2 · Iniciar sesión

Realiza el caso de uso **CU-01**. Es el único flujo público (sin guards): el controlador
delega en `AuthService`, que valida con `EmployeesService` y emite el token con `JwtService`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Personal del hotel
    participant FE as Frontend (Next.js)
    participant CT as AuthController
    participant SV as AuthService
    participant ES as EmployeesService
    participant JWT as JwtService
    participant PR as PrismaService
    participant DB as PostgreSQL

    U->>FE: Ingresa usuario y contraseña
    FE->>CT: POST /auth/login (LoginDto)
    CT->>SV: validateUser(username, password)
    SV->>ES: findByUsername(username)
    ES->>PR: employee.findUnique({ username })
    PR->>DB: SELECT employee WHERE username = ?
    DB-->>PR: empleado | null
    PR-->>ES: empleado | null
    ES-->>SV: empleado | null
    SV->>SV: bcrypt.compare(password, hash)

    alt Usuario inexistente o contraseña incorrecta
        SV-->>CT: null
        CT-->>FE: 401 Credenciales inválidas
        FE-->>U: Muestra el error
    else Credenciales válidas
        SV-->>CT: empleado (sin password)
        CT->>SV: login(user)
        SV->>JWT: sign({ sub, username, role })
        JWT-->>SV: access_token
        SV-->>CT: { access_token, user }
        CT-->>FE: 200 OK
        FE-->>U: Guarda el token y redirige al dashboard
    end
```

### Notas

- `validateUser()` separa el `password` del objeto devuelto: el hash nunca sale del backend.
- El token se firma con la clave `JWT_SECRET` y lleva `sub` (id), `username` y `role`.

---

## Secuencia 3 · Crear reserva

Realiza los casos de uso **CU-02** y **CU-03**. Se divide en dos fases: la consulta de
disponibilidad (`RoomsService`) y la creación de la reserva (`ReservationsService`, que
reutiliza `GuestsService` y `AuditService`).

```mermaid
sequenceDiagram
    autonumber
    actor U as Empleado
    participant FE as Frontend (Next.js)
    participant GD as Guards (JWT)
    participant RC as RoomsController
    participant RS as RoomsService
    participant VC as ReservationsController
    participant VS as ReservationsService
    participant GS as GuestsService
    participant AU as AuditService
    participant PR as PrismaService
    participant DB as PostgreSQL

    Note over U,DB: Fase 1 — Consultar disponibilidad
    U->>FE: Selecciona check-in, check-out y tipo
    FE->>GD: GET /rooms/availability + Bearer JWT
    GD->>RC: findAvailable(query)
    RC->>RS: findAvailable(query)
    RS->>PR: room.findMany({ type, status≠MAINTENANCE, sin solapamiento })
    PR->>DB: SELECT rooms ...
    DB-->>PR: habitaciones libres
    PR-->>RS: habitaciones
    RS-->>RC: habitaciones (flatten)
    RC-->>FE: 200 lista
    FE-->>U: Muestra las habitaciones disponibles

    Note over U,DB: Fase 2 — Crear la reserva
    U->>FE: Elige habitación e ingresa datos del huésped
    FE->>GD: POST /reservations + Bearer JWT
    GD->>VC: create(CreateReservationDto, user)
    VC->>VS: create(dto, employeeId)
    VS->>PR: room.findUnique({ id })
    PR->>DB: SELECT room WHERE id = ?
    DB-->>PR: room | null
    PR-->>VS: room

    alt Fechas inválidas o habitación inexistente
        VS-->>VC: BadRequest / NotFound
        VC-->>FE: 400 / 404
        FE-->>U: Muestra el error
    else Datos válidos
        VS->>PR: reservation.findFirst(solapamiento PENDING/ACTIVE)
        PR->>DB: SELECT reservation (overlap)
        DB-->>PR: conflicto | null
        PR-->>VS: resultado
        alt Hay solapamiento
            VS-->>VC: ConflictException
            VC-->>FE: 409 Conflict
            FE-->>U: "La habitación ya está reservada"
        else Sin solapamiento
            VS->>GS: upsertByNationalId(datos del huésped)
            GS->>PR: guest.upsert({ nationalId })
            PR->>DB: INSERT / UPDATE guest
            DB-->>PR: guest
            PR-->>GS: guest
            GS-->>VS: guest
            VS->>PR: reservation.create(PENDING, rateSnapshot, creator)
            PR->>DB: INSERT reservation
            DB-->>PR: reserva creada
            PR-->>VS: reserva
            VS->>AU: log(CREATE, Reservation, id)
            AU->>PR: auditLog.create({ ... })
            PR->>DB: INSERT audit_log
            DB-->>PR: ok
            PR-->>AU: ok
            AU-->>VS: void
            VS-->>VC: reserva (flatten)
            VC-->>FE: 201 Created
            FE-->>U: "Reserva creada"
        end
    end
```

### Notas

- El no solapamiento se valida con `reservation.findFirst` sobre reservas `PENDING`/`ACTIVE`
  cuyo rango se cruza (`checkIn < checkOut` y `checkOut > checkIn`).
- El huésped se resuelve con `upsert` por DNI: se crea si es nuevo o se actualiza si ya
  existía, evitando duplicados.

---

## Secuencia 4 · Realizar check-in

Realiza el caso de uso **CU-06**. Valida los estados y aplica los cambios de reserva y
habitación dentro de una transacción.

```mermaid
sequenceDiagram
    autonumber
    actor U as Empleado
    participant FE as Frontend (Next.js)
    participant GD as Guards (JWT)
    participant VC as ReservationsController
    participant VS as ReservationsService
    participant AU as AuditService
    participant PR as PrismaService
    participant DB as PostgreSQL

    U->>FE: Confirma la llegada del huésped
    FE->>GD: PATCH /reservations/:id/checkin + Bearer JWT
    GD->>VC: checkIn(id, user)
    VC->>VS: checkIn(id, employeeId)
    VS->>PR: reservation.findUnique({ id, include status + room.status })
    PR->>DB: SELECT reservation + room
    DB-->>PR: datos
    PR-->>VS: reserva

    alt Reserva no PENDING o habitación no AVAILABLE
        VS-->>VC: BadRequestException
        VC-->>FE: 400 Bad Request
        FE-->>U: Muestra el motivo
    else Válido
        VS->>PR: $transaction [ reserva→ACTIVE (+actualCheckIn), habitación→OCCUPIED ]
        PR->>DB: UPDATE reservation; UPDATE room
        DB-->>PR: ok
        PR-->>VS: [ reserva, habitación ]
        VS->>AU: log(CHECKIN, Reservation, id)
        AU->>PR: auditLog.create({ ... })
        PR->>DB: INSERT audit_log
        DB-->>PR: ok
        PR-->>AU: ok
        AU-->>VS: void
        VS-->>VC: reserva (flatten)
        VC-->>FE: 200 Check-in realizado
        FE-->>U: Actualiza el tablero
    end
```

### Notas

- Los dos `UPDATE` (reserva y habitación) van en un `$transaction`: o se aplican ambos o se
  revierte todo, evitando estados inconsistentes.

---

## Secuencia 5 · Realizar check-out y cobro

Realiza el caso de uso **CU-07**. Valida estado, descuento y método de pago, calcula los
totales y persiste reserva, pago y estado de habitación en una transacción. El descuento es
opcional, por lo que su validación se modela con `opt`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Empleado
    participant FE as Frontend (Next.js)
    participant GD as Guards (JWT)
    participant VC as ReservationsController
    participant VS as ReservationsService
    participant AU as AuditService
    participant PR as PrismaService
    participant DB as PostgreSQL

    U->>FE: Inicia el check-out (método de pago, descuento opcional)
    FE->>GD: PATCH /reservations/:id/checkout + Bearer JWT
    GD->>VC: checkOut(id, dto, user)
    VC->>VS: checkOut(id, dto, employeeId)
    VS->>PR: reservation.findUnique({ id, include status + room })
    PR->>DB: SELECT reservation + room
    DB-->>PR: datos
    PR-->>VS: reserva

    alt Reserva no ACTIVE
        VS-->>VC: BadRequestException
        VC-->>FE: 400 Bad Request
        FE-->>U: Muestra el error
    else Reserva ACTIVE
        opt Se indicó un descuento
            VS->>PR: discount.findUnique({ id })
            PR->>DB: SELECT discount
            DB-->>PR: descuento | null
            PR-->>VS: descuento
        end
        VS->>PR: paymentMethod.findUnique({ name })
        PR->>DB: SELECT payment_method
        DB-->>PR: método | null
        PR-->>VS: método

        alt Descuento inexistente/inactivo o método inválido
            VS-->>VC: NotFound / BadRequest
            VC-->>FE: 404 / 400
            FE-->>U: Muestra el error
        else Validaciones OK
            VS->>PR: roomCharge.aggregate(_sum amount)
            PR->>DB: SELECT SUM(amount) cargos
            DB-->>PR: total de cargos
            PR-->>VS: chargesTotal
            VS->>VS: Calcula roomTotal, subtotal, descuento y grandTotal
            VS->>PR: $transaction [ reserva→COMPLETED (+actualCheckOut), payment.create, habitación→CLEANING ]
            PR->>DB: UPDATE reservation; INSERT payment; UPDATE room
            DB-->>PR: ok
            PR-->>VS: [ reserva, payment ]
            VS->>AU: log(CHECKOUT, Reservation, id)
            AU->>PR: auditLog.create({ ... })
            PR->>DB: INSERT audit_log
            DB-->>PR: ok
            PR-->>AU: ok
            AU-->>VS: void
            VS-->>VC: { reserva, payment }
            VC-->>FE: 200 OK
            FE-->>U: Muestra el comprobante de pago
        end
    end
```

### Notas

- `roomCharge.aggregate` suma todos los cargos de la reserva para el `chargesTotal`.
- El cálculo de importes ocurre en memoria (`Prisma.Decimal`) y la escritura de reserva,
  pago y habitación se confirma en una sola transacción.

---

## Secuencia 6 · Registrar cargo a la reserva

Realiza el caso de uso **CU-08**. A diferencia de los anteriores, este flujo **no registra
auditoría**: solo valida y persiste el cargo.

```mermaid
sequenceDiagram
    autonumber
    actor U as Empleado
    participant FE as Frontend (Next.js)
    participant GD as Guards (JWT)
    participant CC as RoomChargesController
    participant CS as RoomChargesService
    participant PR as PrismaService
    participant DB as PostgreSQL

    U->>FE: Agrega un consumo (categoría, descripción, importe)
    FE->>GD: POST /reservations/:id/charges + Bearer JWT
    GD->>CC: create(id, CreateRoomChargeDto, user)
    CC->>CS: create(reservationId, dto, employeeId)
    CS->>PR: reservation.findUnique({ id, include status })
    PR->>DB: SELECT reservation
    DB-->>PR: reserva | null
    PR-->>CS: reserva

    alt Reserva inexistente o no ACTIVE
        CS-->>CC: NotFound / BadRequest
        CC-->>FE: 404 / 400
        FE-->>U: Muestra el error
    else Reserva ACTIVE
        CS->>PR: expenseCategory.findUnique({ id })
        PR->>DB: SELECT expense_category
        DB-->>PR: categoría | null
        PR-->>CS: categoría
        alt Categoría inexistente
            CS-->>CC: NotFoundException
            CC-->>FE: 404 Not Found
            FE-->>U: Muestra el error
        else Categoría válida
            CS->>PR: roomCharge.create({ ... })
            PR->>DB: INSERT room_charge
            DB-->>PR: cargo creado
            PR-->>CS: cargo
            CS-->>CC: cargo
            CC-->>FE: 201 Created
            FE-->>U: "Cargo agregado"
        end
    end
```

### Notas

- Solo se aceptan cargos sobre reservas `ACTIVE`. El cargo creado se sumará al
  `chargesTotal` durante el check-out (Secuencia 5).
