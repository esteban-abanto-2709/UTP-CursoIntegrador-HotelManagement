# Lumina Resort - Hotel PMS (B2B SaaS)

Lumina Resort es una plataforma de **Gestión de Propiedades Hoteleras (PMS)** construida con tecnologías web modernas. Ofrece una interfaz sumamente limpia enfocada en el diseño **Dark Theme Premium**.

## 🚀 Características Principales

- **Autenticación Premium:** Pantalla de Login con diseño Glassmorphism integrando degradados elegantes.
- **Recepción y Dashboard (Tiempo Real):** Vista de cuadrícula con **Tarjetas de Habitaciones Dinámicas**. Detecta rápidamente (mediante iconografía y código de colores semántico) si una habitación es "Sencilla", "Doble" o "Suite", y si su estado es _Disponible, Ocupada o Requiere Limpieza_.
- **Gestión de Reservas:** Tabla de datos inteligente con buscador rápido para auditar el histórico de clientes, así como un **Modal de Nueva Reserva** para asegurar nuevas estadías.
- **Housekeeping (Servicio de Limpieza):** Un panel dedicado para el staff de operaciones que filtra únicamente las habitaciones en estado `limpieza` y permite marcarlas como listas para el siguiente huésped.
- **Arquitectura Oscura por Defecto:** Utiliza variables semánticas en CSS (`bg-card`, `text-foreground`, `color-scheme: dark`) para asegurar legibilidad excepcional en pantallas B2B/Enterprise.

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router).
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/) (Componentes).
- **Iconografía:** [Lucide React](https://lucide.dev/).
- **Simulación Lógica:** Hooks nativos de React (`useState`) alimentados con un "mock" central (`src/lib/mocks.ts`).

## 💾 Guía de Instalación Rápida

1. Instalar las dependencias instaladas en el directorio del entorno (`apps/web`):

   ```bash
   npm install
   ```

2. Arrancar el Servidor de Desarrollo:

   ```bash
   npm run dev
   ```

3. Visita [http://localhost:3000](http://localhost:3000) en tu navegador.
   _(Nota: Puedes escribir cualquier credencial en el login para probar)_.
