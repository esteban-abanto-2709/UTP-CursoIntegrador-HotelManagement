# 📊 Diagramas Complementarios: Marco Teórico

Este documento contiene los diagramas estructurales y de comportamiento requeridos para completar el marco teórico del proyecto. 

Para adaptarnos a las expectativas de un profesor que busca un enfoque tradicional (como el de Java/NetBeans), hemos centrado el **Diagrama de Clases** en nuestro Backend (NestJS), el cual es fuertemente tipado y estrictamente Orientado a Objetos (utiliza Controladores, Servicios e Inyección de Dependencias, exactamente igual que Java Spring Boot). De esta forma, el diseño cuadra perfectamente con la teoría académica, respetando nuestro stack moderno.

---

## 1. Diagrama de Casos de Uso

> **Guion para Exposición:**  
> *"Profesor, compañeros, aquí presentamos el Diagrama de Casos de Uso. Este diagrama ilustra las interacciones principales de los Actores con el PMS (Property Management System). Hemos dividido los casos en tres grandes subsistemas: Gestión Administrativa (exclusiva del Dueño/Admin), Operaciones de Recepción (el core del negocio) y Mantenimiento/Housekeeping. Esto demuestra que nuestro sistema no solo reserva cuartos, sino que encapsula el flujo de trabajo completo del personal del hotel."*

```mermaid
flowchart LR
    %% Definición de Actores
    A1((Administrador / Dueño))
    A2((Recepcionista))
    A3((Housekeeping))

    %% Casos de Uso de Gestión (Setup)
    subgraph Gestión Administrativa
        UC1([Gestionar Empleados])
        UC2([Gestionar Habitaciones])
        UC3([Auditar Reportes])
    end

    %% Casos de Uso Operativos (Día a día)
    subgraph Operaciones de Recepción
        UC4([Consultar Disponibilidad])
        UC5([Registrar Reserva])
        UC6([Confirmar Pago])
        UC7([Efectuar Check-In / Check-Out])
    end

    %% Casos de Uso de Limpieza
    subgraph Mantenimiento
        UC8([Consultar Cuartos Sucios])
        UC9([Marcar Cuarto como Limpio])
    end

    %% Relaciones Admin
    A1 --> UC1
    A1 --> UC2
    A1 --> UC3
    A1 -. "Tiene acceso a todo" .-> UC4
    
    %% Relaciones Recepción
    A2 --> UC4
    A2 --> UC5
    A2 --> UC6
    A2 --> UC7

    %% Relaciones Housekeeping
    A3 --> UC8
    A3 --> UC9
```

---

## 2. Diagrama de Clases (Arquitectura del Backend)

> **Guion para Exposición:**  
> *"Para la estructura interna del código, este es nuestro Diagrama de Clases. Aunque nuestro Frontend usa componentes de React, nuestro Backend (NestJS) trabaja bajo el paradigma Orientado a Objetos puro. Al igual que en entornos tradicionales como Java, aplicamos el patrón de Inyección de Dependencias. Tenemos Controladores que reciben las peticiones HTTP, que a su vez llaman a los Servicios (donde vive la regla de negocio, como validar colisiones de fechas), y finalmente interactúan con nuestras clases de Entidad que mapean la Base de Datos. Es una arquitectura limpia y robusta."*

```mermaid
classDiagram
    class ReservaController {
        +crearReserva(dto: CrearReservaDto) Response
        +obtenerDisponibles(fechas: Rango) List~Habitacion~
        +confirmarPago(id: int, pagoDto: PagoDto) Response
    }

    class ReservaService {
        -prisma: PrismaService
        +validarColision(habId: int, fechas: Rango) bool
        +registrarReserva(datos: Reserva) Reserva
        +actualizarEstado(id: int, estado: String) void
    }

    class Habitacion {
        +int id
        +String numero
        +String tipo
        +String estado
        +cambiarEstado(nuevo: String) bool
    }

    class Reserva {
        +int id
        +Date checkIn
        +Date checkOut
        +String estado
        +calcularDias() int
    }

    class Usuario {
        +int id
        +String email
        +String passwordHash
        +String rol
        +hashearPassword() String
    }

    ReservaController ..> ReservaService : Inyecta dependencia
    ReservaService ..> Reserva : Construye y Valida
    ReservaService ..> Habitacion : Consulta disponibilidad
    Usuario "1" -- "*" Reserva : Registrado por
```

---

## 3. Diagrama de Componentes

> **Guion para Exposición:**  
> *"El Diagrama de Componentes muestra la vista de despliegue lógico de nuestro proyecto. Hemos construido el sistema de forma desacoplada. Del lado del cliente (Frontend), tenemos la UI construida en Next.js gestionando el estado con Zustand y comunicándose vía Axios. Del lado del servidor (Backend), los componentes de NestJS procesan las peticiones y utilizan Prisma ORM como puente de acceso seguro hacia nuestra base de datos relacional en PostgreSQL."*

```mermaid
flowchart TB
    subgraph Frontend [Aplicación Cliente - Next.js / React]
        UI[Componentes de Interfaz UI]
        State[Gestor de Estado - Zustand]
        Axios[Cliente HTTP - Axios]
        
        UI --> State
        UI --> Axios
    end

    subgraph Backend [API REST - NestJS]
        Controllers[Controladores REST]
        Services[Servicios de Negocio]
        Prisma[Prisma ORM / DAOs]
        
        Controllers --> Services
        Services --> Prisma
    end

    subgraph BaseDeDatos [Capa de Persistencia]
        PG[(PostgreSQL)]
    end

    Axios -- "Peticiones HTTP / JSON" --> Controllers
    Prisma -- "Consultas SQL Seguras" --> PG
```
