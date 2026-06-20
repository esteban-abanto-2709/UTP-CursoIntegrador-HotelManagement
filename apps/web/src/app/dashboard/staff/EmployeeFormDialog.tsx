"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAuthStore } from "@/store/authStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// En edición la contraseña es opcional (vacía = mantener la actual); en alta es obligatoria
function buildSchema(isEdit: boolean) {
  return z
    .object({
      username: z.string().min(3, "Mínimo 3 caracteres"),
      password: isEdit
        ? z
            .string()
            .refine((v) => v === "" || v.length >= 8, "Mínimo 8 caracteres")
        : z.string().min(8, "Mínimo 8 caracteres"),
      confirmPassword: z.string(),
      dni: z.string().min(8, "Mínimo 8 caracteres").max(12, "Máximo 12 caracteres"),
      nombres: z.string().min(2, "Campo requerido"),
      apellidoPaterno: z.string().min(2, "Campo requerido"),
      apellidoMaterno: z.string().min(2, "Campo requerido"),
      fechaNacimiento: z.string().min(1, "Campo requerido"),
      cargo: z.string().min(1, "Selecciona un cargo"),
      turno: z.string().min(1, "Selecciona un turno"),
      fechaInicio: z.string().min(1, "Campo requerido"),
      telefono: z.string().min(9, "Mínimo 9 dígitos"),
      email: z.string().email("Correo inválido"),
      direccion: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Las contraseñas no coinciden",
      path: ["confirmPassword"],
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export interface EmployeeDetail {
  id: number;
  username: string;
  role: string;
  dni: string | null;
  nombres: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  fechaNacimiento: string | null;
  cargo: string | null;
  turno: string | null;
  fechaInicio: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
}

const ALL_CARGOS = ["Manager", "Recepcionista", "Botones", "Limpieza"] as const;

const TURNOS = [
  { value: "MAÑANA", label: "Mañana (6:00 am – 2:00 pm)" },
  { value: "TARDE", label: "Tarde (2:00 pm – 10:00 pm)" },
  { value: "NOCHE", label: "Noche (10:00 pm – 6:00 am)" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  employee?: EmployeeDetail | null;
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  onSuccess,
  employee = null,
}: Props) {
  const currentUser = useAuthStore((state) => state.user);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = employee !== null;

  // MANAGERs no pueden crear otro Manager
  const cargos = currentUser?.role === "MANAGER"
    ? ALL_CARGOS.filter((c) => c !== "Manager")
    : ALL_CARGOS;

  const schema = useMemo(() => buildSchema(isEdit), [isEdit]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: employee?.username ?? "",
      password: "",
      confirmPassword: "",
      dni: employee?.dni ?? "",
      nombres: employee?.nombres ?? "",
      apellidoPaterno: employee?.apellidoPaterno ?? "",
      apellidoMaterno: employee?.apellidoMaterno ?? "",
      fechaNacimiento: employee?.fechaNacimiento?.split("T")[0] ?? "",
      cargo: employee?.cargo ?? "",
      turno: employee?.turno ?? "",
      fechaInicio: employee?.fechaInicio?.split("T")[0] ?? "",
      telefono: employee?.telefono ?? "",
      email: employee?.email ?? "",
      direccion: employee?.direccion ?? "",
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) form.reset();
    onOpenChange(next);
  }

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...payload } = values;

      if (isEdit && employee) {
        // En edición, no enviamos la contraseña si quedó en blanco (mantiene la actual)
        const editPayload: Partial<typeof payload> = { ...payload };
        if (!editPayload.password) delete editPayload.password;
        await api.patch(routes.api.employees.update(employee.id), editPayload);
        toast.success("Empleado actualizado exitosamente.");
      } else {
        await api.post(routes.api.employees.create(), payload);
        toast.success("Empleado registrado exitosamente.");
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Error al guardar el empleado."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isEdit ? "Editar Empleado" : "Ficha de Empleado"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los datos del colaborador. Deja la contraseña en blanco para mantener la actual."
              : "Completa los datos personales y laborales del nuevo colaborador."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-1">

            {/* ── Acceso al Sistema ────────────────────────── */}
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Acceso al Sistema
              </p>

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl>
                      <Input disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="pr-10"
                            disabled={isSubmitting}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirm ? "text" : "password"}
                            className="pr-10"
                            disabled={isSubmitting}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                          >
                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <div className="border-t" />

            {/* ── Información Personal ─────────────────────── */}
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Información Personal
              </p>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dni"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DNI / Documento</FormLabel>
                      <FormControl>
                        <Input disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fechaNacimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Nacimiento</FormLabel>
                      <FormControl>
                        <Input type="date" className="[color-scheme:light]" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="nombres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombres</FormLabel>
                    <FormControl>
                      <Input disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="apellidoPaterno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido Paterno</FormLabel>
                      <FormControl>
                        <Input disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apellidoMaterno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido Materno</FormLabel>
                      <FormControl>
                        <Input disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <div className="border-t" />

            {/* ── Información Laboral ──────────────────────── */}
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Información Laboral
              </p>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo / Puesto</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona un cargo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cargos.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="turno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turno</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona un turno" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TURNOS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fechaInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Inicio</FormLabel>
                      <FormControl>
                        <Input type="date" className="[color-scheme:light]" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <div className="border-t" />

            {/* ── Contacto ─────────────────────────────────── */}
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Contacto
              </p>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input type="email" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : isEdit ? (
                "Guardar Cambios"
              ) : (
                "Registrar Empleado"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
