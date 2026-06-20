"use client";

import {
  Calendar,
  CalendarRange,
  Home,
  BedDouble,
  Users,
  Bed,
  Contact,
  BarChart3,
  Wallet,
  ChevronsUpDown,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { routes } from "@/lib/routes";

const items = [
  {
    title: "Recepción",
    url: routes.dashboard.home(),
    icon: Home,
    allowedRoles: ["OWNER", "MANAGER", "EMPLOYEE"],
  },
  {
    title: "Habitaciones",
    url: routes.dashboard.rooms(),
    icon: Bed,
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    title: "Personal",
    url: routes.dashboard.staff(),
    icon: Users,
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    title: "Reservas",
    url: routes.dashboard.reservas(),
    icon: Calendar,
    allowedRoles: ["OWNER", "MANAGER", "EMPLOYEE"],
  },
  {
    title: "Huéspedes",
    url: routes.dashboard.huespedes(),
    icon: Contact,
    allowedRoles: ["OWNER", "MANAGER", "EMPLOYEE"],
  },
  {
    title: "Calendario",
    url: routes.dashboard.calendario(),
    icon: CalendarRange,
    allowedRoles: ["OWNER", "MANAGER", "EMPLOYEE"],
  },
  {
    title: "Servicio a Habitación",
    url: routes.dashboard.servicio(),
    icon: BedDouble,
    allowedRoles: ["OWNER", "MANAGER", "EMPLOYEE"],
  },
  {
    title: "Finanzas",
    url: routes.dashboard.finanzas(),
    icon: Wallet,
    allowedRoles: ["OWNER"],
  },
  {
    title: "Analíticas",
    url: routes.dashboard.analiticas(),
    icon: BarChart3,
    allowedRoles: ["OWNER"],
  },
];

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propietario",
  MANAGER: "Gerente",
  EMPLOYEE: "Empleado",
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AppSidebar() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push(routes.login());
  };

  const fullName = [user?.nombres, user?.apellidoPaterno]
    .filter(Boolean)
    .join(" ");
  const displayName = fullName || user?.username || "Usuario";
  const roleLabel = user ? ROLE_LABELS[user.role] ?? user.role : "Sin rol";

  const filteredItems = items.filter((item) => {
    if (!user) return false;
    return item.allowedRoles.includes(user.role);
  });

  return (
    <aside
      className="relative flex w-[248px] flex-none flex-col overflow-hidden"
      style={{ background: "linear-gradient(180deg,#173021 0%,#102017 100%)" }}
    >
      <svg
        viewBox="0 0 248 260"
        preserveAspectRatio="none"
        className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-full opacity-[0.16]"
      >
        <g fill="none" stroke="#C2683E" strokeWidth="1.2">
          <path d="M-20,210 C40,170 90,250 150,200 C200,160 240,210 280,180" />
          <path d="M-20,235 C40,195 90,275 150,225 C200,185 240,235 280,205" />
          <path d="M-20,185 C40,145 90,225 150,175 C200,135 240,185 280,155" />
        </g>
        <g fill="none" stroke="#7FA88A" strokeWidth="1">
          <path d="M-20,160 C40,120 90,200 150,150 C200,110 240,160 280,130" />
          <path d="M-20,135 C40,95 90,175 150,125 C200,85 240,135 280,105" />
        </g>
      </svg>

      <div className="flex items-center gap-[11px] px-[22px] pb-[18px] pt-[22px]">
        <div
          className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px]"
          style={{
            background: "linear-gradient(150deg,#C2683E,#A8552F)",
            boxShadow: "0 4px 12px rgba(168,85,47,0.35)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="16.5" cy="7" r="2.6" fill="#F6E2C8" />
            <path d="M2 19 L8.5 9 L13 15.5 L16 11 L22 19 Z" fill="#FBF6ED" />
          </svg>
        </div>
        <div>
          <div
            className="text-[19px] font-extrabold leading-none tracking-[-0.02em] text-[#FBF6ED]"
            style={{ fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif" }}
          >
            Mirador
          </div>
          <div className="mt-[3px] text-[10.5px] uppercase tracking-[0.16em] text-[#7E9683]">
            Hotel Suite
          </div>
        </div>
      </div>

      <div className="mx-2 mb-2 mt-2 px-[14px] pt-[6px] text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#5E7563]">
        Operación
      </div>

      <nav className="relative z-[1] flex flex-col gap-[3px] px-[14px]">
        {filteredItems.map((item) => {
          const isActive = pathname === item.url;
          return (
            <Link
              key={item.title}
              href={item.url}
              className={`flex w-full items-center gap-[12px] rounded-[11px] px-[13px] py-[10px] text-[14px] font-semibold transition-colors ${
                isActive
                  ? "bg-[#25402E] text-[#FBF6ED]"
                  : "text-[#9DB0A1] hover:bg-[#1c3324] hover:text-[#FBF6ED]"
              }`}
            >
              <item.icon width={18} height={18} strokeWidth={1.9} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="relative z-[2] mt-auto p-[14px]">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-[11px] rounded-[14px] border border-white/[0.08] bg-white/[0.06] p-[11px] text-left transition-colors hover:bg-white/[0.1]"
        >
          <div
            className="flex h-[36px] w-[36px] flex-none items-center justify-center rounded-[10px] text-[14px] font-bold text-white"
            style={{ background: "#3C7A8A" }}
          >
            {getInitials(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-semibold capitalize text-[#EFE9DC]">
              {displayName}
            </div>
            <div className="text-[11.5px] text-[#7E9683]">{roleLabel}</div>
          </div>
          <ChevronsUpDown width={16} height={16} strokeWidth={2} color="#7E9683" />
        </button>
      </div>
    </aside>
  );
}
