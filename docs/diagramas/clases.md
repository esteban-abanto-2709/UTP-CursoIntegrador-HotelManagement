# Diagrama de Clases — Mirador Hotel Suite

## Descripción

El diagrama de clases representa la estructura orientada a objetos del backend de Mirador
Hotel Suite, construido con el framework NestJS. A diferencia del modelo de datos —que
describe las tablas persistidas—, este diagrama muestra las **clases de software** que
implementan la lógica de la aplicación y las dependencias entre ellas.

La arquitectura sigue un patrón en capas claramente definido. La **capa de controladores**
(`*Controller`) expone los endpoints REST: recibe las peticiones HTTP, valida los datos de
entrada mediante objetos de transferencia (DTOs) y delega el trabajo en los servicios; no
contiene lógica de negocio. La **capa de servicios** (`*Service`) concentra toda la lógica
de dominio —validaciones, cálculo de disponibilidad por solapamiento de fechas, totales de
pago, reglas de roles— y es la única que accede a los datos. Por debajo, una **capa de
infraestructura transversal** provee la persistencia (`PrismaService`), la seguridad
(`JwtAuthGuard`, `RolesGuard`, `JwtStrategy`) y la emisión de tokens (`JwtService`).

Las relaciones del diagrama corresponden a la **inyección de dependencias** de NestJS: cada
controlador depende de su servicio, y los servicios dependen de `PrismaService` y, cuando
procede, de otros servicios (por ejemplo, `ReservationsService` reutiliza `GuestsService` y
`AuditService`, y `AuthService` reutiliza `EmployeesService`). El control de acceso por
roles (RBAC) se aplica de forma transversal mediante guards y el decorador `@Roles()`. A
continuación se presenta el diagrama de clases:

