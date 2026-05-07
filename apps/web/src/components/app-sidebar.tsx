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
import { Calendar, Home, BedDouble, LogOut, Users } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { routes } from "@/lib/routes";

// Menu items.
const items = [
  {
    title: "Recepción (Dashboard)",
    url: "/dashboard",
    icon: Home,
    allowedRoles: ["OWNER", "MANAGER", "EMPLOYEE"],
  },
  {
    title: "Gestión de Personal",
    url: "/dashboard/staff",
    icon: Users,
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    title: "Reservas y Huéspedes",
    url: "/dashboard/reservas",
    icon: Calendar,
    allowedRoles: ["OWNER", "MANAGER", "EMPLOYEE"],
  },
  {
    title: "Servicio a la Habitación",
    url: "/dashboard/servicio",
    icon: BedDouble,
    allowedRoles: ["OWNER", "MANAGER", "EMPLOYEE"], // Podríamos restringirlo si hay rol CLEANING, etc.
  },
];

export function AppSidebar() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push(routes.login());
  };

  // Filtrar menús según el rol del usuario logueado
  const filteredItems = items.filter((item) => {
    if (!user) return false;
    return item.allowedRoles.includes(user.role);
  });

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="h-20 flex items-center gap-3 p-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-linear-to-tr from-cyan-300 via-blue-500 to-indigo-600 shadow-md shadow-primary/20 shrink-0"></div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-foreground capitalize">
                {user?.username || "Usuario"}
              </span>
              <span className="text-xs font-medium text-sky-400 capitalize">
                {user?.role || "Sin Rol"}
              </span>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link href={item.url} className="w-full">
                    <SidebarMenuButton className="transition-all text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 py-6">
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="text-base font-medium">
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Botón de Cerrar Sesión para pruebas */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="w-full transition-all text-red-500 hover:bg-red-500/10 hover:text-red-600 active:scale-95 py-6"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span className="text-base font-medium">Cerrar Sesión</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
