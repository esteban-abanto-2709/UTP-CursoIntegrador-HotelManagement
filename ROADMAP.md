# 🗺️ Roadmap de Entrega: Lumina Resort (PMS B2B)

**Contexto:** Proyecto de Gestión Hotelera
**Stack:** Next.js (Frontend), NestJS + Prisma + PostgreSQL (Backend)
**Tiempo Disponible:** Semanas 7 a la 16 (~9 semanas).
**Enfoque Orientado a Sistemas:** Desarrollo vertical (Backend + Frontend juntos) por cada módulo crítico.

---

## 🔐 Sprint 1: Sistema de Autenticación y Usuarios (Semanas 7 y 8)
*Objetivo: Sentar las bases de seguridad, crear jerarquías de usuarios y proteger el acceso al sistema de forma dinámica.*

- [ ] **Base de Datos (Prisma):** Crear el modelo `Usuario` y definir el Enum de Roles (`OWNER`, `MANAGER`, `EMPLEADO`).
- [ ] **Backend (NestJS Auth):** Implementar inicio de sesión usando JWT (Json Web Tokens) y configurar guardias (`RolesGuard`).
- [ ] **Backend (Lógica de Roles):** Endpoint para crear nuevos usuarios con reglas estrictas:
  - El `OWNER` puede crear usuarios tipo `MANAGER` y `EMPLEADO`.
  - El `MANAGER` puede crear usuarios tipo `EMPLEADO`.
- [ ] **Frontend (Login):** Crear la pantalla de `/login`, conectarla con el backend y almacenar el token de forma segura.
- [ ] **Frontend (Enrutamiento y Tabs):** Implementar la lógica para reconocer el rol del usuario que ingresó y renderizar el *Layout* o *Tabs* correspondientes (ej: si es OWNER/MANAGER ve el Dashboard de Finanzas/Recepción, si es EMPLEADO ve solo la sección de Limpieza u Operaciones).

---

## 🛏️ Sprint 2: Sistema de Inventario y Dashboard Base (Semanas 9 y 10)
*Objetivo: Visualizar y manejar las habitaciones físicas del hotel en tiempo real.*

- [ ] **Base de Datos:** Crear modelo `Habitacion` (Número, Tipo, Estado).
- [ ] **Backend:** CRUD de Habitaciones. Crear un "Seed" para generar rápidamente 20 habitaciones de prueba en la DB.
- [ ] **Frontend (UI Base):** Configurar Tailwind Dark Theme y Shadcn UI.
- [ ] **Frontend (Dashboard):** Construir la cuadrícula visual de los cuartos, que cambien de color según su estado (Verde, Azul, Amarillo).

---

## 📅 Sprint 3: Sistema de Operaciones y Reservas (Semanas 11 y 12)
*Objetivo: Manejar el negocio core, cruces de fechas y evitar los overbookings.*

- [ ] **Base de Datos:** Crear modelo `Reserva` (relacionando un Huésped, Fechas, y la Habitación).
- [ ] **Backend:** Validadores para rechazar un registro si las fechas chocan. Endpoints especiales para realizar *Check-in* y *Check-out*.
- [ ] **Frontend (Recepción):** Integrar los modales flotantes en el Dashboard para que el usuario pueda cambiar los estados de los cuartos en tiempo real.
- [ ] **Frontend (Reservas):** Tabla de datos para buscar huéspedes activos/históricos y formulario dinámico para agendar nuevas reservas.

---

## 🧹 Sprint 4: Sistema de Limpieza y Refinamiento (Semanas 13 y 14)
*Objetivo: Vista dedicada al rol operativo y mejoras visuales del sistema.*

- [ ] **Frontend (Vista Empleado):** Crear una pantalla súper limpia y aislada que solo liste habitaciones en estado "Limpieza".
- [ ] **Botones Rápidos:** Un botón de "Liberar Cuarto" en el Frontend que mande un `PATCH` para regresar el cuarto a estado Disponible.
- [ ] **UX/UI:** Asegurar que si el `EMPLEADO` intenta forzar el acceso a `/reservas` a través de la URL, el Frontend lo rebote. Mejorar *Empty States* y *Loadings*.

---

## 🚀 Sprint 5: Testing Local y Despliegue (Semanas 15 y 16)
*Objetivo: Desplegar a producción para la evaluación del profesor.*

- [ ] **Pruebas de Flujo Completo:** Entrar como Owner -> Crear un Empleado -> Entrar como Recepcionista -> Hacer Check-In -> Entrar como Empleado -> Limpiar.
- [ ] **Despliegue Backend:** Subir la API de NestJS a Render.com o Railway.app.
- [ ] **Despliegue Frontend:** Subir Next.js a Vercel.
- [ ] **Entrega Final:** Redactar el documento final para el profesor incluyendo los enlaces públicos, y cuentas de prueba para que evalúe como `OWNER` o `MANAGER`.
