"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { routes } from "@/lib/routes";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => !!state.token);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Solo comprobamos la autenticación DESPUÉS de que el componente se haya montado
    // (es decir, después de que Zustand haya extraído el token de localStorage)
    if (isMounted && !isAuthenticated) {
      router.replace(routes.login());
    }
  }, [isMounted, isAuthenticated, router]);

  // Evitamos errores de hidratación en SSR y ocultamos el dashboard mientras comprobamos
  if (!isMounted || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent shadow-[0_0_15px_rgba(14,165,233,0.5)]"></div>
      </div>
    );
  }

  return <>{children}</>;
}
