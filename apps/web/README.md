# Mirador Hotel Suite — Frontend

Interfaz web del PMS Mirador Hotel Suite. Dark Theme Premium construido con Next.js 16 App Router, Tailwind CSS v4 y Shadcn UI. Desplegado en Vercel.

## Características

- **Dashboard de recepción:** cuadrícula de habitaciones con estado en tiempo real (Disponible, Ocupada, Limpieza, Mantenimiento) usando código de colores semántico.
- **Autenticación JWT:** login con diseño glassmorphism, token persistido en Zustand + localStorage.
- **Gestión de staff:** creación de usuarios con roles `OWNER`, `MANAGER`, `EMPLOYEE`.
- **Gestión de habitaciones:** alta de habitaciones (Sencilla, Doble, Suite) conectada al backend.

## Tech Stack

| Herramienta             | Uso                               |
| ----------------------- | --------------------------------- |
| Next.js 16 (App Router) | Framework                         |
| Tailwind CSS v4         | Estilos                           |
| Shadcn UI               | Componentes base                  |
| Zustand                 | Estado global (auth)              |
| Axios                   | HTTP client con interceptores JWT |
| React Hook Form + Zod   | Formularios y validación          |
| pnpm 10.17.x            | Gestor de paquetes                |

## Setup Local

**Requisito:** tener el backend (`apps/api`) corriendo en `http://localhost:4000`.

```bash
cd apps/web

# 1. Variables de entorno
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000

# 2. Instalar dependencias
pnpm install

# 3. Iniciar dev server
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Variables de Entorno

| Variable              | Descripción          | Ejemplo                 |
| --------------------- | -------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | URL base del backend | `http://localhost:4000` |

En producción (Vercel), apunta a la URL del backend desplegado.

## Deploy en Vercel

El proyecto se despliega automáticamente desde la rama `main`. Vercel detecta pnpm por el `pnpm-lock.yaml`.

Configurar en el dashboard de Vercel:

- **Root Directory:** `apps/web`
- **Framework Preset:** Next.js
- **Environment Variables:** `NEXT_PUBLIC_API_URL` → URL del backend en producción

> Usar pnpm **10.x**. pnpm 11.x no es compatible con Vercel actualmente.

## Estructura Principal

```
src/
├── app/                  # Páginas (App Router)
│   ├── login/
│   └── dashboard/        # Recepción, staff, habitaciones, reservas, servicio
├── components/ui/        # Componentes Shadcn
├── lib/
│   ├── axios.ts          # Cliente HTTP con interceptor de auth
│   └── routes.ts         # Constantes de rutas de la API
└── store/
    └── useAuthStore.ts   # Estado de autenticación (Zustand)
```

## Convenciones de Estilo

- **No usar colores raw** (`bg-white`, `text-zinc-900`). Usar siempre variables semánticas: `bg-card`, `text-foreground`, `text-muted-foreground`.
- **Estados de habitación:** usar variables CSS de `globals.css` — `text-status-available-text`, `bg-status-occupied-icon-bg`, etc.
- Todas las páginas son `"use client"` por defecto debido al uso de hooks e interactividad.
- Instalar componentes nuevos con `pnpm dlx shadcn add <componente>`.
