"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { calcNights } from "@/lib/pricing";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  getRoomTypeLabel,
  ROOM_TYPE_OPTIONS,
  type RoomType,
} from "@/lib/room";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Room {
  id: number;
  number: string;
  type: string;
  status: string;
  price: string;
}

export interface ReservationForEdit {
  id: number;
  guest: {
    nationalId: string;
    fullName: string;
    email: string | null;
    phone: string | null;
  };
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

  const [nationalId, setNationalId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSearchingGuest, setIsSearchingGuest] = useState(false);
  const [formCheckIn, setFormCheckIn] = useState("");
  const [formCheckOut, setFormCheckOut] = useState("");
  const [formType, setFormType] = useState<RoomType | "">("");
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
      setNationalId(reservation.guest.nationalId);
      setFullName(reservation.guest.fullName);
      setEmail(reservation.guest.email ?? "");
      setPhone(reservation.guest.phone ?? "");
      setFormCheckIn(reservation.checkIn.split("T")[0]);
      setFormCheckOut(reservation.checkOut.split("T")[0]);
      setFormType(reservation.room.type as RoomType);
      preselectRef.current = reservation.roomId;
    } else {
      setNationalId("");
      setFullName("");
      setEmail("");
      setPhone("");
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

  const selectedRoom = availableRooms.find(
    (r) => String(r.id) === selectedRoomId,
  );
  const estimateNights = criteriaReady
    ? calcNights(formCheckIn, formCheckOut)
    : 0;
  const estimatePricePerNight = selectedRoom ? Number(selectedRoom.price) : 0;
  const estimateTotal = estimateNights * estimatePricePerNight;
  const hasEstimate = !!selectedRoom && criteriaReady;

  const handleSearchGuest = async () => {
    const query = nationalId.trim();
    if (!query) {
      toast.error("Ingresa un DNI para buscar");
      return;
    }

    setIsSearchingGuest(true);
    try {
      const res = await api.get(routes.api.guests.list(query));
      const guests = res.data as {
        nationalId: string;
        fullName: string;
        email: string | null;
        phone: string | null;
      }[];
      const match = guests.find((g) => g.nationalId === query);

      if (match) {
        setFullName(match.fullName);
        setEmail(match.email ?? "");
        setPhone(match.phone ?? "");
        toast.success("Huésped encontrado");
      } else {
        toast.info("Huésped no registrado. Completa los datos para crearlo.");
      }
    } catch {
      toast.error("Error al buscar el huésped");
    } finally {
      setIsSearchingGuest(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRoomId) {
      toast.error("Selecciona una habitación disponible");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        nationalId: nationalId.trim(),
        fullName: fullName.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
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
      toast.error(getApiErrorMessage(error, "Error al guardar la reserva"));
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
          {isEdit && (
            <DialogDescription>
              Modifica las fechas, la habitación o los datos del huésped. Se
              revalidará la disponibilidad.
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              DNI / Documento Identidad
            </label>
            <div className="flex gap-2">
              <input
                required
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchGuest();
                  }
                }}
                className="h-10 flex-1 px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:ring-2 focus:border-primary focus:ring-primary/20 outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleSearchGuest}
                disabled={isSearchingGuest}
                className="h-10 px-4 rounded-lg border border-border/50 bg-muted text-foreground font-semibold text-sm hover:bg-muted/70 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
              >
                {isSearchingGuest ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Buscar
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Nombre del Huésped Completo
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10 px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:ring-2 focus:border-primary focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-semibold text-muted-foreground">
                Email <span className="font-normal">(opcional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:ring-2 focus:border-primary focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-semibold text-muted-foreground">
                Teléfono <span className="font-normal">(opcional)</span>
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:ring-2 focus:border-primary focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>
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
              onChange={(e) => setFormType(e.target.value as RoomType)}
              className="h-10 px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground focus:ring-2 focus:border-primary focus:ring-primary/20 outline-none transition-all cursor-pointer"
            >
              <option value="">Seleccione un tipo...</option>
              {ROOM_TYPE_OPTIONS.map((t) => (
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
          <div className="bg-muted rounded-xl p-4 flex flex-col gap-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {hasEstimate
                  ? `${estimateNights} noche${estimateNights > 1 ? "s" : ""} × S/. ${estimatePricePerNight.toFixed(2)}`
                  : "Completa fechas y habitación"}
              </span>
              <span className="font-semibold text-foreground">
                {hasEstimate ? `S/. ${estimateTotal.toFixed(2)}` : "—"}
              </span>
            </div>
            <div className="border-t border-border/50 mt-1 pt-2 flex justify-between items-center">
              <span className="font-semibold text-foreground">
                Precio estimado
              </span>
              <span className="text-xl font-bold text-primary">
                {hasEstimate ? `S/. ${estimateTotal.toFixed(2)}` : "S/. —"}
              </span>
            </div>
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
