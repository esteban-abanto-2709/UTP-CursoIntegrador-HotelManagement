import type { Metadata } from "next";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export const metadata: Metadata = {
  title: "Lumina Resort | Dashboard",
  description: "Sistema operativo B2B de Grand Lumina Resort",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full flex flex-col overflow-hidden">
        <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-6 shadow-none">
          <SidebarTrigger className="text-zinc-500 hover:text-white transition-colors" />
          <h1 className="font-bold text-xl tracking-tight text-white">
            Dashboard
          </h1>
        </div>
        <div className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
