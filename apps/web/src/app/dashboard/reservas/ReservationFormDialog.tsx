"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RoomTypeValue = "SINGLE" | "DOUBLE" | "SUITE";

interface Room {
  id: number;
  number: string;
  type: string;
  status: string;
}

export interface ReservationForEdit {
  id: number;
  guestName: string;
  dni: string;
  checkIn: string;
  checkOut: string;
  roomId: number;
  room: { number: string; type: string };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  reservation?: ReservationForEdit | null;
}

const ROOM_TYPES: { value: RoomTypeValue; label: string }[] = [
  { value: "SINGLE", label: "Sencilla" },
  { value: "DOUBLE", label: "Doble" },
  { value: "SUITE", label: "Suite" },
];

function getRoomTypeLabel(type: string) {
  const labels: Record<string, string> = {
    SINGLE: "Sencilla",
    DOUBLE: "Doble",
    SUITE: "Suite",
  };
  return labels[type] ?? type;
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

export default function ReservationFormDialog({
  open,
  onOpenChange,
  onSuccess,
  reservation,
}: Props) {
  const isEdit = !!reservation;

  const [guestName, setGuestName] = useState("");
  const [dni, setDni] = useState("");
  const [formCheckIn, setFormCheckIn] = useState("");
  const [formCheckOut, setFormCheckOut] = useState("");
  const [formType, setFormType] = useState<RoomTypeValue | "">("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isSearchingRooms, setIsSearchingRooms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const preselectRef = useRef<number | null>(null);

  const fetchAvailability = useCallback(
    async (checkIn: string, checkOut: string, type: string) => {
      setIsSearchingRooms(true);
      try {
        const res = await api.get(
          routes.api.rooms.availability({
            checkIn,
            checkOut,
            type,
            excludeReservationId: reservation?.id,
          }),
        );
        const rooms = res.data as Room[];
        setAvailableRooms(rooms);
        setSelectedRoomId((prev) => {
          const want = preselectRef.current;
          if (want && rooms.some((r) => r.id === want)) {
            preselectRef.current = null;
            return String(want);
          }
          return rooms.some((r) => String(r.id) === prev) ? prev : "";
        });
      } catch {
        toast.error("Error al consultar disponibilidad");
        setAvailableRooms([]);
        setSelectedRoomId("");
      } finally {
        setIsSearchingRooms(false);
      }
    },
    [reservation?.id],
  );

  useEffect(() => {
    if (!open) return;
    if (reservation) {
      setGuestName(reservation.guestName);
      setDni(reservation.dni);
      setFormCheckIn(reservation.checkIn.split("T")[0]);
      setFormCheckOut(reservation.checkOut.split("T")[0]);
      setFormType(reservation.room.type as RoomTypeValue);
      preselectRef.current = reservation.roomId;
    } else {
      setGuestName("");
      setDni("");
      setFormCheckIn("");
      setFormCheckOut("");
      setFormType("");
      preselectRef.current = null;
    }
    setSelectedRoomId("");
    setAvailableRooms([]);
  }, [open, reservation]);

  useEffect(() => {
    if (!open) return;
    if (formCheckIn && formCheckOut && formType && formCheckOut > formCheckIn) {
      fetchAvailability(formCheckIn, formCheckOut, formType);
    } else {
      setAvailableRooms([]);
      setSelectedRoomId("");
    }
  }, [open, formCheckIn, formCheckOut, formType, fetchAvailability]);

  const todayStr = new Date().toLocaleDateString("en-CA");
  const criteriaReady =
    !!formCheckIn && !!formCheckOut && !!formType && formCheckOut > formCheckIn;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRoomId) {
      toast.error("Selecciona una habitación disponible");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        guestName,
        dni,
        roomId: Number(selectedRoomId),
        checkIn: formCheckIn,
        checkOut: formCheckOut,
      };

      if (isEdit && reservation) {
        await api.patch(routes.api.reservations.update(reservation.id), payload);
        toast.success("Reserva actualizada");
      } else {
        await api.post(routes.api.reservations.create(), payload);
        toast.success("Reserva registrada exitosamente");
      }

      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string | string[] } };
      };
      const raw = err.response?.data?.message;
      const msg = Array.isArray(raw)
        ? raw[0]
        : raw ?? "Error al guardar la reserva";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEdit ? "Editar Reserva" : "Añadir Nueva Reserva"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica las fechas, la habitación o los datos del huésped. Se revalidará la disponibilidad."
              : "Registra los datos del huésped para apartar de manera segura una habitación en las fechas solicitadas."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-semibold text-muted-foreground">
                Fecha de Entrada
              </label>
              <input
                type="date"
                required
                min={todayStr}
                value={formCheckIn}
                onChange={(e) => setFormCheckIn(e.target.value)}
                className="h-10 px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:ring-2 focus:border-primary focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-semibold text-muted-foreground">
                Fecha de Salida
              </label>
              <input
                type="date"
                required
                disabled={!formCheckIn}
                min={formCheckIn ? addDays(formCheckIn, 1) : todayStr}
                value={formCheckOut}
                onChange={(e) => setFormCheckOut(e.target.value)}
                className="h-10 px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:ring-2 focus:border-primary focus:ring-primary/20 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Tipo de Habitación
            </label>
            <select
              required
              value={formType}
              onChange={(e) => setFormType(e.target.value as RoomTypeValue)}
              className="h-10 px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:ring-2 focus:border-primary focus:ring-primary/20 outline-none transition-all cursor-pointer"
            >
              <option value="">Seleccione un tipo...</option>
              {ROOM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Habitación Disponible
            </label>
            <select
              required
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              disabled={!criteriaReady || isSearchingRooms}
              className="h-10 px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:ring-2 focus:border-primary focus:ring-primary/20 outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {!criteriaReady ? (
                <option value="">Primero elige fechas y tipo...</option>
              ) : isSearchingRooms ? (
                <option value="">Buscando disponibilidad...</option>
              ) : availableRooms.length === 0 ? (
                <option value="">
                  No hay cuartos de ese tipo libres en esas fechas
                </option>
              ) : (
                <>
                  <option value="">Seleccione un cuarto...</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Cuarto {room.number} — {getRoomTypeLabel(room.type)}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Nombre del Huésped Completo
            </label>
            <input
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="h-10 px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:ring-2 focus:border-primary focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground"
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-sm font-semibold text-muted-foreground">
              DNI / Documento Identidad
            </label>
            <input
              required
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className="h-10 px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:ring-2 focus:border-primary focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground"
              placeholder="Ej. 12345678"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !selectedRoomId}
            className="w-full bg-primary text-primary-foreground h-11 rounded-lg font-semibold shadow hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />{" "}
                {isEdit ? "Guardando..." : "Registrando..."}
              </>
            ) : isEdit ? (
              "Guardar Cambios"
            ) : (
              "Confirmar y Registrar"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
