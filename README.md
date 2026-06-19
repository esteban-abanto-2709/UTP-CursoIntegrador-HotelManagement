# Lumina Resort PMS

Sistema de gestión hotelera B2B construido como monorepo con NestJS + Next.js.

```
apps/
├── api/     ← Backend (NestJS + Prisma + PostgreSQL)
├── web/     ← Frontend (Next.js + Tailwind + Shadcn) — desplegado en Vercel
└── docker/  ← Configuración Docker para la API
```

## Documentación

- **Frontend (web):** ver [`apps/web/README.md`](apps/web/README.md) — setup local, variables de entorno y deploy en Vercel.
- **Backend (API):** ver [`apps/api/README.md`](apps/api/README.md) — NestJS, Prisma, endpoints REST.
- **Roadmap:** ver [`docs/logbook/roadmap.md`](docs/logbook/roadmap.md) — tareas pendientes.
- **Changelog:** ver [`docs/logbook/changelog.md`](docs/logbook/changelog.md) — historial de lo ya resuelto.

> **Alcance del curso:** las únicas solicitudes técnicas del profesor son (1) tablas **100% normalizadas** y (2) un **sistema de auditoría**. El resto son features, en su mayoría opcionales.

## Requisitos Previos

- [Node.js LTS](https://nodejs.org/) (v18+)
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) *(para levantar la base de datos)*

## Levantar el Backend

```bash
cd apps/api
cp .env.example .env   # completar DATABASE_URL, JWT_SECRET, FRONTEND_URL
npm install
npx prisma migrate dev
npm run start:dev      # API en http://localhost:4000
```

> El primer usuario `OWNER` debe crearse manualmente vía `npx prisma studio` o un cliente PostgreSQL, ya que no existe pantalla de registro.
