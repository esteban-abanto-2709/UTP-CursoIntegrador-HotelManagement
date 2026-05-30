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

const formSchema = z.object({
  number: z
    .string()
    .min(1, "El número de habitación es obligatorio")
    .regex(/^[A-Za-z0-9-]+$/, "Solo se permiten letras, números y guiones"),
  type: z.enum(["SINGLE", "DOUBLE", "SUITE"], {
    message: "Debes seleccionar un tipo válido",
  }),
  price: z
    .string()
    .min(1, "El precio es obligatorio")
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) > 0,
      "El precio por noche debe ser mayor a 0",
    ),
});

interface RoomData {
  id: number;
  number: string;
  type: string;
  status: string;
  price: string;
}

export default function RoomsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  const canCreateRooms =
    currentUser?.role === "OWNER" || currentUser?.role === "MANAGER";

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
      type: "SINGLE",
      price: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      await api.post(routes.api.rooms.create(), {
        ...values,
        price: Number(values.price),
      });

      toast.success("Habitación creada exitosamente");
      form.reset();
      setIsOpen(false);
      fetchRooms();
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
          <span className="inline-flex items-center rounded-full bg-status-available-bg px-2 py-1 text-xs font-medium text-status-available-text ring-1 ring-inset ring-status-available-border">
            DISPONIBLE
          </span>
        );
      case "OCCUPIED":
        return (
          <span className="inline-flex items-center rounded-full bg-status-occupied-bg px-2 py-1 text-xs font-medium text-status-occupied-text ring-1 ring-inset ring-status-occupied-border">
            OCUPADA
          </span>
        );
      case "CLEANING":
        return (
          <span className="inline-flex items-center rounded-full bg-status-cleaning-bg px-2 py-1 text-xs font-medium text-status-cleaning-text ring-1 ring-inset ring-status-cleaning-border">
            LIMPIEZA
          </span>
        );
      case "MAINTENANCE":
        return (
          <span className="inline-flex items-center rounded-full bg-status-maintenance-bg px-2 py-1 text-xs font-medium text-status-maintenance-text ring-1 ring-inset ring-status-maintenance-border">
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
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bed className="h-8 w-8 text-primary" />
            Configuración de Habitaciones
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestión administrativa del inventario físico (Altas y Bajas).
          </p>
        </div>

        {canCreateRooms && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger
              render={
                <Button className="bg-primary hover:bg-primary/80 text-primary-foreground font-semibold shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all hover:shadow-[0_0_25px_rgba(14,165,233,0.5)]" />
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Habitación
            </DialogTrigger>
            <DialogContent className="bg-card border border-border sm:max-w-md shadow-2xl">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl text-foreground">
                  Registrar Habitación
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
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
                        <FormLabel className="text-muted-foreground">
                          Número o Nombre
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ej: 101, 102A, VIP-1"
                            className="bg-background border-border text-foreground focus-visible:ring-primary uppercase"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-destructive text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">
                          Tipo de Habitación
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground focus-visible:ring-primary">
                              <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover border-border text-popover-foreground">
                            <SelectItem
                              value="SINGLE"
                              className="focus:bg-primary/20 focus:text-foreground cursor-pointer"
                            >
                              Sencilla (Single)
                            </SelectItem>
                            <SelectItem
                              value="DOUBLE"
                              className="focus:bg-primary/20 focus:text-foreground cursor-pointer"
                            >
                              Doble (Double)
                            </SelectItem>
                            <SelectItem
                              value="SUITE"
                              className="focus:bg-primary/20 focus:text-foreground cursor-pointer"
                            >
                              Suite
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-destructive text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">
                          Precio por noche (S/.)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="ej: 120.00"
                            className="bg-background border-border text-foreground focus-visible:ring-primary"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-destructive text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all"
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
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-semibold w-[100px]">
                N°
              </TableHead>
              <TableHead className="text-muted-foreground font-semibold">
                Tipo
              </TableHead>
              <TableHead className="text-muted-foreground font-semibold">
                Precio / noche
              </TableHead>
              <TableHead className="text-muted-foreground font-semibold">
                Estado Físico
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingRooms ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Cargando habitaciones...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : rooms.length === 0 ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-muted-foreground font-medium"
                >
                  No hay habitaciones registradas. Haz clic en &quot;Nueva
                  Habitación&quot; para empezar el setup.
                </TableCell>
              </TableRow>
            ) : (
              rooms.map((room) => (
                <TableRow
                  key={room.id}
                  className="border-border hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium text-foreground text-lg">
                    {room.number}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getTypeTranslation(room.type)}
                  </TableCell>
                  <TableCell className="text-foreground font-medium">
                    S/. {Number(room.price).toFixed(2)}
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
