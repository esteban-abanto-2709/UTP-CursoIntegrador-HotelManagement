# 📊 Diagramas del Sistema: Lumina Resort PMS

Colección de diagramas técnicos y de negocio del Sistema de Gestión Hotelera.
Todos los diagramas están escritos en **Mermaid** y son renderizables en GitHub, GitLab y VS Code (con la extensión "Markdown Preview Mermaid Support").

> **Nota:** Estos diagramas representan una **propuesta inicial** de la arquitectura. Pueden cambiar en iteraciones futuras del proyecto según los requerimientos definitivos del equipo de desarrollo.

---

## Diagrama 1: Entidad-Relación (Base de Datos)

Representa el modelo de datos relacional propuesto para el sistema. Cubre las entidades centrales del negocio hotelero y sus relaciones de cardinalidad.

```mermaid
erDiagram
    USUARIO {
        int     id_usuario     PK
        string  nombre
        string  email
        string  password_hash
        string  rol
        bool    activo
        date    created_at
    }

    HABITACION {
        int     id_habitacion  PK
        string  numero
        string  tipo
        string  estado
        int     piso
        decimal precio_noche
    }

    HUESPED {
        int     id_huesped     PK
        string  nombre_completo
        string  dni
        string  email
        string  telefono
        date    fecha_registro
    }

    RESERVA {
        int     id_reserva     PK
        int     id_huesped     FK
        int     id_habitacion  FK
        int     id_usuario     FK
        date    fecha_checkin
        date    fecha_checkout
        string  estado
        decimal total_calculado
        date    created_at
    }

    SERVICIO_LIMPIEZA {
        int     id_servicio    PK
        int     id_habitacion  FK
        int     id_usuario     FK
        date    fecha_solicitud
        date    fecha_completado
        string  estado
        string  notas
    }

    PAGO {
        int     id_pago        PK
        int     id_reserva     FK
        decimal monto
        string  metodo
        date    fecha_pago
        string  comprobante
    }

    USUARIO        ||--o{ RESERVA           : "registra"
    HUESPED        ||--o{ RESERVA           : "tiene"
    HABITACION     ||--o{ RESERVA           : "es asignada en"
    RESERVA        ||--o| PAGO              : "genera"
    HABITACION     ||--o{ SERVICIO_LIMPIEZA : "requiere"
    USUARIO        ||--o{ SERVICIO_LIMPIEZA : "atiende"
```

---

## Diagrama 2: Journey — Flujo de Trabajo por Rol

Muestra la experiencia de cada actor durante su jornada operativa en el sistema. Es visualmente llamativo y demuestra que el equipo diseñó el software pensando en el usuario final de cada área.

```mermaid
journey
    title Jornada Operativa en Lumina Resort PMS
    section Inicio de Turno
      Inicia sesión en el sistema: 5: Recepcionista, Admin
      Revisa el Dashboard de habitaciones: 5: Recepcionista
      Audita reportes del turno anterior: 4: Admin
    section Gestión de Llegadas
      Busca la reserva del huésped por DNI: 5: Recepcionista
      Asigna habitación y hace Check-in: 5: Recepcionista
      El cuarto cambia a estado Ocupado: 4: Recepcionista
    section Gestión de Salidas
      Procesa el Check-out del huésped: 5: Recepcionista
      El cuarto pasa a estado Limpieza: 4: Recepcionista
    section Housekeeping
      Ve lista de cuartos pendientes: 5: Housekeeping
      Limpia y marca como disponible: 5: Housekeeping
      El cuarto vuelve al grid en verde: 5: Housekeeping
    section Cierre de Turno
      Crea reservas para días siguientes: 4: Recepcionista
      Revisa estado global de habitaciones: 5: Admin
      Cierra sesión de forma segura: 5: Recepcionista, Admin, Housekeeping
```

---

## Diagrama 3: Secuencia — Proceso de Check-in

Ilustra la interacción cronológica entre el Recepcionista, el Frontend (Next.js), el Backend (API) y la Base de Datos al momento de registrar la entrada de un huésped. Fundamental para demostrar el flujo técnico del sistema.

