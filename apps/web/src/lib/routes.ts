// Archivo centralizado de rutas para evitar hardcodear strings en toda la app.
export const API_BASE_PATH = "/api";

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
    analiticas: () => "/dashboard/analiticas",
    finanzas: () => "/dashboard/finanzas",
  },

  // Rutas de la API (NestJS)
  api: {
    health: () => "/health",
    auth: {
      login: () => "/auth/login",
      profile: () => "/auth/profile",
    },
    employees: {
      create: () => "/employees",
      list: (page?: { cursor?: number; take?: number }) => {
        const q = new URLSearchParams();
        if (page?.cursor != null) q.set("cursor", String(page.cursor));
        if (page?.take != null) q.set("take", String(page.take));
        const qs = q.toString();
        return qs ? `/employees?${qs}` : "/employees";
      },
      getOne: (id: number) => `/employees/${id}`,
      update: (id: number) => `/employees/${id}`,
    },
    rooms: {
      create: () => "/rooms",
      list: (filters?: {
        type?: string;
        status?: string;
        search?: string;
        cursor?: number;
        take?: number;
      }) => {
        const q = new URLSearchParams();
        if (filters?.type) q.set("type", filters.type);
        if (filters?.status) q.set("status", filters.status);
        if (filters?.search) q.set("search", filters.search);
        if (filters?.cursor != null) q.set("cursor", String(filters.cursor));
        if (filters?.take != null) q.set("take", String(filters.take));
        const qs = q.toString();
        return qs ? `/rooms?${qs}` : "/rooms";
      },
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
      list: (filters?: {
        status?: string;
        from?: string;
        to?: string;
        roomId?: number;
        search?: string;
        sort?: string;
        cursor?: number;
        take?: number;
      }) => {
        if (!filters) return "/reservations";
        const q = new URLSearchParams();
        if (filters.status) q.set("status", filters.status);
        if (filters.from) q.set("from", filters.from);
        if (filters.to) q.set("to", filters.to);
        if (filters.roomId != null) q.set("roomId", String(filters.roomId));
        if (filters.search) q.set("search", filters.search);
        if (filters.sort) q.set("sort", filters.sort);
        if (filters.cursor != null) q.set("cursor", String(filters.cursor));
        if (filters.take != null) q.set("take", String(filters.take));
        const qs = q.toString();
        return qs ? `/reservations?${qs}` : "/reservations";
      },
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
      list: (filters?: { search?: string; cursor?: number; take?: number }) => {
        const q = new URLSearchParams();
        if (filters?.search) q.set("search", filters.search);
        if (filters?.cursor != null) q.set("cursor", String(filters.cursor));
        if (filters?.take != null) q.set("take", String(filters.take));
        const qs = q.toString();
        return qs ? `/guests?${qs}` : "/guests";
      },
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
    analytics: {
      monthlyRevenue: (year?: number) =>
        year
          ? `/analytics/revenue/monthly?year=${year}`
          : "/analytics/revenue/monthly",
      annualRevenue: () => "/analytics/revenue/annual",
      topRooms: () => "/analytics/top-rooms",
      employeeRanking: () => "/analytics/employee-ranking",
      occupancy: (year?: number) =>
        year ? `/analytics/occupancy?year=${year}` : "/analytics/occupancy",
    },
    reports: {
      monthlyRevenue: (year?: number) =>
        year
          ? `/reports/revenue/monthly?year=${year}`
          : "/reports/revenue/monthly",
      annualRevenue: () => "/reports/revenue/annual",
      topRooms: () => "/reports/top-rooms",
      employeeRanking: () => "/reports/employee-ranking",
      occupancy: (year?: number) =>
        year ? `/reports/occupancy?year=${year}` : "/reports/occupancy",
      reservations: () => "/reports/reservations",
      guests: () => "/reports/guests",
    },
    auditLogs: {
      list: (filters?: {
        tableName?: string;
        employeeId?: number;
        from?: string;
        to?: string;
        cursor?: number;
        take?: number;
      }) => {
        if (!filters) return "/audit-logs";
        const q = new URLSearchParams();
        if (filters.tableName) q.set("tableName", filters.tableName);
        if (filters.employeeId != null) {
          q.set("employeeId", String(filters.employeeId));
        }
        if (filters.from) q.set("from", filters.from);
        if (filters.to) q.set("to", filters.to);
        if (filters.cursor != null) q.set("cursor", String(filters.cursor));
        if (filters.take != null) q.set("take", String(filters.take));
        const qs = q.toString();
        return qs ? `/audit-logs?${qs}` : "/audit-logs";
      },
    },
  },
} as const;
