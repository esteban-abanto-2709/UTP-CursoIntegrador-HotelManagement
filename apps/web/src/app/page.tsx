"use client";

import { AlertCircle, LockKeyhole, User } from "lucide-react";
// Aquí importaremos los componentes de shadcn una vez los instales, por ahora usamos HTML puro para que no rompa.

export default function LoginPage() {
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simularemos la redirección en el siguiente paso
    window.location.href = "/dashboard";
  };

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex items-center justify-center p-4">
      {/* Círculos decorativos de fondo (Glassmorphism effect) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-50"></div>

      <div className="relative w-full max-w-md bg-card backdrop-blur-2xl border border-border/50 shadow-2xl rounded-3xl p-8 py-10 animate-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl mb-4">
            <LockKeyhole className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Lumina Resort
          </h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Ingresa tus credenciales para acceder al panel operativo
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted-foreground ml-1">
              Usuario / DNI
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                required
                type="text"
                placeholder="ej: recepcion"
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted-foreground ml-1">
              Contraseña
            </label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-border/50 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-12 mt-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] shadow-md shadow-primary/20"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-primary font-medium">
            Entorno de demostración. Escribe &quot;admin&quot; o
            &quot;recepcion&quot; en el usuario para probar los distintos roles.
          </p>
        </div>
      </div>
    </div>
  );
}
