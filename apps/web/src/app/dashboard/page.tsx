"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { getRoomTypeLabel } from "@/lib/room";
import { toast } from "sonner";
import {
  BedDouble,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Sparkles,
  User,
  Users,
  Crown,
  DoorOpen,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";

export interface Room {
  id: number;
  number: string;
  type: string;
  status: RoomStatus;
}

export type FilterStatus = "ALL" | RoomStatus;

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("ALL");

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get(routes.api.rooms.list());
        setRooms(response.data.data);
      } catch (error) {
        console.error("Error fetching rooms", error);
        toast.error("Error al cargar las habitaciones");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const disponibles = rooms.filter((r) => r.status === "AVAILABLE").length;
  const ocupadas = rooms.filter((r) => r.status === "OCCUPIED").length;
  const limpieza = rooms.filter((r) => r.status === "CLEANING").length;
  const mantenimiento = rooms.filter((r) => r.status === "MAINTENANCE").length;

  const handleChangeStatus = async (roomId: number, newStatus: RoomStatus) => {
    const response = await api.patch(routes.api.rooms.updateStatus(roomId), {
      status: newStatus,
    });
    setRooms(rooms.map((r) => (r.id === roomId ? response.data.room : r)));
    toast.success(response.data.message);
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Vista General de Recepción
          </h2>
          <p className="text-muted-foreground mt-2 text-base">
            Monitorea la disponibilidad y el estado en tiempo real de las
            habitaciones del hotel.
          </p>
        </div>
      </div>

      {/* Tarjetas KPI Superiores (Estilo Premium) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tarjeta Disponibles */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold tracking-tight text-muted-foreground">
              Disponibles
            </h3>
            <div className="h-10 w-10 bg-status-available-icon-bg rounded-full flex items-center justify-center text-status-available-icon-text">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">
              {disponibles}
            </span>
            <span className="text-sm font-medium text-status-available-icon-text bg-status-available-bg px-2 py-0.5 rounded-full border border-status-available-border">
              Listas para Check-in
            </span>
          </div>
        </div>

        {/* Tarjeta Ocupadas */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold tracking-tight text-muted-foreground">
              Ocupadas
            </h3>
            <div className="h-10 w-10 bg-status-occupied-icon-bg rounded-full flex items-center justify-center text-status-occupied-icon-text">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">
              {ocupadas}
            </span>
            <span className="text-sm font-medium text-status-occupied-icon-text bg-status-occupied-bg px-2 py-0.5 rounded-full border border-status-occupied-border">
              Huéspedes activos
            </span>
          </div>
        </div>

        {/* Tarjeta Limpieza */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold tracking-tight text-muted-foreground">
              Limpieza Pendiente
            </h3>
            <div className="h-10 w-10 bg-status-cleaning-icon-bg rounded-full flex items-center justify-center text-status-cleaning-icon-text">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">
              {limpieza}
            </span>
            <span className="text-sm font-medium text-status-cleaning-icon-text bg-status-cleaning-bg px-2 py-0.5 rounded-full border border-status-cleaning-border">
              Requieren atención
            </span>
          </div>
        </div>

        {/* Tarjeta Mantenimiento */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold tracking-tight text-muted-foreground">
              Mantenimiento
            </h3>
            <div className="h-10 w-10 bg-status-maintenance-icon-bg rounded-full flex items-center justify-center text-status-maintenance-icon-text">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">
              {mantenimiento}
            </span>
            <span className="text-sm font-medium text-status-maintenance-icon-text bg-status-maintenance-bg px-2 py-0.5 rounded-full border border-status-maintenance-border">
              Fuera de servicio
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          Estado de Habitaciones
        </h3>
        <div className="flex gap-3 text-sm font-medium">
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-status-available-icon-text"></div>
            Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-status-occupied-icon-text"></div>
            Ocupada
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-status-cleaning-icon-text"></div>
            Limpieza
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-status-maintenance-icon-text"></div>
            Mantenimiento
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-2">
        {(
          ["ALL", "AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"] as const
        ).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {f === "ALL"
              ? "Todas"
              : f === "AVAILABLE"
                ? "Disponibles"
                : f === "OCCUPIED"
                  ? "Ocupadas"
                  : f === "CLEANING"
                    ? "En Limpieza"
                    : "Mantenimiento"}
          </button>
        ))}
      </div>

      {/* Grid de Habitaciones */}
      <div className="mt-2">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 text-zinc-500">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            <p>Cargando inventario...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 border border-dashed border-white/10 rounded-2xl bg-white/5">
            <BedDouble className="h-10 w-10 text-zinc-600 mb-2" />
            <p className="text-zinc-400 font-medium text-lg">
              No hay habitaciones registradas.
            </p>
            <p className="text-zinc-500 text-sm">
              El Manager debe registrarlas primero en Configuración.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {rooms
              .filter((room) => filter === "ALL" || room.status === filter)
              .map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onStatusChange={(newStatus) =>
                    handleChangeStatus(room.id, newStatus)
                  }
                />

              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente Interno para pintar la Tarjeta
function RoomCard({
  room,
  onStatusChange,
}: {
  room: Room;
  onStatusChange: (s: RoomStatus) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const getStatusConfig = () => {
    switch (room.status) {
      case "AVAILABLE":
        return {
          bg: "bg-status-available-bg",
          border:
            "border-status-available-border hover:border-status-available-border-hover",
          text: "text-status-available-text",
          iconBg: "bg-status-available-icon-bg",
          iconText: "text-status-available-icon-text",
          icon: <DoorOpen className="w-4 h-4" />,
          label: "Disponible",
        };
      case "OCCUPIED":
        return {
          bg: "bg-status-occupied-bg",
          border:
            "border-status-occupied-border hover:border-status-occupied-border-hover",
          text: "text-status-occupied-text",
          iconBg: "bg-status-occupied-icon-bg",
          iconText: "text-status-occupied-icon-text",
          icon: <User className="w-4 h-4" />,
          label: "Ocupada",
        };
      case "CLEANING":
        return {
          bg: "bg-status-cleaning-bg",
          border:
            "border-status-cleaning-border hover:border-status-cleaning-border-hover",
          text: "text-status-cleaning-text",
          iconBg: "bg-status-cleaning-icon-bg",
          iconText: "text-status-cleaning-icon-text",
          icon: <Sparkles className="w-4 h-4" />,
          label: "Limpieza",
        };
      case "MAINTENANCE":
        return {
          bg: "bg-status-maintenance-bg",
          border:
            "border-status-maintenance-border hover:border-status-maintenance-border-hover",
          text: "text-status-maintenance-text",
          iconBg: "bg-status-maintenance-icon-bg",
          iconText: "text-status-maintenance-icon-text",
          icon: <Wrench className="w-4 h-4" />,
          label: "Inactiva",
        };
    }
  };

  const config = getStatusConfig();

  const handleAction = async (status: RoomStatus) => {
    setIsUpdating(true);
    try {
      await onStatusChange(status);
      setIsOpen(false);
    } catch {
      toast.error("No se pudo actualizar el estado. Intenta de nuevo.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getTypeIcon = () => {
    switch (room.type) {
      case "SINGLE":
        return (
          <User className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
        );
      case "DOUBLE":
        return (
          <Users className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
        );
      case "SUITE":
        return (
          <Crown className="w-8 h-8 text-primary group-hover:text-primary transition-colors" />
        );
      default:
        return (
          <BedDouble className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
        );
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative flex flex-col items-center justify-center p-5 pt-8 rounded-2xl border border-border/50 bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/20"
      >
        {/* Indicador de Estado en la Esquina Superior Derecha */}
        <div className="absolute top-3 right-3 flex items-center">
          <div
            title={`Estado: ${config.label}`}
            className={`flex items-center justify-center p-2 rounded-full cursor-help transition-all duration-300 ${config.bg} ${config.text} hover:scale-110 shadow-sm`}
          >
            {config.icon}
          </div>
        </div>

        {/* Icono de Categoría de Habitación */}
        <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
          {getTypeIcon()}
        </div>

        <span className="text-3xl font-bold tracking-tighter text-foreground mb-1">
          {room.number}
        </span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-background border border-border/50 text-muted-foreground mt-1">
          {getRoomTypeLabel(room.type)}
        </span>
      </button>

      {/* MODAL OPERATIVO */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              Control de Habitación {room.number}
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${config.bg} ${config.border} ${config.text}`}
              >
                {config.label}
              </span>
            </DialogTitle>
            <DialogDescription>
              Selecciona la acción operativa a realizar. Esta acción se
              sincronizará con el resto de las áreas del hotel.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4">
            <div className="p-4 bg-muted border border-border/50 rounded-xl flex justify-between items-center mb-2">
              <div className="text-sm text-muted-foreground">Categoría</div>
              <div className="font-semibold text-foreground">
                {getRoomTypeLabel(room.type)}
              </div>
            </div>

            {/* Opciones condicionales según el estado */}
            {room.status === "AVAILABLE" && (
              <button
                onClick={() => handleAction("OCCUPIED")}
                disabled={isUpdating}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-status-occupied-border bg-status-occupied-bg text-status-occupied-text hover:bg-status-occupied-icon-bg transition-colors font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <User className="w-5 h-5" />}
                  Efectuar Check-In
                </div>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {room.status === "OCCUPIED" && (
              <button
                onClick={() => handleAction("CLEANING")}
                disabled={isUpdating}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-status-cleaning-border bg-status-cleaning-bg text-status-cleaning-text hover:bg-status-cleaning-icon-bg transition-colors font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <DoorOpen className="w-5 h-5" />}
                  Efectuar Check-Out
                </div>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {room.status === "CLEANING" && (
              <button
                onClick={() => handleAction("AVAILABLE")}
                disabled={isUpdating}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-status-available-border bg-status-available-bg text-status-available-text hover:bg-status-available-icon-bg transition-colors font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Finalizar Limpieza
                </div>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {room.status === "MAINTENANCE" && (
              <button
                onClick={() => handleAction("AVAILABLE")}
                disabled={isUpdating}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-status-available-border bg-status-available-bg text-status-available-text hover:bg-status-available-icon-bg transition-colors font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Habilitar Habitación
                </div>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
