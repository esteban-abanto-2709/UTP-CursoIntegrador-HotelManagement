"use client";

import { useState, useEffect, useCallback, useMemo, type ComponentType } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Pencil,
  LayoutGrid,
  List,
  Check,
  User,
  Sparkles,
  Wrench,
} from "lucide-react";

import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import { getRoomTypeLabel } from "@/lib/room";
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
import { PaginationControls } from "@/components/ui/pagination-controls";

const PAGE_SIZE = 20;

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

type StatusKey = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";

interface StatusMeta {
  label: string;
  bg: string;
  fg: string;
  accent: string;
  dot: string;
  Icon: ComponentType<{ className?: string }>;
}

const STATUS_META: Record<StatusKey, StatusMeta> = {
  AVAILABLE: { label: "Disponible", bg: "#E3EDE0", fg: "#2C5638", accent: "#3C7A4E", dot: "#3C7A4E", Icon: Check },
  OCCUPIED: { label: "Ocupada", bg: "#F2E2DA", fg: "#9A4226", accent: "#C2683E", dot: "#C2683E", Icon: User },
  CLEANING: { label: "Limpieza", bg: "#DCEAEC", fg: "#27545F", accent: "#3C7A8A", dot: "#3C7A8A", Icon: Sparkles },
  MAINTENANCE: { label: "Mantenim.", bg: "#F6ECD3", fg: "#876215", accent: "#C2932F", dot: "#C2932F", Icon: Wrench },
};

const FILTER_KEYS = [
  { key: "todas" as const, label: "Todas", dot: "#9AA08F" },
  { key: "AVAILABLE" as const, label: "Disponible", dot: STATUS_META.AVAILABLE.dot },
  { key: "OCCUPIED" as const, label: "Ocupada", dot: STATUS_META.OCCUPIED.dot },
  { key: "CLEANING" as const, label: "Limpieza", dot: STATUS_META.CLEANING.dot },
  { key: "MAINTENANCE" as const, label: "Mantenim.", dot: STATUS_META.MAINTENANCE.dot },
];

const bricolage = "var(--font-bricolage)";

function getStatusMeta(status: string): StatusMeta {
  return STATUS_META[status as StatusKey] ?? STATUS_META.AVAILABLE;
}

