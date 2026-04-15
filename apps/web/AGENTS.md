# Agent Context & Architectural Guidelines: Lumina Resort

Este documento sirve como "Brain State" o contexto general de desarrollo para cualquier LLM o Agente (Agentic AI) interactuando con esta base de código.

## 1. Identidad de Producto

- **Nombre:** Lumina Resort (anteriormente Hotel PMS B2B).
- **Enfoque de Diseño:** **Premium Dark Theme**. Cualquier nueva vista o componente DEBE respetar estrictamente esta estética "Neo-SaaS" (fondos negros/zinc oscuros, componentes grises oscuros o difuminados por "glassmorphism", y acentos vibrantes neon usando "primary").

## 2. Tecnologías y Convenciones

- **Framework:** Next.js (App Router, todo bajo `src/app`). Por defecto las pantallas se marcan como `"use client";` debido al fuerte uso de interactividad y hooks (`useState`).
- **Tailwind v4 Variables (`src/app/globals.css`):**
  - Todo se ha configurado bajo la clase base `.dark`.
  - **No usar raw colors** como `bg-white`, `bg-zinc-50`, `text-zinc-900`.
  - **Reemplazos requeridos**:
    - Fondo de paneles: `bg-card border-border/50`.
    - Textos legibles: `text-foreground`.
    - Textos secundarios o labels de formulario: `text-muted-foreground`.
    - Elementos flotantes/focus: `bg-muted` y `ring-primary/20`.
- **Iconos:** Se usa `lucide-react`. La iconografía es parte estructural del entendimiento; por ejemplo, el layout de `RoomCard` detecta el string de la DB (Sencilla, Doble, Suite) para pintar dinámicamente un `<User/>`, `<Users/>` o `<Crown/>`.
- **Componentes Base (Shadcn):** Ubicados en `src/components/ui/`. Se prefiere seguir instalando utilidades de Shadcn según hagan falta en vez de escribirlas siempre desde 0.

## 3. Estado de los Datos (Mock Backend)

- Por el momento, la persistencia se simula con Mock Data ubicado en `src/lib/mocks.ts`.
- Las pantallas (`dashboard/page.tsx`, `reservas/page.tsx`, `servicio/page.tsx`) controlan los updates mutando los diccionarios locales mediante `useState`.
- **Próximos pasos a Futuro:** Migrar esto a Server Actions conectados de una Base de Datos relacional usando Prisma o Drizzle cuando la UI esté validada unánimemente.

## 4. Estilos Especiales y Semánticos

En `globals.css` residen estilos variables para el estado de una habitación:

- `available` (Verde brillante)
- `occupied` (Azul indigo profundo)
- `cleaning` (Amarillo oro)
- `maintenance` (Gris bloqueado)

Siempre usar sus respectivas variables para respetar el alto contraste. (Ejemplo: `text-status-available-text`, `bg-status-available-icon-bg`).
