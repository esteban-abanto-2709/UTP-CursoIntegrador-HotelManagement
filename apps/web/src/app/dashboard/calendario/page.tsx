"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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

export default function CalendarioPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [roomsRes, reservationsRes] = await Promise.all([
        api.get(routes.api.rooms.list()),
        api.get(routes.api.reservations.list()),
      ]);
      setRooms(roomsRes.data.data);
      setReservations(reservationsRes.data.data);
    } catch {
      toast.error("Error al cargar el calendario de ocupación");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
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
