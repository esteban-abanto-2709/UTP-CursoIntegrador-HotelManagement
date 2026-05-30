// Archivo centralizado de rutas para evitar hardcodear strings en toda la app.
export const routes = {
  // Rutas del Frontend (Next.js)
  home: () => "/",
  login: () => "/login",

  dashboard: {
    home: () => "/dashboard",
    staff: () => "/dashboard/staff",
    rooms: () => "/dashboard/rooms",
    reservas: () => "/dashboard/reservas",
    calendario: () => "/dashboard/calendario",
    servicio: () => "/dashboard/servicio",
  },

  // Rutas de la API (NestJS)
  api: {
    auth: {
      login: () => "/auth/login",
      profile: () => "/auth/profile",
    },
    employees: {
      create: () => "/employees",
      list: () => "/employees",
      getOne: (id: number) => `/employees/${id}`,
      update: (id: number) => `/employees/${id}`,
    },
    rooms: {
      create: () => "/rooms",
      list: () => "/rooms",
      availability: (params: { checkIn: string; checkOut: string; type: string }) =>
        `/rooms/availability?${new URLSearchParams(params).toString()}`,
      updateStatus: (id: number) => `/rooms/${id}/status`,
      update: (id: number) => `/rooms/${id}`,
    },
    reservations: {
      list: () => "/reservations",
      create: () => "/reservations",
      updateStatus: (id: number) => `/reservations/${id}/status`,
      checkIn: (id: number) => `/reservations/${id}/checkin`,
      checkOut: (id: number) => `/reservations/${id}/checkout`,
    },
  },
} as const;
