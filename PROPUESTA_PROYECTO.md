# 🏨 Propuesta de Proyecto: Sistema de Gestión Hotelera (PMS) B2B - Lumina Resort

He aterrizado el alcance para que el proyecto sea sólido y profesional. Nos enfocaremos en un **Software a Medida (B2B)** de uso interno para el personal administrativo y operativo del hotel. El objetivo es digitalizar toda la operación interna para eliminar por completo los registros manuales en papel o Excel.

## 🚨 Problemas Críticos a Solucionar

1. **Conflictos de Reserva (Overbooking):** Eliminamos el riesgo de asignar una misma habitación a dos clientes por falta de actualización inmediata de disponibilidad.
2. **Desconexión Operativa:** Optimizamos el flujo entre recepción y limpieza; el sistema notificará en tiempo real qué habitaciones están listas para el Check-in y cuáles necesitan mantenimiento.
3. **Vulnerabilidad y Pérdida de Datos:** Digitalizamos el historial de clientes y reportes, garantizando la integridad de la información frente al uso obsoleto y vulnerable de cuadernos físicos.
4. **Ineficiencia en procesos de Check-in/out:** Automatizamos el registro visual y el control de los estados de cuartos para reducir significativamente los tiempos de espera del huésped.

## 🏗 Estructura del Sistema

El núcleo de la solución será un panel administrativo centrado en:

*   **Gestión de Inventario:** Control total de tipos de habitaciones (Sencilla, Doble, Suite) y sus estados (Limpia, Ocupada, Limpieza pendiente, Mantenimiento).
*   **Módulo de Reservas y Recepción:** Registro ágil de entradas (Check-in), salidas (Check-out) y calendario general de disponibilidad.
*   **Seguridad y Auditoría:** Control de accesos seguro por roles (Administrador/Recepcionista/Housekeeping) para proteger datos sensibles de los clientes y acotar funciones por área técnica.

---

## 🖥️ Arquitectura de Pantallas del Sistema (MVP Base)

### 1. Dashboard Principal (Vista de Recepción)
Esta es la pantalla que soluciona la ineficiencia operativa. Debe ser extremadamente visual, pulida y rápida.
*   **Feature:** Panel de disponibilidad en tiempo real.
*   **Elementos en pantalla:** 
    *   Una cuadrícula (Grid) interactiva que represente cada habitación física del hotel.
    *   **Colores Semánticos por estado:** Verde/Emerald (Disponible), Azul/Indigo (Ocupada), Amarillo (Limpieza), Gris (Mantenimiento).
    *   **Indicadores Rápidos (KPIs):** Tarjetas inteligentes mostrando "Habitaciones libres hoy", "Check-ins pendientes" u "Ocupadas en tiempo real".

### 2. Gestión de Reservas y Huéspedes
Aquí se soluciona radicalmente el Overbooking y la pérdida de datos históricos.
*   **Feature:** CRUD (Crear, Leer, Actualizar, Borrar) base de reservas futuras e históricas.
*   **Elementos en pantalla:** 
    *   Un buscador en tiempo real de huéspedes por DNI o Nombre.
    *   Un formulario dinámico (Modal) para registrar nueva reserva cruzando: Fecha entrada/salida, Datos del cliente y Selección de Habitación de Inventario sano.
    *   Tabla de Datos (Data-Table) para visualizar las operaciones del cronograma.

### 3. Control de Check-in / Check-out (Integrado al Dashboard)
Esta interacción automatiza el inicio y cierre estadístico de cuartos para los clientes.
*   **Feature:** Registro de ocupación de botones rápidos.
*   **Elementos en pantalla:** 
    *   Modal flotante (Dialog) al hacer click en cualquier habitación.
    *   Botón dinámico de "Efectuar Check-in" que cambia el estado local a "Ocupada".
    *   Botón dinámico de "Efectuar Check-out" que despacha al huésped y pasa la habitación automáticamente a la lista de "Limpieza".

### 4. Servicio a la Habitación y Mantenimiento (Housekeeping)
Ideal para cerrar la brecha de comunicación asimétrica con el staff de limpieza sin abrumarlos.
*   **Feature:** Cambio de estado de limpieza post Check-Out.
*   **Elementos en pantalla:** 
    *   Lista filtrada con un algoritmo simple mostrando *sólo* las habitaciones manchadas bajo la categoría de `limpieza`.
    *   Un botón destacado para que el staff de piso marque "Liberar Habitación / Limpia", reabasteciendo el panel verde de la vista de Recepción.

---

## 🛠️ Resumen del Prototipo Finalizado (Next.js)

Se ha creado un MVP conceptual con diseño *Dark Theme Premium ("Lumina Resort")* estructurado con los siguientes módulos de ruteo:

| Ruta | Componente Físico | Objetivo en la Expo o Demo |
| :--- | :--- | :--- |
| **`/login`** | `login/page.tsx` | Mostrar un portal seguro de autenticación B2B con identidad visual para denotar privacidad por roles. |
| **`/dashboard`** | `dashboard/page.tsx` | La "joya de la corona". Muestra las métricas operativas y las tarjetas minimalistas de habitaciones reactivas a estados y clics (Modales). |
| **`/reservas`** | `reservas/page.tsx` | Exhibe una robusta tabla en *Dark Mode* con datos de huéspedes y un formulario flotante interactivo de nueva reserva. |
| **`/servicio`** | `servicio/page.tsx` | Una vista segmentada exclusivamente para personal de limpieza listando habitaciones listas por lavar y un Dashboard amigable. |

*(Nota: En la fase de prototipado actual, la estructura depende de datos falsos de base de datos o local `states` en memoria, en miras de conectar el ecosistema Fullstack con un DB persistente más adelante).*

---

## 👤 Historias de Usuario (Fase Inicial del Proyecto)

1. **Como** Recepcionista del turno mañana, **quiero** ver la disponibilidad total de habitaciones en tiempo real representadas por colores y número en el Dashboard principal, **para** asignar cuartos instantáneamente sin riesgo de cometer un error.
2. **Como** Administrador / Gerente, **quiero** buscar y consultar el historial de mis huéspedes filtrando su nombre o DNI en el panel de Reservas, **para** identificar clientes regulares y auditar que nadie se registre de forma duplicada.
3. **Como** Personal operativo (Housekeeping), **quiero** visualizar un módulo que liste única y exclusivamente los cuartos pendientes de limpieza, **para** focalizar mis tareas del día y marcarlos como disponibles sin ayuda de conserjería.
4. **Como** Gerente del Hotel, **quiero** disponer de un portal de Login para ingresar las credenciales exclusivas del empleado, **para** asegurar al 100% que la data y finanzas de mi propiedad no está expuesta en una computadora pública.
5. **Como** Recepcionista que atiende al público en ventanilla, **quiero** que el sistema integre un modal (Dialog flotante) al presionar cualquier cuarto, **para** poder tramitar los Check-In o Check-Out y que esto refleje los cambios transversalmente en el sistema.

---

## 📑 Requisitos del Sistema (Funcionales y No Funcionales)

### Requisitos Funcionales (RF)
1. **RF-01:** El sistema DEBE proveer un punto de acceso (Login) estricto.
2. **RF-02:** El sistema DEBE exponer un Dashboard ilustrativo donde se cuantifiquen 3 indicadores de operación en pantalla: *Habitaciones Disponibles, Ocupadas y de Limpieza Pendiente*.
3. **RF-03:** El sistema DEBE permitir interactuar con cada habitación mediante un Modal que proponga acciones dependientes del estado (ej. un cuarto Ocupado sólo habilita el check-out o limpieza).
4. **RF-04:** El módulo central de reservas DEBE contener una tabla de datos interactiva renderizando listamente la data estructurada del huésped.
5. **RF-05:** El panel de reservas DEBE incluir un formulario desplegable con validaciones, exigiendo recolectar los atributos básicos: Nombre, Documento, Fechas y Habitación objetivo.
6. **RF-06:** La arquitectura y enrutamiento del sistema DEBE separar explícitamente las lógicas de Recepción, Reservaciones directas y Housekeeping para aislar los flujos de trabajo.

### Requisitos No Funcionales (RNF)
7. **RNF-01 (Interfaz):** Aplicación estructurada nativamente en estética *Modo Oscuro (Dark Theme Premium)*, utilizando de base de renderizado Tailwind CSS para mitigar la fatiga visual de usuarios expuestos a paneles de 8h laborales.
8. **RNF-02 (Arquitectura UI/UX):** La aplicación debe funcionar de forma asincrónica e interactiva como un "React Single Page Application" (SPA / React Server Components). El estado no requerirá que los clientes de recepción "reloadeen" bruscamente toda la pestaña para ver actualizaciones.
9. **RNF-03 (Semántica Cognitiva):** Se debe garantizar coherencia universal de iconografía utilizando herramientas de iconos consistentes (`Lucide`), con mapeos visuales (por ejemplo, usar un ícono de "Persona Sola" para cuartos de menor ocupación, y "Corona" para Suites).
10. **RNF-04 (Mantenibilidad Tecnológica):** El sistema debe empaquetar de forma inteligente modales y botones en componentes de interfaz reutilizables, preferiblemente abstrayendo bibliotecas sólidas de comportamiento (`Shadcn UI`), garantizando así que pueda escalar a miles de usuarios al migrar a una Base de Datos real.