```mermaid
classDiagram
    direction LR

    %% ===================== CONTROLADORES =====================
    class AuthController {
        <<Controller>>
        +route /auth
        +login(LoginDto) Token
        +getProfile() Profile
    }
    class RoomsController {
        <<Controller>>
        +route /rooms
        +create(CreateRoomDto) Room
        +findAll() Room[]
        +findAvailable(AvailabilityQueryDto) Room[]
        +updateStatus(id, UpdateRoomStatusDto) Room
        +update(id, UpdateRoomDto) Room
    }
    class ReservationsController {
        <<Controller>>
        +route /reservations
        +create(CreateReservationDto) Reservation
        +findAll(FilterReservationsDto) Reservation[]
        +findOne(id) Reservation
        +update(id, UpdateReservationDto) Reservation
        +cancel(id) Reservation
        +updateStatus(id, UpdateReservationStatusDto) Reservation
        +checkIn(id) Reservation
        +checkOut(id, CheckoutReservationDto) Payment
    }
    class GuestsController {
        <<Controller>>
        +route /guests
        +findAll(FindGuestsDto) Guest[]
        +findOne(id) Guest
        +create(CreateGuestDto) Guest
        +update(id, UpdateGuestDto) Guest
    }
    class EmployeesController {
        <<Controller>>
        +route /employees
        +create(CreateEmployeeDto) Employee
        +findAll() Employee[]
        +findOne(id) Employee
        +update(id, UpdateEmployeeDto) Employee
    }
    class RoomChargesController {
        <<Controller>>
        +route /reservations/:id/charges
        +create(id, CreateRoomChargeDto) RoomCharge
        +findAll(id) RoomCharge[]
    }
    class ExpenseCategoriesController {
        <<Controller>>
        +route /expense-categories
        +findAll() ExpenseCategory[]
    }
    class DiscountsController {
        <<Controller>>
        +route /discounts
        +findAll(FindDiscountsDto) Discount[]
    }
    class PaymentsController {
        <<Controller>>
        +route /payments
        +findByReservation(reservationId) Payment
    }
    class AuditController {
        <<Controller>>
        +route /audit-logs
        +findAll(FilterAuditLogsDto) AuditLog[]
    }

    %% ===================== SERVICIOS =====================
    class AuthService {
        <<Service>>
        +validateUser(username, pass) Employee
        +login(user) Token
    }
    class EmployeesService {
        <<Service>>
        +findByUsername(username) Employee
        +create(CreateEmployeeDto, currentUser) Employee
        +findOne(id, currentUser) Employee
        +update(id, UpdateEmployeeDto, currentUser) Employee
        +findAll(currentUser) Employee[]
    }
    class RoomsService {
        <<Service>>
        +create(CreateRoomDto, employeeId) Room
        +findAll() Room[]
        +findAvailable(AvailabilityQueryDto) Room[]
        +updateStatus(id, UpdateRoomStatusDto, employeeId) Room
        +update(id, UpdateRoomDto, employeeId) Room
    }
    class ReservationsService {
        <<Service>>
        +create(CreateReservationDto, employeeId) Reservation
        +findAll(FilterReservationsDto) Reservation[]
        +findOne(id) Reservation
        +update(id, UpdateReservationDto, employeeId) Reservation
        +cancel(id, employeeId) Reservation
        +updateStatus(id, UpdateReservationStatusDto) Reservation
        +checkIn(id, employeeId) Reservation
        +checkOut(id, CheckoutReservationDto, employeeId) Payment
        -assertNoOverlap(roomId, checkIn, checkOut) void
        -calcNights(checkIn, checkOut) int
    }
    class GuestsService {
        <<Service>>
        +findAll(FindGuestsDto) Guest[]
        +findOne(id) Guest
        +create(CreateGuestDto) Guest
        +update(id, UpdateGuestDto) Guest
        +upsertByNationalId(data) Guest
    }
    class RoomChargesService {
        <<Service>>
        +create(reservationId, CreateRoomChargeDto, employeeId) RoomCharge
        +findByReservation(reservationId) RoomCharge[]
        +findAllCategories() ExpenseCategory[]
    }
    class DiscountsService {
        <<Service>>
        +findAll(FindDiscountsDto) Discount[]
    }
    class PaymentsService {
        <<Service>>
        +findByReservation(reservationId) Payment
    }
    class AuditService {
        <<Service>>
        +log(employeeId, action, tableName, recordId, prev, next) void
        +findAll(FilterAuditLogsDto) AuditLog[]
    }

    %% ===================== INFRAESTRUCTURA =====================
    class PrismaService {
        <<Provider>>
        +onModuleInit() void
    }
    class JwtAuthGuard {
        <<Guard>>
        +canActivate(context) boolean
    }
    class RolesGuard {
        <<Guard>>
        +canActivate(context) boolean
    }
    class JwtStrategy {
        <<Strategy>>
        +validate(payload) any
    }
    class JwtService {
        <<NestJS>>
        +sign(payload) string
    }

    %% ===================== DEPENDENCIAS (inyección) =====================
    AuthController --> AuthService
    RoomsController --> RoomsService
    ReservationsController --> ReservationsService
    GuestsController --> GuestsService
    EmployeesController --> EmployeesService
    RoomChargesController --> RoomChargesService
    ExpenseCategoriesController --> RoomChargesService
    DiscountsController --> DiscountsService
    PaymentsController --> PaymentsService
    AuditController --> AuditService

    AuthService --> EmployeesService
    AuthService --> JwtService
    ReservationsService --> GuestsService
    ReservationsService --> AuditService
    RoomsService --> AuditService
    EmployeesService --> AuditService

    AuthService ..> PrismaService
    EmployeesService --> PrismaService
    RoomsService --> PrismaService
    ReservationsService --> PrismaService
    GuestsService --> PrismaService
    RoomChargesService --> PrismaService
    DiscountsService --> PrismaService
    PaymentsService --> PrismaService
    AuditService --> PrismaService

    JwtAuthGuard ..> JwtStrategy
```

## Notas

- **Estereotipos.** `<<Controller>>` capa de presentación REST · `<<Service>>` lógica de
  negocio · `<<Provider>>` / `<<Guard>>` / `<<Strategy>>` infraestructura de NestJS.
- **DTOs.** Los parámetros como `CreateReservationDto`, `UpdateRoomDto` o
  `FilterAuditLogsDto` son clases de transferencia de datos validadas con `class-validator`
  y Zod; no se dibujan como clases propias para no saturar el diagrama, pero aparecen como
  tipos de los parámetros de los métodos.
- **RBAC transversal.** Todos los controladores aplican `JwtAuthGuard`. Los que llevan el
  decorador `@Roles()` aplican además `RolesGuard`: `EmployeesController` y el `profile` de
  `AuthController` exigen `OWNER`/`MANAGER`; `AuditController` exige `OWNER`;
  `RoomsController.create/update` exige `OWNER`/`MANAGER`; el resto de operaciones de
  reservas admite los tres roles.
- **Reutilización entre servicios.** `AuthService` valida credenciales a través de
  `EmployeesService`; `ReservationsService` resuelve al huésped con `GuestsService` y
  registra trazas con `AuditService`; `RoomsService` y `EmployeesService` también auditan
  sus cambios. `PrismaService` es el punto único de acceso a la base de datos.
- **Métodos privados.** En `ReservationsService`, `assertNoOverlap()` implementa la
  validación de overbooking por solapamiento de fechas y `calcNights()` calcula las noches
  facturables; ambos son auxiliares internos (visibilidad `-`).
