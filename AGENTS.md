# 🧠 AI Context: Lumina Resort (PMS B2B)

Este documento describe el estado actual del proyecto, la arquitectura, el stack tecnológico y las reglas de negocio para que futuros agentes de IA o desarrolladores puedan entender el contexto de inmediato sin necesidad de explorar todo el código desde cero.

## 📌 1. Visión General
**Lumina Resort** es un Property Management System (PMS) B2B enfocado en la gestión hotelera.
El proyecto está estructurado como un **Monorepo** con dos aplicaciones principales:
- `apps/api`: Backend.
- `apps/web`: Frontend.
- `apps/docker`: Archivos y configuraciones relacionadas a contenedores (como la base de datos).

---

## 🛠️ 2. Stack Tecnológico

### Backend (`apps/api`)
- **Framework:** NestJS (v11)
- **Base de Datos:** PostgreSQL
- **ORM:** Prisma (`@prisma/client` v7)
- **Autenticación:** JWT con Passport (`@nestjs/jwt`, `passport-jwt`)
- **Seguridad y Validación:** `bcrypt` para contraseñas, `class-validator` y `class-transformer` para DTOs.

### Frontend (`apps/web`)
- **Framework:** Next.js (v16.2.3, React 19)
- **Estilos:** Tailwind CSS v4 + Shadcn UI (Componentes base).
- **Manejo de Formularios:** React Hook Form + Zod (validación estricta).
- **Manejo de Estado Global:** Zustand (Ej: `useAuthStore` para manejar sesiones).
- **Peticiones HTTP:** Axios (configurado con interceptores en `src/lib/axios`).
- **Utilidades:** `lucide-react` (iconos), `sonner` (notificaciones tipo toast).

---

## 🚦 3. Estado Actual del Desarrollo (Progreso según Roadmap)

### ✅ Sprint 1: Autenticación y Gestión de Usuarios (COMPLETADO)
El sistema de seguridad base está implementado de extremo a extremo:
- **Modelos de DB:** Prisma ya cuenta con el modelo de Usuario y un Enum de roles: `OWNER`, `MANAGER`, `EMPLOYEE` (Empleado).
- **Backend:** 
  - Inicio de sesión con JWT (`auth/login`).
  - Endpoint de creación de usuarios (`users/create`) con Guards de roles: 
    - `OWNER` puede crear a cualquiera.
    - `MANAGER` solo puede crear `EMPLOYEE`.
- **Frontend:**
  - `/login` completamente funcional, conectado al store de Zustand.
  - Redirecciones automáticas (protección de rutas) manejado en `protected-route.tsx` e `index`.
  - Página de gestión de personal (`/dashboard/staff`) donde los administradores pueden crear nuevos empleados. Las validaciones de Zod y manejo de errores de API están limpios (Lint validado).

### ⏳ Sprints Pendientes
**Sprint 2: Sistema de Inventario y Dashboard Base (Siguiente paso)**
- Faltan los modelos `Habitacion` en Prisma y el CRUD correspondiente en NestJS.
- Creación de la UI visual con Tailwind/Shadcn para representar la cuadrícula de habitaciones con colores (Disponible, Ocupado, Limpieza).

**Sprint 3: Sistema de Operaciones y Reservas**
- Pendiente modelo `Reserva` e integración de lógicas de "Check-in" y "Check-out" y colisiones de fechas.

**Sprint 4 & 5: Vista de Limpieza, Pruebas y Despliegue**
- Vistas separadas para usuarios `EMPLOYEE`.
- Preparativos para CI/CD hacia Render (API) y Vercel (Web). Actualmente los builds en Vercel están configurados y funcionando (Linting estable).

---

## 🚨 4. Patrones y Reglas de Código (Para la IA)

1. **Gestión del Estado Asíncrono (Hydration en Next.js):** 
   - Cuando se usa Zustand persistido con localStorage, los componentes cliente usan un flag `isMounted` combinado con `useEffect`. Está permitido deshabilitar temporalmente la regla `react-hooks/set-state-in-effect` para este caso específico y evitar errores de *cascading renders*.
2. **Manejo de Errores de API:**
   - En peticiones Axios, el backend (NestJS) suele devolver los errores de validación (`class-validator`) como un arreglo de *strings*. El Frontend los captura en el bloque `catch` y evalúa si es un arreglo o un string simple para pintar un *Toast* (`sonner`). Siempre tipar el error como `unknown` en los `catch` block y castear explícitamente (`const err = error as ...`).
3. **Validación de Formularios:**
   - Todo formulario usa **Zod**. Para `z.enum()`, los mensajes de error de validación deben usar la propiedad `message: "texto"` en lugar de `required_error` u otros debido a la versión de Zod.
4. **UI/UX:**
   - Tema oscuro por defecto.
   - Efectos "Glassmorphism", inputs dinámicos y sombras para darle un toque premium. Los colores base usan `sky-500`, y el fondo principal es `#0B0F19` y `#12151C`.

*Documento actualizado en el Sprint 1.*
