"use client";

import { Search, CalendarDays, Bell, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { routes } from "@/lib/routes";

const HEADER_FEATURES = {
  search: true,
  date: true,
  notifications: true,
  newReservation: true,
} as const;

type PageMeta = { title: string; subtitle: string };

const PAGE_META: Record<string, PageMeta> = {
  "/dashboard": {
    title: "Panorama general",
    subtitle: "Resumen operativo de la hostería de montaña",
  },
  "/dashboard/rooms": {
    title: "Habitaciones",
    subtitle: "Disponibilidad y estado de las habitaciones",
  },
  "/dashboard/staff": {
    title: "Personal",
    subtitle: "Equipo, roles y turnos de la hostería",
  },
  "/dashboard/reservas": {
    title: "Reservas",
    subtitle: "Gestiona llegadas, salidas y estados de reserva",
  },
  "/dashboard/huespedes": {
    title: "Huéspedes",
    subtitle: "Directorio de huéspedes registrados",
  },
  "/dashboard/calendario": {
    title: "Calendario",
    subtitle: "Ocupación y disponibilidad en el tiempo",
  },
  "/dashboard/servicio": {
    title: "Servicio a habitación",
    subtitle: "Cargos y consumos por habitación",
  },
  "/dashboard/auditoria": {
    title: "Auditoría",
    subtitle: "Registro de actividad del sistema",
  },
};

const DEFAULT_META: PageMeta = {
  title: "Mirador",
  subtitle: "Hostería de montaña",
};

function resolveMeta(pathname: string): PageMeta {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  const match = Object.keys(PAGE_META)
    .filter((key) => key !== "/dashboard" && pathname.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_META[match] : DEFAULT_META;
}

function formatToday(): string {
  const formatted = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());
  return formatted
    .replace(/\./g, "")
    .replace(/\b([a-záéíóú])/, (c) => c.toUpperCase());
}

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const meta = resolveMeta(pathname);

  return (
    <header
      className="flex-none flex items-center gap-[18px] border-b px-[30px] py-[18px]"
      style={{
        background: "rgba(243,239,228,0.82)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottomColor: "#E6E0D1",
      }}
    >
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-[23px] font-bold leading-[1.1] tracking-[-0.02em] text-[#1E251A]"
          style={{ fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif" }}
        >
          {meta.title}
        </div>
        <div className="mt-[2px] truncate text-[13px] text-[#6E7567]">
          {meta.subtitle}
        </div>
      </div>

      {HEADER_FEATURES.search && (
        <div
          className="flex w-[240px] min-w-[150px] shrink items-center gap-[9px] rounded-[11px] px-[14px] py-[9px]"
          style={{ background: "#fff", border: "1px solid #E6E0D1" }}
        >
          <Search width={16} height={16} strokeWidth={2} className="shrink-0 text-[#9AA08F]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar huésped, reserva…"
            className="w-full border-none bg-transparent text-[13.5px] text-[#1E251A] outline-none placeholder:text-[#9AA08F]"
          />
        </div>
      )}

      {HEADER_FEATURES.date && (
        <div
          className="flex items-center gap-[7px] rounded-[11px] px-[13px] py-[9px] text-[13px] font-semibold text-[#3F463A]"
          style={{ background: "#fff", border: "1px solid #E6E0D1" }}
        >
          <CalendarDays width={16} height={16} strokeWidth={2} className="text-[#C2683E]" />
          <span className="whitespace-nowrap">{formatToday()}</span>
        </div>
      )}

      {HEADER_FEATURES.notifications && (
        <button
          type="button"
          className="relative flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px]"
          style={{ background: "#fff", border: "1px solid #E6E0D1" }}
        >
          <Bell width={18} height={18} strokeWidth={1.9} className="text-[#3F463A]" />
          <span
            className="absolute right-[10px] top-[9px] h-[7px] w-[7px] rounded-full"
            style={{ background: "#C2683E", border: "1.5px solid #fff" }}
          />
        </button>
      )}

      {HEADER_FEATURES.newReservation && (
        <button
          type="button"
          onClick={() => router.push(routes.dashboard.reservas())}
          className="flex flex-none items-center gap-[8px] whitespace-nowrap rounded-[11px] bg-[#C2683E] px-[17px] py-[11px] text-[14px] font-semibold text-white transition-colors hover:bg-[#A8552F]"
          style={{ boxShadow: "0 4px 12px rgba(168,85,47,0.28)" }}
        >
          <Plus width={17} height={17} strokeWidth={2.2} />
          Nueva reserva
        </button>
      )}
    </header>
  );
}