```mermaid
sequenceDiagram
    actor R as Recepcionista
    participant FE as Frontend (Next.js)
    participant API as Backend (API REST)
    participant DB as Base de Datos

    R->>FE: Hace clic en habitación "Disponible"
    FE-->>R: Abre Modal de Control de Habitación

    R->>FE: Presiona "Efectuar Check-in"
    FE->>API: POST /reservas/checkin { id_habitacion, id_huesped }

    API->>DB: Verifica estado actual de la habitación
    DB-->>API: Estado disponible OK

    API->>DB: UPDATE habitacion SET estado = ocupada
    API->>DB: INSERT INTO reservas
    DB-->>API: Confirmación OK

    API-->>FE: success true, reserva_id 42
    FE-->>R: Cierra Modal y actualiza Grid del Dashboard
    Note over FE,R: El cuarto ahora aparece en color Azul/Ocupado
```

---

## Diagrama 4: Clases (Diseño Orientado a Objetos)

Representa la estructura estática del sistema desde el punto de vista de la Programación Orientada a Objetos. Muestra las clases principales, sus atributos, métodos y relaciones de herencia/asociación.

```mermaid
classDiagram
    class Usuario {
        +int id
        +string nombre
        +string email
        +string passwordHash
        +string rol
        +bool activo
        +login(email, password) bool
        +logout() void
    }

    class Habitacion {
        +int id
        +string numero
        +string tipo
        +string estado
        +decimal precioNoche
        +int piso
        +cambiarEstado(nuevoEstado) void
        +estaDisponible() bool
    }

    class Huesped {
        +int id
        +string nombreCompleto
        +string dni
        +string email
        +string telefono
    }

    class Reserva {
        +int id
        +Date fechaCheckin
        +Date fechaCheckout
        +string estado
        +decimal totalCalculado
        +calcularTotal() decimal
        +confirmar() void
        +cancelar() void
    }

    class Pago {
        +int id
        +decimal monto
        +string metodo
        +Date fechaPago
        +string comprobante
        +registrar() void
    }

    class ServicioLimpieza {
        +int id
        +string estado
        +Date fechaSolicitud
        +Date fechaCompletado
        +marcarCompletado() void
    }

    Usuario        "1" --> "*" Reserva          : registra
    Usuario        "1" --> "*" ServicioLimpieza  : atiende
    Huesped        "1" --> "*" Reserva           : tiene
    Habitacion     "1" --> "*" Reserva           : cubre
    Habitacion     "1" --> "*" ServicioLimpieza  : requiere
    Reserva        "1" --> "0..1" Pago           : genera
```

---

## Diagrama 5: Timeline — Fases del Proyecto

Visualiza el ciclo de vida del proyecto distribuido en fases temporales. Ideal para demostrar planificación formal del trabajo, equivalente a un WBS resumido en línea de tiempo.

```mermaid
timeline
    title Ciclo de Vida del Proyecto Lumina Resort PMS
    section Fase 1 Análisis
        Semana 1 : Levantamiento de requisitos con el hotel
                 : Identificación de roles (Admin, Recepción, HK)
        Semana 2 : Redacción de Historias de Usuario
                 : Creación de diagramas UML
    section Fase 2 Diseño
        Semana 3 : Wireframes y prototipo de pantallas
                 : Modelo de Base de Datos ER
        Semana 4 : Setup del proyecto Next.js y Dark Theme
                 : Prototipo navegable finalizado
    section Fase 3 Desarrollo
        Semana 5 : Login, Dashboard y Grid de Habitaciones
                 : Módulo de Reservas y tabla interactiva
        Semana 6 : Módulo Housekeeping
                 : Backend API REST y autenticación JWT
        Semana 7 : Conexión Frontend con Base de Datos
                 : CRUD completo de Reservas
    section Fase 4 Pruebas
        Semana 8 : Pruebas funcionales por módulo
                 : Pruebas de usabilidad con personal real
    section Fase 5 Despliegue
        Semana 9 : Deploy en Vercel y Railway
                 : Documentación técnica y manual de usuario
```
