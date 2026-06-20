# Modelo de Datos (ER) — Mirador Hotel Suite

## Descripción

El modelo de datos describe la estructura lógica de la base de datos del sistema Mirador
Hotel Suite, implementada sobre PostgreSQL mediante el ORM Prisma. El esquema está compuesto
por **16 entidades** diseñadas siguiendo un criterio de normalización estricta, con el
objetivo de eliminar la redundancia y garantizar la integridad referencial de la
información operativa del hotel.

Las entidades se agrupan en dos grandes categorías. Por un lado, las **entidades de
dominio**, que representan los objetos centrales del negocio: el personal (`Employee`), las
habitaciones (`Room`), los huéspedes (`Guest`), las reservas (`Reservation`), los cargos
adicionales (`RoomCharge`), los pagos (`Payment`) y la bitácora de auditoría (`AuditLog`).
Por otro lado, las **tablas catálogo**, que aíslan en relaciones independientes los valores
que de otro modo se repetirían como texto: tipos y estados de habitación (`RoomType`,
`RoomStatus`), estados de reserva (`ReservationStatus`), métodos de pago (`PaymentMethod`),
categorías de gasto (`ExpenseCategory`), cargos y turnos del personal (`JobPosition`,
`Shift`), acciones de auditoría (`AuditAction`) y descuentos (`Discount`). Gracias a este
diseño, cualquier estado o clasificación se referencia mediante una clave foránea en lugar
de duplicarse, lo que facilita el mantenimiento y la consistencia de los datos.

El diagrama destaca además tres decisiones de modelado relevantes: la relación uno a uno
entre `Reservation` y `Payment` (cada reserva se salda con un único pago), el uso de campos
de tipo *snapshot* para congelar importes en el momento de la operación, y la trazabilidad
completa de las acciones a través de la entidad de auditoría. Se emplea la convención de
claves **PK** (primaria), **FK** (foránea) y **UK** (única). A continuación se presenta el
diagrama entidad-relación:

```mermaid
erDiagram
    Employee {
        int id PK
        string username UK
        string password
        Role role
        string dni UK "nullable"
        string firstName "nullable"
        string lastName "nullable"
        string secondLastName "nullable"
        datetime birthDate "nullable"
        int positionId FK "nullable"
        int shiftId FK "nullable"
        datetime hireDate "nullable"
        string phone "nullable"
        string email UK "nullable"
        string address "nullable"
        datetime createdAt
        datetime updatedAt
    }

    JobPosition {
        int id PK
        string name UK
    }

    Shift {
        int id PK
        string name UK
    }

    Room {
        int id PK
        string number UK
        int typeId FK "nullable"
        int statusId FK "nullable"
        decimal price
        datetime createdAt
        datetime updatedAt
    }

    RoomType {
        int id PK
        string name UK
    }

    RoomStatus {
        int id PK
        string name UK
    }

    Guest {
        int id PK
        string nationalId UK
        string fullName
        string email "nullable"
        string phone "nullable"
        datetime registeredAt
    }

    Reservation {
        int id PK
        datetime checkIn
        datetime checkOut
        datetime actualCheckIn "nullable"
        datetime actualCheckOut "nullable"
        int statusId FK "nullable"
        decimal rateSnapshot "nullable"
        int roomId FK
        int guestId FK
        int createdBy FK "nullable"
        datetime createdAt
        datetime updatedAt
    }

    ReservationStatus {
        int id PK
        string name UK
    }

    RoomCharge {
        int id PK
        int reservationId FK
        int categoryId FK
        int registeredBy FK
        string description
        decimal amount
        datetime chargedAt
    }

    ExpenseCategory {
        int id PK
        string name UK
    }

    Payment {
        int id PK
        int reservationId FK,UK
        int processedBy FK
        int paymentMethodId FK "nullable"
        int discountId FK "nullable"
        decimal roomTotal
        decimal chargesTotal
        decimal subtotal
        decimal discountAmount
        decimal grandTotal
        datetime processedAt
    }

    PaymentMethod {
        int id PK
        string name UK
    }

    Discount {
        int id PK
        string name UK
        string description "nullable"
        decimal percentage
        boolean isActive
    }

    AuditLog {
        int id PK
        int employeeId FK
        int actionId FK
        string tableName
        int recordId
        string previousValue "nullable"
        string newValue "nullable"
        datetime performedAt
    }

    AuditAction {
        int id PK
        string name UK
    }

    JobPosition       |o--o{ Employee    : "ocupa"
    Shift             |o--o{ Employee    : "trabaja en"
    RoomType          |o--o{ Room        : "clasifica"
    RoomStatus        |o--o{ Room        : "estado de"
    Room              ||--o{ Reservation : "se reserva en"
    Guest             ||--o{ Reservation : "realiza"
    ReservationStatus |o--o{ Reservation : "estado de"
    Employee          |o--o{ Reservation : "crea"
    Reservation       ||--o{ RoomCharge  : "acumula"
    ExpenseCategory   ||--o{ RoomCharge  : "categoriza"
    Employee          ||--o{ RoomCharge  : "registra"
    Reservation       ||--o| Payment     : "se salda con"
    Employee          ||--o{ Payment     : "procesa"
    PaymentMethod     |o--o{ Payment     : "método de"
    Discount          |o--o{ Payment     : "aplica a"
    Employee          ||--o{ AuditLog    : "genera"
    AuditAction       ||--o{ AuditLog    : "tipo de"
```

## Notas

- **Catálogos normalizados.** Los estados y tipos no se guardan como enums de texto en las
  tablas de dominio sino como FKs a tablas catálogo (`RoomType`, `RoomStatus`,
  `ReservationStatus`, `PaymentMethod`, `ExpenseCategory`, `JobPosition`, `Shift`,
  `AuditAction`). El único enum nativo que queda es `Role` en `Employee`.
- **Reserva ↔ Pago es 1:1.** `Payment.reservationId` es único (FK + UK): cada reserva
  tiene como máximo un pago, y el pago se cierra en el check-out.
- **Snapshots de importe.** `Reservation.rateSnapshot` y los totales de `Payment`
  (`roomTotal`, `chargesTotal`, `subtotal`, `discountAmount`, `grandTotal`) congelan los
  valores al momento de la operación, independizándolos de cambios futuros en `Room.price`
  o en los `Discount`.
- **Auditoría.** `AuditLog` registra quién (`employeeId`), qué acción (`actionId`) y sobre
  qué fila (`tableName` + `recordId`), guardando el valor previo y el nuevo.
- **Cardinalidades.** `|o` = cero o uno (FK opcional) · `||` = exactamente uno (FK
  obligatoria) · `o{` = cero o muchos.
