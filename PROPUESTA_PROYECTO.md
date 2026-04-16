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
6. **Como** Recepcionista Nocturno, **quiero** poder crear una nueva reservación a través de un formulario guiado con validaciones básicas, **para** dejar programados a los próximos clientes con antelación y asegurar su plaza en el PMS.
7. **Como** Administrador Financiero, **quiero** que el sistema sea capaz de registrar internamente la transacción tras aprobar un Check-Out, **para** evitar fugas de comprobantes y mantener la auditoría diaria saneada.

---

## 📑 Requisitos del Sistema (Funcionales y No Funcionales)

### Requisitos Funcionales (RF)
1. **RF-01:** El sistema DEBE proveer un portal de Login estricto para proteger la capa técnica (Dashboard).
2. **RF-02:** El sistema DEBE diferenciar sesiones basándose en roles administrativos (Admin, Recepción, Housekeeping).
3. **RF-03:** El sistema DEBE exhibir un Dashboard interactivo que pinte la disponibilidad global del hotel.
4. **RF-04:** El sistema DEBE contar los indicadores (KPIs) en tiempo real (Habitaciones Libres, Ocupadas, Limpieza).
5. **RF-05:** El sistema DEBE permitir interactuar haciendo clic sobre el contenedor visual de cada habitación.
6. **RF-06:** El sistema DEBE abrir un Modal de control operativo exclusivo por cada habitación consultada.
7. **RF-07:** El sistema DEBE permitir modificar el estado de "Disponible" a "Ocupada" para simular un Check-in directo.
8. **RF-08:** El sistema DEBE permitir modificar el estado de "Ocupada" a "Limpieza" tras culminar la estadía (Check-out).
9. **RF-09:** El sistema DEBE permitir a las cuentas operativas trasladar el estatus de "Limpieza" a "Disponible".
10. **RF-10:** El sistema DEBE permitir al Administrador catalogar una falla técnica mandando un cuarto a "Mantenimiento".
11. **RF-11:** El módulo central de reservas DEBE presentar una estructura en formato tabla de datos robusta.
12. **RF-12:** El sistema DEBE ofrecer una barra de búsqueda para rastrear un huésped específico en tiempo récord.
13. **RF-13:** El sistema DEBE contener un botón y un flujo (Dialog UI) para dar de alta una nueva reservación al vuelo.
14. **RF-14:** El formulario de creación de reserva DEBE exigir variables obligatorias: Nombre del Huésped, DNI y Fechas.
15. **RF-15:** El sistema DEBE incluir un comprobador visual cruzado que impida que una fecha de Check-Out sea menor al In.
16. **RF-16:** El sistema DEBE proveer una vista de "Housekeeping" totalmente aislada de la lógica contable y de recepción.
17. **RF-17:** La vista de Housekeeping DEBE filtrar su inventario global para listar única y exclusivamente los cuartos sucios.
18. **RF-18:** El sistema DEBE albergar variables dinámicas en el Mock DB para procesar distintios "Tipos de Cuarto" (Sencilla, Doble, Suite).
19. **RF-19:** El sistema DEBE ser programado simulando lógica CRUD en arreglos JSON/JSX locales previo a su fase Backend.
20. **RF-20:** El sistema DEBE mostrar Empty States interactivos cuando las búsquedas en las tablas devuelvan datos vacíos.

### Requisitos No Funcionales (RNF)
21. **RNF-01 (Mantenibilidad Visual y Ergonómica):** La interfaz deberá construirse utilizando la variable `Dark Theme` (Modo Oscuro) desde el primer sprint para atenuar la fatiga ocular y favorecer sesiones nocturnas de trabajo del personal del hotel, usando TailwindCSS.
22. **RNF-02 (Arquitectura Single Page Application):** El motor técnico (Next.js App Router) asegurará que la transición entre Reservas y Dashboard ocurra instantáneamente del lado del cliente, previniendo recargas severas de la página (*flashing*) propias de los PMS clásicos.
23. **RNF-03 (Semántica Cognitiva de Interfaz):** Se garantizará una retención de aprendizaje rápida para empleados mediante la estandarización universal de íconos (`Lucide React`) atados invariablemente a códigos de estado (Verde: OK, Amarillo: Espera, Índigo/Primary: Ocupado).
24. **RNF-04 (Escalabilidad de Componentes):** Toda la estructura de UI (`RoomCard`, `Dialogs`, `Tables`) deberá programarse empleando la filosofía de Componentes "Dumb" (que sólo leen variables reactivas), alistando su despegue para ser conectados fácilmente con APIs seguras (PostgreSQL/Node) por otro equipo de desarrollo.
25. **RNF-05 (Rendimiento del Frontend):** Todo panel visual (`Dashboard / Mapeo de Componentes Mocks`) deberá lograr sus renderizados y proyecciones de cuadrículas reactivas en intervalos menores a los 0.5 segundos durante las interacciones locales.
