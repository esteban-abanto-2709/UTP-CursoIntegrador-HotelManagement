"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { routes } from "@/lib/routes";

export default function RootPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => !!state.token);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Redirigir al dashboard si está autenticado, sino al login.
    if (isAuthenticated) {
      router.replace(routes.dashboard.home());
    } else {
      router.replace(routes.login());
    }
  }, [isMounted, isAuthenticated, router]);

  // Mostrar spinner mientras hidratamos (decidiendo a dónde enviarlo)
  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Si ya montó y se ejecutó el useEffect, no renderizamos nada extra
  // porque el router.replace se encargará de sacarnos de aquí.
  return null;
}
