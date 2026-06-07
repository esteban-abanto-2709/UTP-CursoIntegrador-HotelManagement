"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { routes } from "@/lib/routes";
import { Lock, User, AlertCircle, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres"),
});

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const response = await api.post(routes.api.auth.login(), values);
      const { access_token, user } = response.data;

      setAuth(user, access_token);
      toast.success("¡Bienvenido a Lumina Resort!");
      router.push(routes.dashboard.home());
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string | string[] } };
      };
      const rawMessage = err.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage[0]
        : rawMessage || "Credenciales inválidas. Intenta nuevamente.";

      setErrorMsg(message);
      toast.error(message);

      form.reset({ username: "", password: "" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-[0_0_15px_rgba(14,165,233,0.15)]">
            <Lock className="h-6 w-6 text-primary" strokeWidth={2.5} />
          </div>
          <h1 className="mb-2 text-2xl font-serif font-bold text-foreground tracking-wide">
            Lumina Resort
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tus credenciales para acceder al panel operativo
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground">
                    Usuario
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="h-12 rounded-xl border-border bg-background pl-11 text-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                        {...field}
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground">
                    Contraseña
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="h-12 rounded-xl border-border bg-background pl-11 pr-11 text-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                        {...field}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="mt-2 h-12 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground hover:bg-primary/80 shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all hover:shadow-[0_0_25px_rgba(14,165,233,0.5)]"
              disabled={isLoading}
            >
              {isLoading ? "Verificando..." : "Iniciar Sesión"}
            </Button>
          </form>
        </Form>

        <div className="mt-4">
          {(form.formState.errors.username?.message ||
            form.formState.errors.password?.message ||
            errorMsg) && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">
                {(form.formState.errors.username?.message as string) ||
                  (form.formState.errors.password?.message as string) ||
                  errorMsg}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
