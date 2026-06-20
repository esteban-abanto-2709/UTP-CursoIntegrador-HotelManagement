import type { Metadata } from "next";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { ProtectedRoute } from "@/components/protected-route";

export const metadata: Metadata = {
  title: "Mirador Hotel Suite | Dashboard",
  description: "Sistema operativo B2B de Mirador Hotel Suite",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <main className="flex-1 w-full flex flex-col overflow-hidden">
          <DashboardHeader />
          <div className="flex-1 overflow-auto p-6 md:p-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
