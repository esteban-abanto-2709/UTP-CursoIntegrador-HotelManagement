# 📊 Diagramas de Secuencia: Operaciones y Setup - Lumina Resort

A continuación se detallan los flujos de interacción del sistema para las fases de configuración (Setup) y la operación recurrente. Se han incluido notas guía para facilitar la exposición de la lógica de negocio y arquitectura.

---

## Diagrama 1: Creación de Empleado/Manager (Fase Setup)

> **Guion para Exposición:**  
> *"Este diagrama representa el primer paso para inicializar la seguridad del PMS. Mostramos cómo el Admin y el Nuevo Empleado interactúan presencialmente frente a la pantalla. El Admin ingresa los datos básicos, pero es el empleado quien digita su propia contraseña por seguridad. Luego, el Frontend valida que los campos estén completos usando Zod antes de enviar la petición. El Backend (NestJS) juega un rol crítico aquí: verifica en la base de datos que no exista otro empleado con el mismo DNI o Email para evitar duplicados. Finalmente, NestJS encripta la contraseña usando bcrypt antes de guardarla, asegurando que ni siquiera los administradores puedan ver las claves reales de su personal."*

```mermaid
sequenceDiagram
    actor A as Admin
    actor NE as Nuevo Empleado
    participant FE as Frontend (Next.js)
    participant API as Backend (NestJS)
    participant DB as Base de Datos (Prisma)

    A->>FE: Ingresa a "Gestión de Personal"
    A->>FE: Llena datos básicos (Nombre, DNI, Email, Rol)
    
    A->>NE: Cede el teclado al empleado
    NE->>FE: Ingresa y confirma su propia contraseña secreta
    A->>FE: Clic en "Crear Usuario"
    
    FE->>FE: Zod valida campos requeridos y formato de password
    FE->>API: POST /users/create { nombre, dni, email, password, rol }
    
    API->>DB: SELECT usuario WHERE email = email OR dni = dni
    DB-->>API: Resultado: No existe (Libre)
    
    API->>API: bcrypt.hash(password)
    
    API->>DB: INSERT INTO Usuario (..., password_hash, rol)
    DB-->>API: Usuario creado (id_usuario)
    
    API-->>FE: 201 Created (success: true)
    FE-->>A: Muestra Toast de Éxito ("Empleado registrado")
    A->>NE: El empleado ya puede iniciar sesión en su propio equipo
```

---

## Diagrama 2: Creación de Habitación (Fase Setup)

> **Guion para Exposición:**  
> *"Aquí vemos cómo el hotel alimenta su inventario de habitaciones. Al ser un hotel turístico, simplificamos la lógica eliminando el concepto engorroso de 'pisos' y nos centramos en el Número o Nombre de la habitación y su Tipo (Sencilla, Suite, etc.). El administrador llena los datos, el Frontend los valida y envía el POST al servidor. El Backend tiene una regla de negocio clave: verificar que no estemos creando un número de habitación que ya existe. Al confirmar que está libre, la habitación se guarda y nace inmediatamente con el estado de 'Disponible', lista para aparecer en color verde en nuestro Dashboard interactivo."*

```mermaid
sequenceDiagram
    actor A as Admin / Manager
    participant FE as Frontend (Next.js)
    participant API as Backend (NestJS)
    participant DB as Base de Datos (Prisma)

    A->>FE: Ingresa a "Gestión de Inventario"
    A->>FE: Abre Modal "Nueva Habitación"
    A->>FE: Llena datos (Número/Nombre, Tipo)
    A->>FE: Clic en "Guardar Habitación"
    
    FE->>FE: Zod valida los datos
    FE->>API: POST /habitaciones { numero, tipo, estado: "Disponible" }
    
    API->>DB: SELECT habitacion WHERE numero = numero
    DB-->>API: Resultado: Número no usado (OK)
    
    API->>DB: INSERT INTO Habitacion (...)
    DB-->>API: Habitación creada (id_habitacion)
    
    API-->>FE: 201 Created (success: true)
    FE-->>A: Cierra Modal y actualiza Grid de Inventario
```

---

## Diagrama 3: Reserva de Habitación (Uso Recurrente)

