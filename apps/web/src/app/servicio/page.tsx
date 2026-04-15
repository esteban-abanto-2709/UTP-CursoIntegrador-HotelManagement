"use client";

import { useState } from "react";
import { mockRooms, Room } from "@/lib/mocks";
import { Sparkles, Droplets, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ServicioHabitacionPage() {
  // Simulando que cargamos de la BD para la demo
  const [rooms, setRooms] = useState<Room[]>(mockRooms);

  // Filtramos solo las que están en estado amarillo/limpieza
  const habitacionesSucias = rooms.filter((r) => r.status === "limpieza");

  const handeFinalizarServicio = (roomId: string) => {
    // Al tocar el bóton, cambiamos el estado de limpieza a "disponible" localmente
    setRooms(
      rooms.map((r) => (r.id === roomId ? { ...r, status: "disponible" } : r)),
    );
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
            Panel exclusivo para el staff. Atiende las habitaciones liberadas
            tras el Check-Out.
          </p>
        </div>
      </div>

      {habitacionesSucias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-status-available-bg/50 rounded-3xl border border-status-available-border border-dashed">
          <div className="w-16 h-16 bg-status-available-icon-bg rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-status-available-icon-text" />
          </div>
          <h3 className="text-xl font-bold text-foreground">¡Todo impecable!</h3>
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
                        {room.type}
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
                  onClick={() => handeFinalizarServicio(room.id)}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all active:scale-95 shadow-md shadow-primary/20"
                >
                  <CheckCircle2 className="w-5 h-5" /> Liberar Habitación
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
