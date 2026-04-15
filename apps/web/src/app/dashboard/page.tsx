"use client";

import { useState } from "react";
import { mockRooms, Room, RoomStatus } from "@/lib/mocks";
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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>(mockRooms);

  const disponibles = rooms.filter((r) => r.status === "disponible").length;
  const ocupadas = rooms.filter((r) => r.status === "ocupada").length;
  const limpieza = rooms.filter((r) => r.status === "limpieza").length;

  const handleChangeStatus = (roomId: string, newStatus: RoomStatus) => {
    setRooms(
      rooms.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r)),
    );
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
      <div className="grid gap-6 md:grid-cols-3">
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
            <span className="text-4xl font-bold text-foreground">{ocupadas}</span>
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
            <span className="text-4xl font-bold text-foreground">{limpieza}</span>
            <span className="text-sm font-medium text-status-cleaning-icon-text bg-status-cleaning-bg px-2 py-0.5 rounded-full border border-status-cleaning-border">
              Requieren atención
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Habitaciones */}
      <div className="mt-4">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onStatusChange={(newStatus) =>
                handleChangeStatus(room.id, newStatus)
              }
            />
          ))}
        </div>
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
  onStatusChange: (s: RoomStatus) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const getStatusConfig = () => {
    switch (room.status) {
      case "disponible":
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
      case "ocupada":
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
      case "limpieza":
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
      case "mantenimiento":
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

  const handleAction = (status: RoomStatus) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  const getTypeIcon = () => {
    switch (room.type.toLowerCase()) {
      case "sencilla":
        return <User className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />;
      case "doble":
        return <Users className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />;
      case "suite":
        return <Crown className="w-8 h-8 text-primary group-hover:text-primary transition-colors" />;
      default:
        return <BedDouble className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />;
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
          {room.type}
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
              <div className="font-semibold text-foreground">{room.type}</div>
            </div>

            {/* Opciones condicionales según el estado */}
            {room.status === "disponible" && (
              <button
                onClick={() => handleAction("ocupada")}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-status-occupied-border bg-status-occupied-bg text-status-occupied-text hover:bg-status-occupied-icon-bg transition-colors font-semibold"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5" /> Efectuar Check-In
                </div>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {room.status === "ocupada" && (
              <button
                onClick={() => handleAction("limpieza")}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-status-cleaning-border bg-status-cleaning-bg text-status-cleaning-text hover:bg-status-cleaning-icon-bg transition-colors font-semibold"
              >
                <div className="flex items-center gap-3">
                  <DoorOpen className="w-5 h-5" /> Efectuar Check-Out
                </div>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {room.status === "limpieza" && (
              <button
                onClick={() => handleAction("disponible")}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-status-available-border bg-status-available-bg text-status-available-text hover:bg-status-available-icon-bg transition-colors font-semibold"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5" /> Finalizar Servicio a la
                  Habitación
                </div>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {room.status === "mantenimiento" && (
              <button
                onClick={() => handleAction("disponible")}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-status-available-border bg-status-available-bg text-status-available-text hover:bg-status-available-icon-bg transition-colors font-semibold"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5" /> Habilitar Habitación
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
