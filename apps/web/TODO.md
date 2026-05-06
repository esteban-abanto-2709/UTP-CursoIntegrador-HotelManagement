# Lumina Resort PMS - Frontend Implementation Plan

Este documento rastrea el progreso del Sprint 1 (Autenticación y Jerarquía de Roles) en el lado del cliente (Frontend).

## [ ] Fase 1: Motor de Autenticación y Estado Global
- [ ] Elegir e instalar un gestor de estado (Zustand recomendado) para almacenar el perfil del `user` y conocer su rol en tiempo real.
- [ ] Configurar el cliente HTTP (Axios) con un interceptor para inyectar automáticamente el token JWT (Bearer) en cada petición al backend.
- [ ] Crear la lógica para persistir el token de sesión (ej. `localStorage` o `cookies`).

## [ ] Fase 2: Pantalla de Login (`/login`)
- [ ] Diseñar y maquetar la página de inicio de sesión utilizando componentes de Shadcn UI (`Form`, `Input`, `Button`).
- [ ] Integrar validaciones en el formulario (ej. Zod + React Hook Form).
- [ ] Conectar el formulario con el endpoint `POST /auth/login` de nuestra API.
- [ ] Implementar la lógica de éxito: guardar el token, setear el estado global y redirigir a `/dashboard`.
- [ ] Manejar los errores de autenticación mostrando un mensaje claro (Toast) al usuario.

## [ ] Fase 3: Layout Dinámico y Sidebar Inteligente
- [ ] Proteger el Layout principal (Dashboard). Si alguien intenta entrar sin token, redirigirlo a `/login`.
- [ ] Modificar el componente `Sidebar` para que lea el rol del usuario desde el estado global.
- [ ] Implementar lógica de renderizado condicional en la navegación:
  - `OWNER` / `MANAGER`: Pueden ver los menús administrativos y el nuevo menú **"Gestión de Personal"**.
  - `EMPLOYEE`: Menú restringido únicamente a sus áreas operativas (ej. Limpieza).

## [ ] Fase 4: Módulo de Gestión de Personal (`/dashboard/staff`)
- [ ] Crear la página `/dashboard/staff` con una tabla que (en el futuro) liste al equipo.
- [ ] Implementar la UX de creación mediante un panel lateral (`Sheet` de Shadcn UI) o `Dialog` para no sacar al usuario de la página.
- [ ] Construir el formulario de creación de usuario dentro de este panel.
- [ ] Aplicar la lógica dinámica al desplegable de "Rol":
  - Si el creador es `OWNER` -> Muestra `MANAGER` y `EMPLOYEE`.
  - Si el creador es `MANAGER` -> Bloquea la opción y solo permite crear `EMPLOYEE`.
- [ ] Conectar el panel con el endpoint `POST /users` (asegurándose que Axios ya inyecta el token de los pasos anteriores).
