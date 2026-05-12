# 🗺️ Hoja de Ruta de Implementación (Sprint 1: Auth & Users)

## [x] Paso 1: Módulo de Usuarios (Base de datos y Encriptación)

- Conectar el `PrismaService` al `UsersModule`.
- Crear el `UsersService` con dos métodos clave:
  - `findByUsername`: Para que el Login pueda buscar al usuario.
  - `createUser`: Usar `bcrypt` para encriptar la contraseña antes de guardarla en la base de datos.
- *Revisión: Lógica pura de interacción con la DB.*

## [x] Paso 2: Servicio de Autenticación (Lógica de Login)

- Conectar el `UsersModule` al `AuthModule`.
- En el `AuthService`, crear el método `validateUser` (usando bcrypt).
- Crear el método `login` para generar y devolver un token JWT firmado.
- *Revisión: Configuración de JWT en NestJS y cómo interactúa con los usuarios.*

## [x] Paso 3: Controlador de Auth y Estrategia JWT

- Crear el endpoint `POST /auth/login` en el `AuthController`.
- Crear la estrategia `jwt.strategy.ts` de Passport para desencriptar los tokens.
- *Revisión: Login funcional desde Postman o ThunderClient.*

## [x] Paso 4: Seguridad (Guards y Decoradores)

- Crear carpeta `src/common` y dentro:
  - `JwtAuthGuard`: Para exigir que estés logueado.
  - `@Roles()`: Decorador para definir roles permitidos.
  - `RolesGuard`: Guardián que leerá el decorador y bloqueará accesos no autorizados.
  - `@CurrentUser()`: Para extraer info del usuario logueado en cualquier controlador.
- *Revisión: Proteger rutas con decoradores simples.*

## [x] Paso 5: Controlador de Usuarios y Reglas de Negocio

- Implementar el endpoint `POST /users` (crear usuarios).
- Aplicar `JwtAuthGuard`.
- Añadir lógica de jerarquía:
  - `OWNER` puede crear `MANAGER` o `EMPLOYEE`.
  - `MANAGER` solo puede crear `EMPLOYEE`.
- *Revisión Final: Prueba de jerarquía.*

---

# 🛏️ Hoja de Ruta de Implementación (Sprint 2: Setup e Inventario de Habitaciones)

## [x] Paso 1: Configurar la Base de Datos (Prisma)
- [x] Crear el modelo `Room` en `schema.prisma`.
- [x] Agregar los Enum `RoomType` (SINGLE, DOUBLE, SUITE) y `RoomStatus` (AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE).
- [x] Ejecutar la migración `npx prisma migrate dev` para actualizar PostgreSQL.

## [x] Paso 2: Endpoint de Creación (Setup)
- [x] Generar el módulo y controlador `RoomsModule` y `RoomsController`.
- [x] Añadir el endpoint `POST /rooms` para registrar nuevas habitaciones.
- [x] Aplicar Guards (`JwtAuthGuard` y `@Roles('OWNER', 'MANAGER')`) para restringir la creación de cuartos.

## [x] Paso 3: Listado y Visualización
- [x] Implementar endpoint `GET /rooms` para devolver el inventario actual de habitaciones.
- [x] *Revisión: Validar creación desde Postman con un usuario OWNER/MANAGER y restringir acceso a Employees.*
