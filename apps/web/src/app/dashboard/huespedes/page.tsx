"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/date";
import { getRoomTypeLabel } from "@/lib/room";
import type { ReservationStatus } from "@/lib/reservation";
import { ReservationStatusBadge } from "@/components/reservation-status-badge";
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

import { PaginationControls } from "@/components/ui/pagination-controls";

const PAGE_SIZE = 20;

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

export default function HuespedesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [cursorStack, setCursorStack] = useState<(number | null)[]>([null]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [detail, setDetail] = useState<GuestDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const cursor = cursorStack[cursorStack.length - 1];

  const fetchGuests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(
        routes.api.guests.list({
          search: debouncedSearch || undefined,
          cursor: cursor ?? undefined,
          take: PAGE_SIZE,
        }),
      );
      setGuests(res.data.data);
      setTotal(res.data.total);
      setNextCursor(res.data.nextCursor);
      setHasNext(res.data.hasNext);
    } catch {
      toast.error("Error al cargar los huéspedes");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, cursor]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  useEffect(() => {
    setCursorStack([null]);
  }, [debouncedSearch]);

  const handleNextPage = () => {
    if (hasNext && nextCursor != null) {
      setCursorStack((s) => [...s, nextCursor]);
    }
  };

  const handlePrevPage = () => {
    setCursorStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  };

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
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              <TableHead className="font-semibold text-muted-foreground">
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
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Cargando huéspedes...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : guests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
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
        {!isLoading && total > 0 && (
          <div className="px-6 py-4 border-t border-border/50">
            <PaginationControls
              total={total}
              hasPrev={cursorStack.length > 1}
              hasNext={hasNext}
              onPrev={handlePrevPage}
              onNext={handleNextPage}
              disabled={isLoading}
            />
          </div>
        )}
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
                            {formatDate(stay.checkIn)} →{" "}
                            {formatDate(stay.checkOut)}
                          </span>
                        </div>
                        <ReservationStatusBadge status={stay.status} />
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
