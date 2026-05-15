# 🏨 Lumina Resort PMS — Guía de Instalación y Ejecución

Sistema de gestión hotelera B2B. Esta guía explica cómo poner el proyecto en marcha desde cero en cualquier computadora Windows, Mac o Linux.

---

## ✅ Requisitos Previos

Antes de correr el proyecto, necesitás instalar estas herramientas:

### 1. Node.js (incluye npm)
Node.js es el entorno que permite ejecutar JavaScript fuera del navegador. npm es su gestor de paquetes (viene incluido).

- **Descargar:** https://nodejs.org/
- Elegí la versión **LTS** (recomendada para la mayoría de usuarios).
- Instalá normalmente (siguiente, siguiente, finalizar).
- Para verificar que quedó bien instalado, abrí una terminal y ejecutá:
  ```
  node --version
  npm --version
  ```
  Deberías ver números de versión en ambos casos.

### 2. Git
Git es el sistema que permite clonar (descargar) el repositorio del proyecto.

- **Descargar:** https://git-scm.com/downloads
- Instalá con las opciones por defecto.
- Para verificar:
  ```
  git --version
  ```

### 3. Docker Desktop *(solo si querés levantar la base de datos con Docker)*
Si tenés una base de datos PostgreSQL instalada localmente y configurada, podés saltarte este paso.

- **Descargar:** https://www.docker.com/products/docker-desktop/
- Instalá y asegurate de que Docker esté corriendo (ícono en la barra de tareas).

---

## 📥 Paso 1 — Clonar el Repositorio

Abrí una terminal (CMD, PowerShell, o Terminal en Mac/Linux) y ejecutá:

```bash
git clone <URL_DEL_REPOSITORIO>
cd lumina-resort
```

> Reemplazá `<URL_DEL_REPOSITORIO>` con la URL real de GitHub/GitLab del proyecto.

---

## 🗄️ Paso 2 — Configurar la Base de Datos

### Opción A: Usando Docker (recomendado, más fácil)

Dentro de la carpeta `apps/docker/`, copiá el archivo de ejemplo de variables de entorno:

```bash
cd apps/docker
cp .env.example .env
```

Editá el archivo `.env` con los valores que quieras (podés dejar los de ejemplo para desarrollo local). Luego levantá los contenedores:

> ⚠️ Solo se levanta el contenedor de la API. Necesitás una base de datos PostgreSQL aparte o configurar un `docker-compose` completo con el servicio de Postgres.

### Opción B: PostgreSQL local

Si ya tenés PostgreSQL instalado en tu máquina, creá una base de datos vacía y anotá los datos de conexión (host, puerto, usuario, contraseña, nombre de la BD).

---

## ⚙️ Paso 3 — Configurar el Backend (API)

Navegá a la carpeta del backend:

```bash
cd apps/api
```

### 3.1 Copiar el archivo de variables de entorno

```bash
cp .env.example .env
```

Abrí el archivo `.env` que se acaba de crear y completá los valores:

```env
PORT=4000
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@localhost:5432/NOMBRE_BD
DIRECT_URL=postgresql://USUARIO:CONTRASEÑA@localhost:5432/NOMBRE_BD
JWT_SECRET=cualquier-clave-secreta-larga-aqui
FRONTEND_URL=http://localhost:3000
```

> Reemplazá `USUARIO`, `CONTRASEÑA` y `NOMBRE_BD` con los datos reales de tu base de datos.

### 3.2 Instalar dependencias

```bash
npm install
```

### 3.3 Ejecutar las migraciones de la base de datos

Esto crea todas las tablas necesarias automáticamente:

```bash
npx prisma migrate dev
```

### 3.4 (Opcional) Crear el usuario Owner inicial

Como no hay pantalla de registro, el primer usuario OWNER debe crearse directamente por base de datos. Podés usar Prisma Studio para hacerlo visualmente:

```bash
npx prisma studio
```

Esto abre una interfaz en el navegador en `http://localhost:5555` donde podés insertar un registro en la tabla `User` con el rol `OWNER` y una contraseña encriptada con bcrypt.

> **Alternativa rápida:** podés usar un script de seed o insertar el usuario manualmente desde cualquier cliente de PostgreSQL (TablePlus, DBeaver, pgAdmin, etc.).

### 3.5 Iniciar el servidor de desarrollo

```bash
npm run start:dev
```

La API estará corriendo en: **http://localhost:4000**

---

## 🖥️ Paso 4 — Configurar el Frontend (Web)

Abrí una **nueva terminal** (dejá la del backend corriendo) y navegá a la carpeta web:

```bash
cd apps/web
```

### 4.1 Copiar el archivo de variables de entorno

```bash
cp .env.example .env
```

El archivo `.env` debería verse así (no necesita cambios si el backend corre en el puerto por defecto):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 4.2 Instalar dependencias

```bash
npm install
```

### 4.3 Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación web estará disponible en: **http://localhost:3000**

---

## 🚀 El sistema está corriendo

Abrí tu navegador y entrá a **http://localhost:3000**. Deberías ver la pantalla de login de Lumina Resort.

Usá las credenciales del usuario OWNER que creaste en el Paso 3.4 para ingresar.

---

## 📁 Estructura del Proyecto (Resumen)

```
lumina-resort/
├── apps/
│   ├── api/        ← Backend (NestJS + Prisma + PostgreSQL)
│   ├── web/        ← Frontend (Next.js + Tailwind + Shadcn)
│   └── docker/     ← Configuración de contenedores Docker
└── docs/           ← Diagramas y documentación técnica
```

---

## 🛑 Comandos Útiles

| Acción | Comando | Carpeta |
|--------|---------|---------|
| Iniciar backend (dev) | `npm run start:dev` | `apps/api` |
| Iniciar frontend (dev) | `npm run dev` | `apps/web` |
| Ver base de datos visualmente | `npx prisma studio` | `apps/api` |
| Correr migraciones | `npx prisma migrate dev` | `apps/api` |
| Build de producción (API) | `npm run build` | `apps/api` |
| Build de producción (Web) | `npm run build` | `apps/web` |

---

## ❓ Problemas Comunes

**Error de conexión a la base de datos**
> Verificá que PostgreSQL esté corriendo y que los datos en `.env` (usuario, contraseña, nombre de BD, puerto) sean correctos.

**Puerto ya en uso**
> Si el puerto 4000 o 3000 está ocupado, cambiá el valor de `PORT` en el `.env` del backend y `NEXT_PUBLIC_API_URL` en el `.env` del frontend.

**`npm install` falla**
> Asegurate de tener Node.js versión 18 o superior. Verificá con `node --version`.

**Las migraciones fallan**
> Asegurate de que la base de datos exista antes de correr `prisma migrate dev`. Podés crearla con `CREATE DATABASE nombre_bd;` desde psql o pgAdmin.
