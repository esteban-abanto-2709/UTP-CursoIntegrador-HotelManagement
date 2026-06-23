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

# 1. Instalar dependencias
pnpm install

# 2. Iniciar dev server
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

> No necesitas configurar variables de entorno en local: el proxy cae a su
> default `http://localhost:4000` (ver "Comunicación con el API").

## Comunicación con el API (proxy)

El navegador **nunca** llama al backend directamente. Todas las peticiones van a
rutas relativas con prefijo `/api` (mismo origen que la web) y el servidor de
Next las reenvía al backend mediante un rewrite definido en `next.config.ts`.

- **Punto único del prefijo:** la constante `API_BASE_PATH` en
  `src/lib/routes.ts`. La importan `lib/axios.ts`, `hooks/use-api-health.ts` y
  `components/wake-up-gate.tsx`. No hardcodear `/api` en ningún otro archivo.
- **Destino del proxy:** la variable `API_INTERNAL_URL`. Ojo: Next evalúa los
  `rewrites()` en **build time** y congela el destino en `routes-manifest.json`
  (no se lee en runtime), así que la variable debe estar presente al hacer
  `next build`. Por defecto `http://localhost:4000`.

| Entorno                | `API_INTERNAL_URL`              | Cuándo / quién lo define                         |
| ---------------------- | ------------------------------- | ------------------------------------------------ |
| Dev local (`pnpm dev`) | `http://localhost:4000` (default) | nada que configurar; `next dev` re-evalúa en vivo |
| Docker                 | `http://api:4000` (DNS interno) | build-arg en `Dockerfile` / `docker-compose.yml`  |

Ventaja: el backend no se expone al exterior y no hay que configurar CORS; solo
se publica la web.

## Deploy en Vercel

El proyecto se despliega automáticamente desde la rama `main`. Vercel detecta pnpm por el `pnpm-lock.yaml`.

Configurar en el dashboard de Vercel:

- **Root Directory:** `apps/web`
- **Framework Preset:** Next.js
- **Environment Variables:** `API_INTERNAL_URL` → URL del backend en producción (el proxy de Next la reenvía server-side)

> Usar pnpm **10.x**. pnpm 11.x no es compatible con Vercel actualmente.

## Estructura Principal

```
src/
├── app/                  # Páginas (App Router)
│   ├── login/
│   └── dashboard/        # Recepción, staff, habitaciones, reservas, servicio
├── components/ui/        # Componentes Shadcn
├── lib/
│   ├── axios.ts          # Cliente HTTP con interceptor de auth (baseURL = API_BASE_PATH)
│   └── routes.ts         # Rutas de la API + API_BASE_PATH (prefijo del proxy)
└── store/
    └── useAuthStore.ts   # Estado de autenticación (Zustand)
```

## Convenciones de Estilo

- **No usar colores raw** (`bg-white`, `text-zinc-900`). Usar siempre variables semánticas: `bg-card`, `text-foreground`, `text-muted-foreground`.
- **Estados de habitación:** usar variables CSS de `globals.css` — `text-status-available-text`, `bg-status-occupied-icon-bg`, etc.
- Todas las páginas son `"use client"` por defecto debido al uso de hooks e interactividad.
- Instalar componentes nuevos con `pnpm dlx shadcn add <componente>`.
