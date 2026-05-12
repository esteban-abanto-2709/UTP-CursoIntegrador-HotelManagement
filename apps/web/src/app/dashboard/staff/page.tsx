"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { UserPlus, Users, Loader2 } from "lucide-react";

import api from "@/lib/axios";
import { routes } from "@/lib/routes";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserData {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

const formSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["MANAGER", "EMPLOYEE"], {
    message: "Debes seleccionar un rol válido",
  }),
});

export default function StaffPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Función para cargar los usuarios
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const response = await api.get(routes.api.users.list());
      setUsers(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar la lista de personal.");
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Cargar usuarios al entrar a la página
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Determinar qué roles puede crear el usuario actual
  const getAvailableRoles = () => {
    if (currentUser?.role === "OWNER") {
      return [
        { value: "MANAGER", label: "Gerente (Manager)" },
        { value: "EMPLOYEE", label: "Empleado Operativo" },
      ];
    }
    if (currentUser?.role === "MANAGER") {
      return [{ value: "EMPLOYEE", label: "Empleado Operativo" }];
    }
    return [];
  };

  const availableRoles = getAvailableRoles();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      role:
        availableRoles.length === 1
          ? (availableRoles[0].value as "MANAGER" | "EMPLOYEE")
          : undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      await api.post(routes.api.users.create(), values);

      toast.success("Usuario creado exitosamente");
      form.reset();
      setIsOpen(false);

      // Refrescar la tabla para mostrar el nuevo usuario instantáneamente
      fetchUsers();
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string | string[] } };
      };
      const rawMessage = err.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage[0]
        : rawMessage || "Error al crear usuario.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Helper para pintar el badge de rol con diferentes colores
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return (
          <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
            PROPIETARIO
          </span>
        );
      case "MANAGER":
        return (
          <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-400 ring-1 ring-inset ring-purple-500/20">
            GERENTE
          </span>
        );
      case "EMPLOYEE":
        return (
          <span className="inline-flex items-center rounded-full bg-sky-500/10 px-2 py-1 text-xs font-medium text-sky-400 ring-1 ring-inset ring-sky-500/20">
            EMPLEADO
          </span>
        );
      default:
        return <span>{role}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="h-8 w-8 text-sky-500" />
            Gestión de Personal
          </h2>
          <p className="text-muted-foreground mt-1">
            Administra los accesos y roles del equipo del hotel.
          </p>
        </div>

        {/* Modal Flotante (Dialog) para Crear Usuario */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger
            render={
              <Button className="bg-sky-500 hover:bg-sky-400 text-white font-semibold shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all hover:shadow-[0_0_25px_rgba(14,165,233,0.5)]" />
            }
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </DialogTrigger>
          <DialogContent className="bg-[#12151C] border border-white/10 sm:max-w-md shadow-2xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl text-white">
                Registrar Personal
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Crea un nuevo usuario para el sistema. El rol determinará a qué
                módulos podrá acceder.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">
                        Usuario / DNI
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ej: juanperez o 74839210"
                          className="bg-zinc-950/50 border-white/10 text-white focus-visible:ring-sky-500"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">
                        Contraseña Temporal
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          className="bg-zinc-950/50 border-white/10 text-white focus-visible:ring-sky-500"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">
                        Nivel de Acceso (Rol)
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting || availableRoles.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-zinc-950/50 border-white/10 text-white focus-visible:ring-sky-500">
                            <SelectValue placeholder="Selecciona un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#1a1f2b] border-white/10 text-white">
                          {availableRoles.map((role) => (
                            <SelectItem
                              key={role.value}
                              value={role.value}
                              className="focus:bg-sky-500/20 focus:text-white cursor-pointer"
                            >
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Crear Cuenta"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla Dinámica */}
      <div className="rounded-xl border border-white/5 bg-[#12151C] overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-zinc-900/50">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-zinc-400 font-semibold">
                Usuario
              </TableHead>
              <TableHead className="text-zinc-400 font-semibold">Rol</TableHead>
              <TableHead className="text-zinc-400 font-semibold">
                Fecha de Creación
              </TableHead>
              <TableHead className="text-zinc-400 font-semibold text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingUsers ? (
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-zinc-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                    <span>Cargando personal...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-zinc-500 font-medium"
                >
                  No se encontraron usuarios en el sistema.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow
                  key={u.id}
                  className="border-white/5 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="font-medium text-white">
                    {u.username}
                  </TableCell>
                  <TableCell>{getRoleBadge(u.role)}</TableCell>
                  <TableCell className="text-zinc-400">
                    {new Date(u.createdAt).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 hover:bg-white/10 hover:text-white"
                      disabled
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
