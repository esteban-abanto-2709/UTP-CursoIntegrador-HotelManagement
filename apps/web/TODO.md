# Lumina Resort PMS - Frontend Implementation Plan

Este documento rastrea el progreso del Sprint 1 (Autenticación y Jerarquía de Roles) en el lado del cliente (Frontend).

## [x] Fase 1: Motor de Autenticación y Estado Global

- [x] Elegir e instalar un gestor de estado (Zustand recomendado) para almacenar el perfil del `user` y conocer su rol en tiempo real.
- [x] Configurar el cliente HTTP (Axios) con un interceptor para inyectar automáticamente el token JWT (Bearer) en cada petición al backend.
- [x] Crear la lógica para persistir el token de sesión (ej. `localStorage` o `cookies`).

## [x] Fase 2: Pantalla de Login (`/login`)

- [x] Diseñar y maquetar la página de inicio de sesión utilizando componentes de Shadcn UI (`Form`, `Input`, `Button`).
- [x] Integrar validaciones en el formulario (ej. Zod + React Hook Form).
- [x] Conectar el formulario con el endpoint `POST /auth/login` de nuestra API.
- [x] Implementar la lógica de éxito: guardar el token, setear el estado global y redirigir a `/dashboard`.
- [x] Manejar los errores de autenticación mostrando un mensaje claro (Toast) al usuario.

## [x] Fase 3: Layout Dinámico y Sidebar Inteligente

- [x] Proteger el Layout principal (Dashboard). Si alguien intenta entrar sin token, redirigirlo a `/login`.
- [x] Modificar el componente `Sidebar` para que lea el rol del usuario desde el estado global.
- [x] Implementar lógica de renderizado condicional en la navegación:
  - `OWNER` / `MANAGER`: Pueden ver los menús administrativos y el nuevo menú **"Gestión de Personal"**.
  - `EMPLOYEE`: Menú restringido únicamente a sus áreas operativas (ej. Limpieza).

## [x] Fase 4: Módulo de Gestión de Personal (`/dashboard/staff`)

- [x] Crear la página `/dashboard/staff` con una tabla que (en el futuro) liste al equipo.
- [x] Implementar la UX de creación mediante un panel lateral (`Sheet` de Shadcn UI) o `Dialog` para no sacar al usuario de la página.
- [x] Construir el formulario de creación de usuario dentro de este panel.
- [x] Aplicar la lógica dinámica al desplegable de "Rol":
  - Si el creador es `OWNER` -> Muestra `MANAGER` y `EMPLOYEE`.
  - Si el creador es `MANAGER` -> Bloquea la opción y solo permite crear `EMPLOYEE`.
- [x] Conectar el panel con el endpoint `POST /users` (asegurándose que Axios ya inyecta el token de los pasos anteriores).
