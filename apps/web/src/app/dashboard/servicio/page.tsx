"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/date";
import { toast } from "sonner";
import {
  Sparkles,
  Droplets,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Receipt,
  ChevronRight,
} from "lucide-react";

import RoomChargesSheet, { ActiveReservation } from "./RoomChargesSheet";

interface Room {
  id: number;
  number: string;
  type: string;
  status: string;
}

function getRoomTypeLabel(type: string) {
  const labels: Record<string, string> = {
    SINGLE: "Sencilla",
    DOUBLE: "Doble",
    SUITE: "Suite",
  };
  return labels[type] ?? type;
}

export default function ServicioHabitacionPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeReservations, setActiveReservations] = useState<
    ActiveReservation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  // Id de la habitación que se está liberando en este momento
  const [liberandoId, setLiberandoId] = useState<number | null>(null);
  // Reserva seleccionada para gestionar sus cargos (abre el panel lateral)
  const [chargesTarget, setChargesTarget] = useState<ActiveReservation | null>(
    null,
  );

  const fetchData = useCallback(async () => {
    try {
      const [roomsRes, reservationsRes] = await Promise.all([
        api.get(routes.api.rooms.list()),
        api.get(routes.api.reservations.list("ACTIVE")),
      ]);
      setRooms(roomsRes.data);
      setActiveReservations(reservationsRes.data);
    } catch {
      toast.error("Error al cargar la información de servicio");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const habitacionesSucias = rooms.filter((r) => r.status === "CLEANING");

  const handleLiberar = async (roomId: number) => {
    setLiberandoId(roomId);
    try {
      const res = await api.patch(routes.api.rooms.updateStatus(roomId), {
        status: "AVAILABLE",
      });
      toast.success(res.data.message ?? "Habitación liberada");
      fetchData();
    } catch {
      toast.error("No se pudo liberar la habitación. Intenta de nuevo.");
    } finally {
      setLiberandoId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Servicio a la Habitación
          </h2>
          <p className="text-muted-foreground mt-2 text-base">
            Panel del staff. Libera habitaciones tras el Check-Out y registra
            cargos adicionales a las reservas activas.
          </p>
        </div>
      </div>

      {/* Sección A — Limpieza pendiente */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          Limpieza pendiente
        </h3>

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Cargando habitaciones...</p>
        </div>
      ) : habitacionesSucias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-status-available-bg/50 rounded-3xl border border-status-available-border border-dashed">
          <div className="w-16 h-16 bg-status-available-icon-bg rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-status-available-icon-text" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            ¡Todo impecable!
          </h3>
          <p className="text-muted-foreground mt-1">
            No hay habitaciones pendientes de limpieza en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habitacionesSucias.map((room) => (
            <div
              key={room.id}
              className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-status-cleaning-icon-bg rounded-xl">
                      <Droplets className="w-6 h-6 text-status-cleaning-icon-text" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">
                        Habitación {room.number}
                      </h3>
                      <p className="text-sm font-medium text-status-cleaning-text">
                        {getRoomTypeLabel(room.type)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted rounded-xl p-4 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                    Estado actual:
                  </span>
                  <div className="flex items-center gap-2 text-foreground font-medium text-sm">
                    <AlertCircle className="w-4 h-4 text-status-cleaning-text" />{" "}
                    Requiere Intervención del Staff
                  </div>
                </div>

                <button
                  onClick={() => handleLiberar(room.id)}
                  disabled={liberandoId === room.id}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all active:scale-95 shadow-md shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {liberandoId === room.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Liberando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Liberar Habitación
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Sección B — Cargos a reservas activas */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          Cargos a reservas activas
        </h3>

        {isLoading ? (
          <div className="h-40 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Cargando reservas...</p>
          </div>
        ) : activeReservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-muted/40 rounded-3xl border border-border/50 border-dashed">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              No hay huéspedes en hotel
            </h3>
            <p className="text-muted-foreground mt-1">
              Los cargos se registran sobre reservas en estado activo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeReservations.map((res) => (
              <button
                key={res.id}
                onClick={() => setChargesTarget(res)}
                className="group flex items-center justify-between gap-3 text-left rounded-2xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.99]"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {res.guest.fullName}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Cto. {res.room.number} — {getRoomTypeLabel(res.room.type)}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatDate(res.checkIn)}{" "}
                    <span className="opacity-50">→</span>{" "}
                    {formatDate(res.checkOut)}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      <RoomChargesSheet
        reservation={chargesTarget}
        onOpenChange={(open) => !open && setChargesTarget(null)}
      />
    </div>
  );
}
