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
    huespedes: () => "/dashboard/huespedes",
    auditoria: () => "/dashboard/auditoria",
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
      availability: (params: {
        checkIn: string;
        checkOut: string;
        type: string;
        excludeReservationId?: number;
      }) => {
        const q = new URLSearchParams({
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          type: params.type,
        });
        if (params.excludeReservationId != null) {
          q.set("excludeReservationId", String(params.excludeReservationId));
        }
        return `/rooms/availability?${q.toString()}`;
      },
      updateStatus: (id: number) => `/rooms/${id}/status`,
      update: (id: number) => `/rooms/${id}`,
    },
    reservations: {
      list: (status?: string) =>
        status ? `/reservations?status=${status}` : "/reservations",
      create: () => "/reservations",
      getOne: (id: number) => `/reservations/${id}`,
      update: (id: number) => `/reservations/${id}`,
      cancel: (id: number) => `/reservations/${id}/cancel`,
      updateStatus: (id: number) => `/reservations/${id}/status`,
      checkIn: (id: number) => `/reservations/${id}/checkin`,
      checkOut: (id: number) => `/reservations/${id}/checkout`,
      charges: (id: number) => `/reservations/${id}/charges`,
    },
    expenseCategories: {
      list: () => "/expense-categories",
    },
    guests: {
      list: (search?: string) =>
        search ? `/guests?search=${encodeURIComponent(search)}` : "/guests",
      getOne: (id: number) => `/guests/${id}`,
      create: () => "/guests",
      update: (id: number) => `/guests/${id}`,
    },
    discounts: {
      list: (activeOnly?: boolean) =>
        activeOnly ? "/discounts?active=true" : "/discounts",
    },
    payments: {
      getByReservation: (reservationId: number) => `/payments/${reservationId}`,
    },
    auditLogs: {
      list: (filters?: {
        tableName?: string;
        employeeId?: number;
        from?: string;
        to?: string;
      }) => {
        if (!filters) return "/audit-logs";
        const q = new URLSearchParams();
        if (filters.tableName) q.set("tableName", filters.tableName);
        if (filters.employeeId != null) {
          q.set("employeeId", String(filters.employeeId));
        }
        if (filters.from) q.set("from", filters.from);
        if (filters.to) q.set("to", filters.to);
        const qs = q.toString();
        return qs ? `/audit-logs?${qs}` : "/audit-logs";
      },
    },
  },
} as const;
