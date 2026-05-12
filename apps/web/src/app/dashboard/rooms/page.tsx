"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Bed, Plus, Loader2 } from "lucide-react";

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

// 1. Zod Schema
const formSchema = z.object({
  number: z
    .string()
    .min(1, "El número de habitación es obligatorio")
    .regex(/^[A-Za-z0-9-]+$/, "Solo se permiten letras, números y guiones"),
  type: z.enum(["SINGLE", "DOUBLE", "SUITE"], {
    message: "Debes seleccionar un tipo válido",
  }),
});

interface RoomData {
  id: number;
  number: string;
  type: string;
  status: string;
}

export default function RoomsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  // Permitir solo a ADMIN, OWNER o MANAGER crear cuartos
  const canCreateRooms =
    currentUser?.role === "ADMIN" || currentUser?.role === "OWNER" || currentUser?.role === "MANAGER";

  const fetchRooms = useCallback(async () => {
    try {
      setIsLoadingRooms(true);
      const response = await api.get(routes.api.rooms.list());
      setRooms(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar el inventario de habitaciones.");
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      number: "",
      type: "SINGLE", // Valor inicial
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      await api.post(routes.api.rooms.create(), values);

      toast.success("Habitación creada exitosamente");
      form.reset();
      setIsOpen(false);
      fetchRooms(); // Refrescar la lista
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string | string[] } };
      };
      const rawMessage = err.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage[0]
        : rawMessage || "Error al crear la habitación.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
            DISPONIBLE
          </span>
        );
      case "OCCUPIED":
        return (
          <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
            OCUPADA
          </span>
        );
      case "CLEANING":
        return (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
            LIMPIEZA
          </span>
        );
      case "MAINTENANCE":
        return (
          <span className="inline-flex items-center rounded-full bg-zinc-500/10 px-2 py-1 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-zinc-500/20">
            MANTENIMIENTO
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const getTypeTranslation = (type: string) => {
    const types: Record<string, string> = {
      SINGLE: "Sencilla",
      DOUBLE: "Doble",
      SUITE: "Suite",
    };
    return types[type] || type;
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bed className="h-8 w-8 text-sky-500" />
            Configuración de Habitaciones
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestión administrativa del inventario físico (Altas y Bajas).
          </p>
        </div>

        {/* Botón de Creación (Protegido) */}
        {canCreateRooms && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-sky-500 hover:bg-sky-400 text-white font-semibold shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all hover:shadow-[0_0_25px_rgba(14,165,233,0.5)]">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Habitación
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#12151C] border border-white/10 sm:max-w-md shadow-2xl">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl text-white">
                  Registrar Habitación
                </DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Añade un nuevo cuarto al inventario del hotel. Su estado será
                  &quot;Disponible&quot; por defecto.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">
                          Número o Nombre
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ej: 101, 102A, VIP-1"
                            className="bg-zinc-950/50 border-white/10 text-white focus-visible:ring-sky-500 uppercase"
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
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">
                          Tipo de Habitación
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-zinc-950/50 border-white/10 text-white focus-visible:ring-sky-500">
                              <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#1a1f2b] border-white/10 text-white">
                            <SelectItem
                              value="SINGLE"
                              className="focus:bg-sky-500/20 focus:text-white cursor-pointer"
                            >
                              Sencilla (Single)
                            </SelectItem>
                            <SelectItem
                              value="DOUBLE"
                              className="focus:bg-sky-500/20 focus:text-white cursor-pointer"
                            >
                              Doble (Double)
                            </SelectItem>
                            <SelectItem
                              value="SUITE"
                              className="focus:bg-sky-500/20 focus:text-white cursor-pointer"
                            >
                              Suite
                            </SelectItem>
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
                        "Guardar Habitación"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabla Base */}
      <div className="rounded-xl border border-white/5 bg-[#12151C] overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-zinc-900/50">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-zinc-400 font-semibold w-[100px]">
                N°
              </TableHead>
              <TableHead className="text-zinc-400 font-semibold">Tipo</TableHead>
              <TableHead className="text-zinc-400 font-semibold">
                Estado Físico
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingRooms ? (
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableCell
                  colSpan={3}
                  className="h-32 text-center text-zinc-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                    <span>Cargando habitaciones...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : rooms.length === 0 ? (
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableCell
                  colSpan={3}
                  className="h-32 text-center text-zinc-500 font-medium"
                >
                  No hay habitaciones registradas. Haz clic en "Nueva Habitación"
                  para empezar el setup.
                </TableCell>
              </TableRow>
            ) : (
              rooms.map((room) => (
                <TableRow
                  key={room.id}
                  className="border-white/5 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="font-medium text-white text-lg">
                    {room.number}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {getTypeTranslation(room.type)}
                  </TableCell>
                  <TableCell>{getStatusBadge(room.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
