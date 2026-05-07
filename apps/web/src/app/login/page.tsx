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
import { Lock, User, Info, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    } catch (error: any) {
      // Extraemos el mensaje de la API, asegurándonos de que sea un string
      // (a veces NestJS devuelve un array de errores de validación)
      const rawMessage = error.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage[0]
        : rawMessage || "Credenciales inválidas. Intenta nuevamente.";

      setErrorMsg(message);
      toast.error(message);

      // Limpiamos AMBOS campos como pediste
      form.reset({ username: "", password: "" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] p-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-white/5 bg-[#12151C] p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/10 shadow-[0_0_15px_rgba(14,165,233,0.15)]">
            <Lock className="h-6 w-6 text-sky-500" strokeWidth={2.5} />
          </div>
          <h1 className="mb-2 text-2xl font-serif font-bold text-white tracking-wide">
            Lumina Resort
          </h1>
          <p className="text-sm text-zinc-400">
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
                  <FormLabel className="text-sm font-semibold text-zinc-300">
                    Usuario
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                      <Input
                        className="h-12 rounded-xl border-white/5 bg-[#090B0F] pl-11 text-white focus-visible:border-sky-500 focus-visible:ring-1 focus-visible:ring-sky-500"
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
                  <FormLabel className="text-sm font-semibold text-zinc-300">
                    Contraseña
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                      <Input
                        type="password"
                        className="h-12 rounded-xl border-white/5 bg-[#090B0F] pl-11 text-white focus-visible:border-sky-500 focus-visible:ring-1 focus-visible:ring-sky-500"
                        {...field}
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="mt-2 h-12 w-full rounded-xl bg-sky-500 text-base font-bold text-white hover:bg-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all hover:shadow-[0_0_25px_rgba(14,165,233,0.5)]"
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
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
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