> **Guion para Exposición:**  
> *"Este flujo demuestra cómo nuestro sistema asiste al recepcionista para evitar el Overbooking. Cuando un cliente solicita hospedaje, el empleado no busca a ciegas; ingresa las fechas deseadas y el tipo de cuarto. El Backend cruza las fechas contra la base de datos y devuelve solo las habitaciones que no tienen reservas activas en ese periodo. Luego, vemos la interacción real: el empleado le narra al cliente las opciones disponibles y, una vez que el cliente escoge, el empleado registra los datos del huésped y confirma la reserva. Es importante notar que en este punto la habitación solo se separa temporalmente, el pago ocurre en un proceso distinto."*

```mermaid
sequenceDiagram
    actor C as Cliente (Teléfono/Presencial)
    actor E as Empleado (Recepción)
    participant FE as Frontend (Next.js)
    participant API as Backend (NestJS)
    participant DB as Base de Datos (Prisma)

    C->>E: Solicita estadía para Fechas y Tipo específico
    E->>FE: Selecciona Fechas (Check-In / Check-Out) y Tipo
    E->>FE: Clic en "Buscar Disponibilidad"
    
    FE->>API: GET /habitaciones/disponibles?checkin=X&checkout=Y&tipo=Z
    API->>DB: Consulta cuartos sin colisiones de fechas
    DB-->>API: Lista de habitaciones disponibles
    API-->>FE: Array [hab_101, hab_102, ...]
    
    FE-->>E: Muestra opciones disponibles en pantalla
    
    E->>C: Indica verbalmente opciones (Ej. "Tengo la 101 y 102")
    C->>E: Elige habitación específica
    
    E->>FE: Selecciona la habitación elegida
    E->>FE: Completa datos del huésped (Nombre, DNI)
    E->>FE: Clic en "Confirmar Reserva"
    
    FE->>API: POST /reservas { id_habitacion, fechas, datos_huesped }
    
    API->>DB: CREATE Reserva con estado "Pendiente"
    DB-->>API: Reserva creada (id_reserva)
    
    API-->>FE: 201 Created (success: true)
    FE-->>E: Muestra confirmación en el Dashboard
    E->>C: Confirma al cliente que su habitación ha sido separada
```

---

## Diagrama 4: Confirmación de Pago y Boleta (Uso Recurrente)

> **Guion para Exposición:**  
> *"Finalmente, explicamos cómo se cierra el ciclo para que el cliente pueda ocupar físicamente el cuarto. Una vez que el cliente paga en recepción, el empleado asocia el pago a la reserva previamente separada. El Backend registra la transacción y cambia el estado de la reserva. Lo más interesante a nivel técnico aquí es que, dado que somos un sistema cerrado sin facturación electrónica externa, nuestro Frontend en Next.js genera un documento PDF referencial usando los datos locales al instante. Esto nos ahorra costos de APIs externas y le da al cliente un comprobante físico o digital para que pueda pasar formalmente a su habitación."*

```mermaid
sequenceDiagram
    actor C as Cliente (Presencial)
    actor E as Empleado (Recepción)
    participant FE as Frontend (Next.js)
    participant API as Backend (NestJS)
    participant DB as Base de Datos (Prisma)

    C->>E: Efectúa el pago en recepción (Efectivo/Tarjeta)
    E->>FE: Busca la Reserva "Pendiente" del cliente
    E->>FE: Ingresa el monto y método de pago
    E->>FE: Clic en "Confirmar Pago"
    
    FE->>API: POST /pagos { id_reserva, monto, metodo }
    
    API->>DB: INSERT INTO Pago (id_reserva, monto, metodo)
    API->>DB: UPDATE Reserva SET estado = "Confirmada/Pagada"
    DB-->>API: Transacción exitosa
    
    API-->>FE: 201 Created (pago_id, success: true)
    
    FE->>FE: Renderiza plantilla visual de boleta
    FE->>FE: Genera documento PDF internamente (Local)
    FE-->>E: Descarga automática de "Boleta_Referencial.pdf"
    
    E->>C: Entrega boleta referencial e indica pase a habitación
```
