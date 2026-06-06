"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/date";
import { toast } from "sonner";
import { Search, Loader2, Mail, Phone, History } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ReservationStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

interface GuestRow {
  id: number;
  nationalId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  _count: { reservations: number };
}

interface GuestStay {
  id: number;
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  room: { number: string; type: string };
}

interface GuestDetail extends GuestRow {
  reservations: GuestStay[];
}

const STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: "Próxima",
  ACTIVE: "En hotel",
  COMPLETED: "Finalizada",
  CANCELLED: "Cancelada",
};

function getRoomTypeLabel(type: string) {
  const labels: Record<string, string> = {
    SINGLE: "Sencilla",
    DOUBLE: "Doble",
    SUITE: "Suite",
  };
  return labels[type] ?? type;
}

function getStatusBadge(status: ReservationStatus) {
  const styles: Record<ReservationStatus, string> = {
    ACTIVE:
      "bg-status-occupied-bg text-status-occupied-text border-status-occupied-border",
    PENDING:
      "bg-status-cleaning-bg text-status-cleaning-text border-status-cleaning-border",
    COMPLETED:
      "bg-status-available-bg text-status-available-text border-status-available-border",
    CANCELLED:
      "bg-status-maintenance-bg text-status-maintenance-text border-status-maintenance-border",
  };
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full font-semibold border ${styles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function HuespedesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detail, setDetail] = useState<GuestDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchGuests = useCallback(async (search: string) => {
    try {
      const res = await api.get(routes.api.guests.list(search.trim()));
      setGuests(res.data);
    } catch {
      toast.error("Error al cargar los huéspedes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchGuests(searchTerm);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchTerm, fetchGuests]);

  const openDetail = async (id: number) => {
    setIsDetailLoading(true);
    setDetail(null);
    try {
      const res = await api.get(routes.api.guests.getOne(id));
      setDetail(res.data);
    } catch {
      toast.error("Error al cargar el historial del huésped");
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Cabecera */}
      <div className="border-b pb-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Gestión de Huéspedes
        </h2>
        <p className="text-muted-foreground mt-2 text-base">
          Consulta el directorio de huéspedes registrados y su historial de
          estadías.
        </p>
      </div>

      {/* Buscador */}
      <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-muted transition-all font-medium text-foreground"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden mb-8">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold text-muted-foreground py-4 pl-6">
                Nombre
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                Documento
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                Email
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                Teléfono
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">
                Reservas
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-right pr-6">
                Historial
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Cargando huéspedes...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : guests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  {searchTerm
                    ? "No se encontraron huéspedes con esos criterios."
                    : "No hay huéspedes registrados aún."}
                </TableCell>
              </TableRow>
            ) : (
              guests.map((guest) => (
                <TableRow
                  key={guest.id}
                  onClick={() => openDetail(guest.id)}
                  className="transition-colors hover:bg-muted/50 group cursor-pointer"
                >
                  <TableCell className="font-medium text-foreground group-hover:text-primary transition-colors pl-6">
                    {guest.fullName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {guest.nationalId}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {guest.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {guest.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-md text-xs font-bold border border-border/50">
                      {guest._count.reservations}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                      <History className="w-3.5 h-3.5" />
                      Ver
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de Historial */}
      <Dialog
        open={detail !== null || isDetailLoading}
        onOpenChange={(open) => {
          if (!open) {
            setDetail(null);
            setIsDetailLoading(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {detail ? detail.fullName : "Historial del huésped"}
            </DialogTitle>
            <DialogDescription>
              {detail
                ? `Documento ${detail.nationalId} · ${detail.reservations.length} estadía${detail.reservations.length === 1 ? "" : "s"} registrada${detail.reservations.length === 1 ? "" : "s"}`
                : "Cargando información del huésped..."}
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Cargando historial...</span>
            </div>
          ) : (
            detail && (
              <div className="flex flex-col gap-4 mt-2">
                {/* Contacto */}
                <div className="bg-muted rounded-xl p-4 flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>{detail.email ?? "Sin email"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{detail.phone ?? "Sin teléfono"}</span>
                  </div>
                </div>

                {/* Estadías */}
                {detail.reservations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Este huésped no tiene estadías registradas.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[320px] overflow-auto pr-1">
                    {detail.reservations.map((stay) => (
                      <div
                        key={stay.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background p-3"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">
                            Cto. {stay.room.number} —{" "}
                            {getRoomTypeLabel(stay.room.type)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(stay.checkIn)} → {formatDate(stay.checkOut)}
                          </span>
                        </div>
                        {getStatusBadge(stay.status)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
