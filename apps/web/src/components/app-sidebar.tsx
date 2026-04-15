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
import { Calendar, Home, BedDouble } from "lucide-react";

// Menu items.
const items = [
  {
    title: "Recepción (Dashboard)",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Reservas y Huéspedes",
    url: "/reservas",
    icon: Calendar,
  },
  {
    title: "Servicio a la Habitación",
    url: "/servicio",
    icon: BedDouble,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="h-20 flex items-center gap-3 p-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-linear-to-tr from-cyan-300 via-blue-500 to-indigo-600 shadow-md shadow-primary/20 shrink-0"></div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-foreground">
                Lumina Resort
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Admin
              </span>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <a href={item.url} className="w-full">
                    <SidebarMenuButton className="transition-all text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 py-6">
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="text-base font-medium">
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </a>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