function formatRate(price: string): string {
  return `S/ ${Number(price).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function StatusPill({ meta }: { meta: StatusMeta }) {
  const { Icon } = meta;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
      style={{ background: meta.bg, color: meta.fg }}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {meta.label}
    </span>
  );
}

export default function RoomsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [cursorStack, setCursorStack] = useState<(number | null)[]>([null]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  // Habitación en edición; null = el diálogo está en modo "crear"
  const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("todas");
  const [roomView, setRoomView] = useState<"grid" | "list">("grid");

  const canCreateRooms =
    currentUser?.role === "OWNER" || currentUser?.role === "MANAGER";

  const cursor = cursorStack[cursorStack.length - 1];

  const fetchRooms = useCallback(async () => {
    try {
      setIsLoadingRooms(true);
      const response = await api.get(
        routes.api.rooms.list({ cursor: cursor ?? undefined, take: PAGE_SIZE }),
      );
      setRooms(response.data.data);
      setTotal(response.data.total);
      setNextCursor(response.data.nextCursor);
      setHasNext(response.data.hasNext);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar el inventario de habitaciones.");
    } finally {
      setIsLoadingRooms(false);
    }
  }, [cursor]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Conteos y filtrado sobre la página cargada (filtrado en cliente).
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { todas: rooms.length };
    for (const room of rooms) {
      counts[room.status] = (counts[room.status] ?? 0) + 1;
    }
    return counts;
  }, [rooms]);

  const visibleRooms = useMemo(
    () =>
      statusFilter === "todas"
        ? rooms
        : rooms.filter((room) => room.status === statusFilter),
    [rooms, statusFilter],
  );

  const handleNextPage = () => {
    if (hasNext && nextCursor != null) {
      setCursorStack((s) => [...s, nextCursor]);
    }
  };

  const handlePrevPage = () => {
    setCursorStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      number: "",
      type: "SINGLE",
      price: "",
    },
  });

  const openCreate = () => {
    setEditingRoom(null);
    form.reset({ number: "", type: "SINGLE", price: "" });
    setIsOpen(true);
  };

  const openEdit = (room: RoomData) => {
    setEditingRoom(room);
    form.reset({
      number: room.number,
      type: room.type as "SINGLE" | "DOUBLE" | "SUITE",
      price: String(room.price),
    });
    setIsOpen(true);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      const payload = { ...values, price: Number(values.price) };

      if (editingRoom) {
        await api.patch(routes.api.rooms.update(editingRoom.id), payload);
        toast.success("Habitación actualizada exitosamente");
      } else {
        await api.post(routes.api.rooms.create(), payload);
        toast.success("Habitación creada exitosamente");
      }

      form.reset();
      setIsOpen(false);
      setEditingRoom(null);
      fetchRooms();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Error al guardar la habitación."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const colSpan = canCreateRooms ? 5 : 4;

  return (
    <div
      className="-m-6 md:-m-8 min-h-[calc(100%+3rem)] md:min-h-[calc(100%+4rem)]"
      style={{ background: "#F3EFE4", color: "#1E251A", fontFamily: "var(--font-hanken)" }}
    >
      <div className="flex flex-col gap-[18px] p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Leyenda + filtros + toggle + acción */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex flex-wrap gap-1.5 rounded-xl p-1.5"
            style={{ background: "#fff", border: "1px solid #E6E0D1" }}
          >
            {FILTER_KEYS.map((chip) => {
              const active = statusFilter === chip.key;
              const count = filterCounts[chip.key] ?? 0;
              return (
                <button
                  key={chip.key}
                  onClick={() => setStatusFilter(chip.key)}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors"
                  style={{
                    background: active ? "#173021" : "transparent",
                    color: active ? "#FBF6ED" : "#6E7567",
                  }}
                >
                  {chip.key !== "todas" && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: chip.dot }}
                    />
                  )}
                  <span>{chip.label}</span>
                  <span
                    className="rounded-full px-1.5 py-px text-[11px] font-bold"
                    style={{
                      background: active ? "rgba(255,255,255,0.18)" : "#EFEADB",
                      color: active ? "#EFE9DC" : "#9AA08F",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          {/* Toggle cuadrícula / lista */}
          <div
            className="flex gap-1 rounded-[10px] p-1"
            style={{ background: "#fff", border: "1px solid #E6E0D1" }}
          >
            {([
              { key: "grid" as const, label: "Cuadrícula", Icon: LayoutGrid },
              { key: "list" as const, label: "Lista", Icon: List },
            ]).map(({ key, label, Icon }) => {
              const active = roomView === key;
              return (
                <button
                  key={key}
                  onClick={() => setRoomView(key)}
                  className="flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
                  style={{
                    background: active ? "#173021" : "transparent",
                    color: active ? "#fff" : "#9AA08F",
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          {canCreateRooms && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold text-white whitespace-nowrap transition-colors"
              style={{ background: "#C2683E", boxShadow: "0 4px 12px rgba(168,85,47,0.28)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#A8552F")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#C2683E")}
            >
              <Plus className="h-4 w-4" />
              Nueva habitación
            </button>
          )}
        </div>

        {/* Estados de carga / vacío */}
        {isLoadingRooms ? (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-2xl py-20"
            style={{ background: "#fff", border: "1px solid #E6E0D1", color: "#9AA08F" }}
          >
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#C2683E" }} />
            <span>Cargando habitaciones...</span>
          </div>
        ) : visibleRooms.length === 0 ? (
          <div
            className="rounded-2xl py-20 text-center text-sm font-medium"
            style={{ background: "#fff", border: "1px solid #E6E0D1", color: "#9AA08F" }}
          >
            {rooms.length === 0
              ? "No hay habitaciones registradas en esta página."
              : "Ninguna habitación coincide con el filtro seleccionado."}
          </div>
        ) : roomView === "grid" ? (
          /* Cuadrícula */
          <div
            className="grid gap-3.5"
            style={{ gridTemplateColumns: "repeat(auto-fill,minmax(228px,1fr))" }}
          >
            {visibleRooms.map((room) => {
              const meta = getStatusMeta(room.status);
              return (
                <div
                  key={room.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: "#fff",
                    border: "1px solid #E6E0D1",
                    borderLeft: `4px solid ${meta.accent}`,
                    boxShadow: "0 1px 2px rgba(30,37,26,0.04)",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div
                        className="text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: "#9AA08F" }}
                      >
                        Habitación
                      </div>
                      <div
                        className="text-[25px] font-bold leading-tight"
                        style={{ fontFamily: bricolage }}
                      >
                        {room.number}
                      </div>
                    </div>
                    <StatusPill meta={meta} />
                  </div>

                  <div className="mt-3 text-[13.5px] font-semibold" style={{ color: "#2A3122" }}>
                    {getRoomTypeLabel(room.type)}
                  </div>

                  <div className="my-3.5 h-px" style={{ background: "#F0EBDD" }} />

                  <div className="flex items-end justify-between">
                    <div className="min-w-0">
                      <div
                        className="text-lg font-bold leading-none"
                        style={{ fontFamily: bricolage, color: "#1E251A" }}
                      >
                        {formatRate(room.price)}
                      </div>
                      <div className="mt-0.5 text-[11px]" style={{ color: "#9AA08F" }}>
                        por noche
                      </div>
                    </div>
                    {canCreateRooms && (
                      <button
                        onClick={() => openEdit(room)}
                        className="flex shrink-0 items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
                        style={{ background: "#F3EFE4", color: "#3F463A", border: "1px solid #E6E0D1" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#ECE6D7")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#F3EFE4")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Lista */
          <div
            className="overflow-hidden rounded-2xl"
            style={{ background: "#fff", border: "1px solid #E6E0D1", boxShadow: "0 1px 2px rgba(30,37,26,0.04)" }}
          >
            <div
              className="grid gap-4 px-6 py-3 text-[11.5px] font-bold uppercase tracking-wider"
              style={{
                gridTemplateColumns: canCreateRooms
                  ? "0.9fr 2fr 1.4fr 1.2fr 0.9fr"
                  : "0.9fr 2fr 1.4fr 1.2fr",
                background: "#FAF7EF",
                borderBottom: "1px solid #ECE6D7",
                color: "#8A9081",
              }}
            >
              <span>Habitación</span>
              <span>Tipo</span>
              <span>Estado</span>
              <span className="text-right">Tarifa</span>
              {canCreateRooms && <span className="text-right">Acción</span>}
            </div>
            {visibleRooms.map((room) => {
              const meta = getStatusMeta(room.status);
              return (
                <div
                  key={room.id}
                  className="grid items-center gap-4 px-6 py-3.5"
                  style={{
                    gridTemplateColumns: canCreateRooms
                      ? "0.9fr 2fr 1.4fr 1.2fr 0.9fr"
                      : "0.9fr 2fr 1.4fr 1.2fr",
                    borderBottom: "1px solid #F2EDDF",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: meta.accent }}
                    />
                    <span
                      className="text-base font-bold"
                      style={{ fontFamily: bricolage, color: "#1E251A" }}
                    >
                      {room.number}
                    </span>
                  </div>
                  <div className="text-[13.5px] font-semibold" style={{ color: "#2A3122" }}>
                    {getRoomTypeLabel(room.type)}
                  </div>
                  <div>
                    <StatusPill meta={meta} />
                  </div>
                  <div
                    className="text-right text-[14.5px] font-bold"
                    style={{ fontFamily: bricolage, color: "#1E251A" }}
                  >
                    {formatRate(room.price)}
                  </div>
                  {canCreateRooms && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => openEdit(room)}
                        className="flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
                        style={{ background: "#F3EFE4", color: "#3F463A", border: "1px solid #E6E0D1" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#ECE6D7")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#F3EFE4")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación del servidor */}
        {!isLoadingRooms && total > 0 && (
          <PaginationControls
            total={total}
            hasPrev={cursorStack.length > 1}
            hasNext={hasNext}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
            disabled={isLoadingRooms}
          />
        )}
      </div>

      {/* Diálogo crear / editar (paleta cálida) */}
      {canCreateRooms && (
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setEditingRoom(null);
          }}
        >
          <DialogContent
            className="sm:max-w-md shadow-2xl"
            style={{ background: "#FBF7EE", border: "1px solid #E6E0D1", color: "#1E251A" }}
          >
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl" style={{ fontFamily: bricolage }}>
                {editingRoom ? "Editar habitación" : "Registrar habitación"}
              </DialogTitle>
              <DialogDescription style={{ color: "#6E7567" }}>
                {editingRoom
                  ? "Modifica el número, tipo o tarifa de la habitación."
                  : 'Añade un nuevo cuarto al inventario. Su estado será "Disponible" por defecto.'}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#3F463A" }}>Número o nombre</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ej: 101, 102A, VIP-1"
                          className="uppercase bg-white border-[#E6E0D1] text-[#1E251A] placeholder:text-[#9AA08F] focus-visible:ring-[#C2683E]"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-[#9A4226]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#3F463A" }}>Tipo de habitación</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white border-[#E6E0D1] text-[#1E251A] focus-visible:ring-[#C2683E]">
                            <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#FBF7EE] border-[#E6E0D1] text-[#1E251A]">
                          <SelectItem value="SINGLE" className="cursor-pointer focus:bg-[#F0EBDD] focus:text-[#1E251A]">
                            Sencilla (Single)
                          </SelectItem>
                          <SelectItem value="DOUBLE" className="cursor-pointer focus:bg-[#F0EBDD] focus:text-[#1E251A]">
                            Doble (Double)
                          </SelectItem>
                          <SelectItem value="SUITE" className="cursor-pointer focus:bg-[#F0EBDD] focus:text-[#1E251A]">
                            Suite
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs text-[#9A4226]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#3F463A" }}>Precio por noche (S/.)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="ej: 120.00"
                          className="bg-white border-[#E6E0D1] text-[#1E251A] placeholder:text-[#9AA08F] focus-visible:ring-[#C2683E]"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-[#9A4226]" />
                    </FormItem>
                  )}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full font-semibold text-white bg-[#C2683E] hover:bg-[#A8552F]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : editingRoom ? (
                      "Guardar cambios"
                    ) : (
                      "Guardar habitación"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
