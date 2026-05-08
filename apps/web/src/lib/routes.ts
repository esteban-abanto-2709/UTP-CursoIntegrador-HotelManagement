// Archivo centralizado de rutas para evitar hardcodear strings en toda la app.
export const routes = {
  // Rutas del Frontend (Next.js)
  home: () => "/",
  login: () => "/login",

  dashboard: {
    home: () => "/dashboard",
    staff: () => "/dashboard/staff",
    reservas: () => "/dashboard/reservas",
    servicio: () => "/dashboard/servicio",
  },

  // Rutas de la API (NestJS)
  api: {
    auth: {
      login: () => "/auth/login",
      profile: () => "/auth/profile",
    },
    users: {
      create: () => "/users",
      list: () => "/users", // Endpoint hipotético para cuando necesitemos listar al personal
    },
  },
} as const;
