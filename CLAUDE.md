# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lumina Resort PMS** — A full-stack Property Management System built as a monorepo with two apps:

- `apps/api` — NestJS 11 backend (port 4000)
- `apps/web` — Next.js 16 frontend (port 3000)
- `apps/docker` — Docker Compose configuration

## Development Commands

All commands must be run from the respective app directory (`apps/api` or `apps/web`).

### Backend (`apps/api`)

```bash
npm run start:dev       # Dev server with watch mode
npm run build           # Compile TypeScript to dist/
npm run test            # Jest unit tests
npm run test:watch      # Unit tests in watch mode
npm run test:e2e        # End-to-end tests
npm run test:cov        # Coverage report
npm run lint            # ESLint with auto-fix
npx prisma migrate dev  # Run DB migrations
npx prisma studio       # Open Prisma Studio UI
npx prisma generate     # Regenerate Prisma client after schema change
```

### Frontend (`apps/web`) — usa pnpm@10.17.1

```bash
pnpm dev        # Dev server (http://localhost:3000)
pnpm build      # Production build
pnpm lint       # ESLint validation
pnpm add <pkg>  # Agregar dependencia
```

Vercel detecta pnpm automáticamente por `pnpm-lock.yaml`. Usar pnpm 10.x — Vercel no soporta pnpm 11.x. No usar `npm` en este directorio.

## Environment Setup

**Backend** (`apps/api/.env`):
```
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/hotel_db
DIRECT_URL=postgresql://user:password@localhost:5432/hotel_db
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```
- `DATABASE_URL` — Used by Prisma for pooled connections
- `DIRECT_URL` — Bypasses pooling; required for migrations

**Frontend** (`apps/web/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Architecture

### Backend (NestJS)

Module structure under `apps/api/src/`:
```
common/
  decorators/   @Roles(), @CurrentUser()
  guards/       JwtAuthGuard, RolesGuard
modules/
  auth/         JWT login, Passport strategy
  users/        User CRUD with role filtering
rooms/          Room management
providers/
  prisma/       PrismaService (singleton, pg adapter)
```

**Auth flow:** `POST /auth/login` → bcrypt verify → JWT issued → stored in frontend Zustand → Axios interceptor attaches `Authorization: Bearer {token}` on all requests → 401 auto-triggers logout.

**RBAC:** Apply `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('OWNER', 'MANAGER')` on protected endpoints. Three roles: `OWNER` > `MANAGER` > `EMPLOYEE`.

**Database:** Prisma ORM with `@prisma/adapter-pg`. Schema at `apps/api/prisma/schema.prisma`. After any schema change, run `npx prisma migrate dev` and `npx prisma generate`.

Current models: `User` (id, username, password, role), `Room` (id, number, type, status).
Enums: `Role` (OWNER/MANAGER/EMPLOYEE), `RoomType` (SINGLE/DOUBLE/SUITE), `RoomStatus` (AVAILABLE/OCCUPIED/CLEANING/MAINTENANCE).

### Frontend (Next.js App Router)

Key locations under `apps/web/src/`:
```
app/                    Next.js App Router pages
  login/                Public auth page
  dashboard/            Protected pages (rooms, staff, reservas, servicio)
components/ui/          Shadcn UI components
lib/
  axios.ts              Axios instance with auth interceptors
  routes.ts             Centralized API route constants
store/
  useAuthStore.ts       Zustand auth store (persisted to localStorage)
```

**State management:** Zustand `useAuthStore` holds `{ user, token }` with `localStorage` persistence. The Axios instance in `lib/axios.ts` reads the token from this store automatically.

**API routes:** Always use `routes.ts` constants (e.g., `routes.api.rooms.list()`) instead of hardcoded strings.

**Theme:** Dark mode is enforced via `dark` class on `<html>`. Semantic color variables for room status (`--color-status-available-*`, `--color-status-occupied-*`, etc.) are defined in `globals.css`.

**Protected routes:** Wrap pages with `ProtectedRoute` component. Unauthorized users are redirected to `/login`.

## Docker

Run the full stack:
```bash
cd apps/docker
docker compose up --build
```
The API container runs Prisma migrations automatically on startup via the Dockerfile entrypoint.
