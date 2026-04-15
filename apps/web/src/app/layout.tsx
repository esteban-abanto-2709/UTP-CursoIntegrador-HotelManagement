import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import "./globals.css";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumina Resort | Dashboard",
  description: "Sistema operativo B2B de Grand Lumina Resort",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 w-full flex flex-col overflow-hidden">
            <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-6 shadow-none">
              <SidebarTrigger className="text-zinc-500 hover:text-white transition-colors" />
              <h1 className="font-bold text-xl tracking-tight text-white">
                Dashboard
              </h1>
            </div>
            <div className="flex-1 overflow-auto p-6 md:p-8">{children}</div>
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
