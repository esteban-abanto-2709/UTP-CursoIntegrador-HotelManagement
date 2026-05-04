# 🗺️ Hoja de Ruta de Implementación (Sprint 1: Auth & Users)

## [ ] Paso 1: Módulo de Usuarios (Base de datos y Encriptación)
- Conectar el `PrismaService` al `UsersModule`.
- Crear el `UsersService` con dos métodos clave:
  - `findByUsername`: Para que el Login pueda buscar al usuario.
  - `createUser`: Usar `bcrypt` para encriptar la contraseña antes de guardarla en la base de datos.
- *Revisión: Lógica pura de interacción con la DB.*

## [ ] Paso 2: Servicio de Autenticación (Lógica de Login)
- Conectar el `UsersModule` al `AuthModule`.
- En el `AuthService`, crear el método `validateUser` (usando bcrypt).
- Crear el método `login` para generar y devolver un token JWT firmado.
- *Revisión: Configuración de JWT en NestJS y cómo interactúa con los usuarios.*

## [ ] Paso 3: Controlador de Auth y Estrategia JWT
- Crear el endpoint `POST /auth/login` en el `AuthController`.
- Crear la estrategia `jwt.strategy.ts` de Passport para desencriptar los tokens.
- *Revisión: Login funcional desde Postman o ThunderClient.*

## [ ] Paso 4: Seguridad (Guards y Decoradores)
- Crear carpeta `src/common` y dentro:
  - `JwtAuthGuard`: Para exigir que estés logueado.
  - `@Roles()`: Decorador para definir roles permitidos.
  - `RolesGuard`: Guardián que leerá el decorador y bloqueará accesos no autorizados.
  - `@CurrentUser()`: Para extraer info del usuario logueado en cualquier controlador.
- *Revisión: Proteger rutas con decoradores simples.*

## [ ] Paso 5: Controlador de Usuarios y Reglas de Negocio
- Implementar el endpoint `POST /users` (crear usuarios).
- Aplicar `JwtAuthGuard`.
- Añadir lógica de jerarquía estricta en el servicio:
  - `OWNER` puede crear `MANAGER` o `EMPLOYEE`.
  - `MANAGER` solo puede crear `EMPLOYEE`.
- *Revisión Final: Prueba de jerarquía.*
