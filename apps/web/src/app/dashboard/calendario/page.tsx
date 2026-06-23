"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import { Loader2, Search, X } from "lucide-react";
import { ROOM_TYPE_OPTIONS } from "@/lib/room";
import OccupancyTimeline from "./OccupancyTimeline";

interface Room {
  id: number;
  number: string;
  type: string;
}

interface Reservation {
  id: number;
  guest: { fullName: string };
  checkIn: string;
  checkOut: string;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  roomId: number;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "AVAILABLE", label: "Disponible" },
  { value: "OCCUPIED", label: "Ocupada" },
  { value: "CLEANING", label: "Limpieza" },
  { value: "MAINTENANCE", label: "Mantenim." },
];

export default function CalendarioPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [roomsRes, reservationsRes] = await Promise.all([
        api.get(
          routes.api.rooms.list({
            type: typeFilter || undefined,
            status: statusFilter || undefined,
            search: debouncedSearch || undefined,
          }),
        ),
        api.get(routes.api.reservations.list()),
      ]);
      setRooms(roomsRes.data.data);
      setReservations(reservationsRes.data.data);
    } catch {
      toast.error("Error al cargar el calendario de ocupación");
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasActiveFilters =
    searchTerm !== "" || typeFilter !== "" || statusFilter !== "";

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setStatusFilter("");
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar habitación por número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-muted transition-all font-medium text-foreground"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border-border/50 bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="">Todos los tipos</option>
            {ROOM_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border-border/50 bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="">Todos los estados</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border border-border/50 bg-background text-muted-foreground font-medium hover:bg-muted hover:text-foreground transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Cargando ocupación...</span>
        </div>
      ) : (
        <OccupancyTimeline rooms={rooms} reservations={reservations} />
      )}
    </div>
  );
}
