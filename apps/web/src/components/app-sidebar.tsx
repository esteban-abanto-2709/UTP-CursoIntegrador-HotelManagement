"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Calendar,
  CalendarRange,
  Home,
  BedDouble,
  LogOut,
  Users,
  Bed,
  Contact,
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
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="h-auto flex items-center gap-3 p-3 mb-4 rounded-xl bg-muted/40 border border-border/50">
            <div className="w-11 h-11 rounded-full bg-linear-to-tr from-cyan-300 via-blue-500 to-indigo-600 shadow-md shadow-primary/20 shrink-0 flex items-center justify-center text-white text-sm font-bold">
              {getInitials(displayName)}
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-sm font-bold text-foreground capitalize truncate">
                {displayName}
              </span>
              <span className="text-xs font-medium text-sky-400">
                {roleLabel}
              </span>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {filteredItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <Link href={item.url} className="w-full">
                      <SidebarMenuButton
                        isActive={isActive}
                        className={`transition-all active:scale-95 py-6 ${
                          isActive
                            ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="text-base">{item.title}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <div className="border-t border-border/50 pt-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 font-semibold text-sm transition-all hover:bg-red-500/10 hover:border-red-500/40 active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
