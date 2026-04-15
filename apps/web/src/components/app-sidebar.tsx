import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Calendar, Home, BedDouble } from "lucide-react"

// Menu items.
const items = [
  {
    title: "Recepción (Dashboard)",
    url: "/",
    icon: Home,
  },
  {
    title: "Reservas y Huéspedes",
    url: "/reservas",
    icon: Calendar,
  },
  {
    title: "Limpieza",
    url: "/limpieza",
    icon: BedDouble,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold tracking-tight text-primary p-4">Hotel PMS B2B</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <a href={item.url} className="w-full">
                    <SidebarMenuButton className="transition-all hover:bg-primary/5 hover:text-primary active:scale-95">
                      <item.icon className="w-5 h-5 mr-3"/>
                      <span className="text-base font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </a>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
