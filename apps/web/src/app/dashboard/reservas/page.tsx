"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";
import { ExportButton } from "@/components/ui/export-button";
import { formatDate } from "@/lib/date";
import { calcNights } from "@/lib/pricing";
import { getApiErrorMessage } from "@/lib/api-error";
import { getRoomTypeLabel } from "@/lib/room";
import type { ReservationStatus } from "@/lib/reservation";
import { ReservationStatusBadge } from "@/components/reservation-status-badge";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  LogIn,
  LogOut,
  Pencil,
  Ban,
  X,
  Eye,
} from "lucide-react";

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

import { type ReservationForEdit } from "@/components/reservation-form-dialog";
import { useReservationDialog } from "@/components/reservation-dialog-provider";
import ReservationDetailDialog from "./ReservationDetailDialog";

const PAGE_SIZE = 20;

type PaymentMethod = "CASH" | "CARD" | "TRANSFER";

interface Reservation {
  id: number;
  guest: {
    id: number;
    nationalId: string;
    fullName: string;
    email: string | null;
    phone: string | null;
  };
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  roomId: number;
  room: { number: string; type: string };
  rateSnapshot: string | null;
  payment: { grandTotal: string; paymentMethod: PaymentMethod } | null;
}

interface Discount {
  id: number;
  name: string;
  percentage: string;
  type: string;
}

const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  SEASONAL: "Temporada",
  LOYALTY: "Fidelidad",
  PROMOTIONAL: "Promociones",
  CORPORATE: "Corporativo",
  GROUP: "Grupos",
  EARLY_BIRD: "Reserva anticipada",
};

interface RoomCharge {
  id: number;
  amount: string;
}

interface RoomOption {
  id: number;
  number: string;
  type: string;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
};

const STATUS_FILTERS: { value: "ALL" | ReservationStatus; label: string }[] = [
  { value: "ALL", label: "Todos los estados" },
  { value: "PENDING", label: "Próximos a llegar" },
  { value: "ACTIVE", label: "En hotel (activas)" },
  { value: "COMPLETED", label: "Finalizadas" },
  { value: "CANCELLED", label: "Canceladas" },
];

type SortOption =
  | "checkin_asc"
  | "checkin_desc"
  | "checkout_asc"
  | "recent"
  | "guest_asc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "checkin_asc", label: "Llegada más próxima" },
  { value: "checkin_desc", label: "Llegada más lejana" },
  { value: "checkout_asc", label: "Salida más próxima" },
  { value: "recent", label: "Registradas recientemente" },
  { value: "guest_asc", label: "Huésped (A–Z)" },
];

function getReservationAmount(res: Reservation): {
  amount: number;
  paid: boolean;
} {
  if (res.payment) {
    return { amount: Number(res.payment.grandTotal), paid: true };
  }
  const nights = calcNights(res.checkIn, res.checkOut);
  const rate = Number(res.rateSnapshot ?? 0);
  return { amount: nights * rate, paid: false };
}

export default function ReservasPage() {
  const isOwner = useAuthStore((state) => state.user?.role === "OWNER");
  const { openEdit, onSaved } = useReservationDialog();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ReservationStatus>(
    "ALL",
  );
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [sort, setSort] = useState<SortOption>("checkin_asc");
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cursorStack, setCursorStack] = useState<(number | null)[]>([null]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<Reservation | null>(
    null,
  );
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [checkoutCharges, setCheckoutCharges] = useState<RoomCharge[]>([]);
  const [activeDiscounts, setActiveDiscounts] = useState<Discount[]>([]);
  const [selectedDiscountIds, setSelectedDiscountIds] = useState<number[]>([]);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Reservation | null>(null);

  const cursor = cursorStack[cursorStack.length - 1];

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(
        routes.api.reservations.list({
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
          roomId: roomFilter ? Number(roomFilter) : undefined,
          search: debouncedSearch || undefined,
          sort,
          cursor: cursor ?? undefined,
          take: PAGE_SIZE,
        }),
      );
      setReservations(res.data.data);
      setTotal(res.data.total);
      setNextCursor(res.data.nextCursor);
      setHasNext(res.data.hasNext);
    } catch {
      toast.error("Error al cargar las reservas");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, fromDate, toDate, roomFilter, debouncedSearch, sort, cursor]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  useEffect(() => onSaved(() => fetchReservations()), [onSaved, fetchReservations]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setCursorStack([null]);
  }, [statusFilter, fromDate, toDate, roomFilter, debouncedSearch, sort]);

  const handleNextPage = () => {
    if (hasNext && nextCursor != null) {
      setCursorStack((s) => [...s, nextCursor]);
    }
  };

  const handlePrevPage = () => {
    setCursorStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  };

  useEffect(() => {
    api
      .get(routes.api.rooms.list())
      .then((res) => setRooms(res.data.data))
      .catch(() => toast.error("Error al cargar las habitaciones"));
  }, []);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setFromDate("");
    setToDate("");
    setRoomFilter("");
  };

  const handleEdit = (res: Reservation) => {
    openEdit({
      id: res.id,
      guest: res.guest,
      checkIn: res.checkIn,
      checkOut: res.checkOut,
      roomId: res.roomId,
      room: res.room,
    });
  };

  const handleCheckIn = async (id: number) => {
    setActioningId(id);
    try {
      const res = await api.patch(routes.api.reservations.checkIn(id));
      toast.success(res.data.message ?? "Check-in realizado");
      fetchReservations();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Error al hacer check-in"));
    } finally {
      setActioningId(null);
    }
  };

  const openCheckout = async (reservation: Reservation) => {
    setPaymentMethod("CASH");
    setSelectedDiscountIds([]);
    setCheckoutCharges([]);
    setActiveDiscounts([]);
    setCheckoutTarget(reservation);
    setIsLoadingCheckout(true);
    try {
      const [chargesRes, discountsRes] = await Promise.all([
        api.get(routes.api.reservations.charges(reservation.id)),
        api.get(routes.api.discounts.list(true)),
      ]);
      setCheckoutCharges(chargesRes.data);
      setActiveDiscounts(discountsRes.data);
    } catch {
      toast.error("Error al cargar el detalle del check-out");
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  const confirmCheckOut = async () => {
    if (!checkoutTarget) return;
    setActioningId(checkoutTarget.id);
    try {
      const res = await api.patch(
        routes.api.reservations.checkOut(checkoutTarget.id),
        { paymentMethod, discountIds: selectedDiscountIds },
      );
      toast.success(res.data.message ?? "Check-out realizado");
      setCheckoutTarget(null);
      fetchReservations();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Error al hacer check-out"));
    } finally {
      setActioningId(null);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setActioningId(cancelTarget.id);
    try {
      const res = await api.patch(
        routes.api.reservations.cancel(cancelTarget.id),
      );
      toast.success(res.data.message ?? "Reserva cancelada");
      setCancelTarget(null);
      fetchReservations();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Error al cancelar la reserva"));
    } finally {
      setActioningId(null);
    }
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    statusFilter !== "ALL" ||
    fromDate !== "" ||
    toDate !== "" ||
    roomFilter !== "";

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ReservationDetailDialog
        reservation={detailTarget}
        onOpenChange={(open) => !open && setDetailTarget(null)}
      />

      <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar reserva por Documento o Nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-muted transition-all font-medium text-foreground"
            />
          </div>
          {isOwner && (
            <ExportButton
              url={routes.api.reports.reservations()}
              filename="reservas.xlsx"
            />
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "ALL" | ReservationStatus)
            }
            className="h-11 px-4 rounded-xl border border-border/50 bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border-border/50 bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="">Todas las habitaciones</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                Cto. {room.number} — {getRoomTypeLabel(room.type)}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 h-11 px-3 rounded-xl border border-border/50 bg-background text-muted-foreground font-medium">
            <span className="text-sm whitespace-nowrap">Desde</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none cursor-pointer"
            />
          </label>
          <label className="flex items-center gap-2 h-11 px-3 rounded-xl border border-border/50 bg-background text-muted-foreground font-medium">
            <span className="text-sm whitespace-nowrap">Hasta</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none cursor-pointer"
            />
          </label>
          <label className="flex items-center gap-2 h-11 px-3 rounded-xl border border-border/50 bg-background text-muted-foreground font-medium sm:ml-auto">
            <span className="text-sm whitespace-nowrap">Ordenar por</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="bg-transparent text-foreground font-medium focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
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

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden mb-8">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold text-muted-foreground">
                Huésped
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                Estancia
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                Habitación
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                Estado
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                Monto
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-right pr-6">
                Acciones
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
                    <span>Cargando reservas...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : reservations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  {hasActiveFilters
                    ? "No se encontraron reservas con esos criterios."
                    : "No hay reservas registradas aún."}
                </TableCell>
              </TableRow>
            ) : (
              reservations.map((res) => (
                <TableRow
                  key={res.id}
                  className="transition-colors hover:bg-muted/50 group"
                >
                  <TableCell className="font-medium text-foreground group-hover:text-primary transition-colors pl-6">
                    {res.guest.fullName}
                  </TableCell>
                  <TableCell>
                    <div className="text-foreground">
                      {formatDate(res.checkIn)}{" "}
                      <span className="opacity-50">→</span>{" "}
                      {formatDate(res.checkOut)}
                    </div>
                    {(() => {
                      const nights = calcNights(res.checkIn, res.checkOut);
                      return (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {nights} noche{nights > 1 ? "s" : ""}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {getRoomTypeLabel(res.room.type)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Cto. {res.room.number}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ReservationStatusBadge status={res.status} />
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const { amount, paid } = getReservationAmount(res);
                      const isCancelled = res.status === "CANCELLED";
                      return (
                        <>
                          <div
                            className={`font-semibold ${
                              isCancelled
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            S/. {amount.toFixed(2)}
                          </div>
                          <div
                            className={`text-xs font-medium mt-0.5 ${
                              isCancelled
                                ? "text-muted-foreground"
                                : paid
                                  ? "text-status-available-text"
                                  : "text-status-cleaning-text"
                            }`}
                          >
                            {isCancelled
                              ? "Anulado"
                              : paid
                                ? "Pagado"
                                : "Pendiente"}
                          </div>
                        </>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    {res.status === "PENDING" && (
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleCheckIn(res.id)}
                          disabled={actioningId === res.id}
                          className="inline-flex items-center gap-1.5 bg-status-occupied-bg text-status-occupied-text border border-status-occupied-border px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-status-occupied-icon-bg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {actioningId === res.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LogIn className="w-3.5 h-3.5" />
                          )}
                          Check-in
                        </button>
                        <button
                          onClick={() => handleEdit(res)}
                          disabled={actioningId === res.id}
                          title="Editar reserva"
                          className="inline-flex items-center justify-center w-8 h-8 bg-background text-muted-foreground border border-border/50 rounded-lg hover:bg-muted hover:text-foreground transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCancelTarget(res)}
                          disabled={actioningId === res.id}
                          title="Cancelar reserva"
                          className="inline-flex items-center justify-center w-8 h-8 bg-background text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/10 hover:border-destructive/40 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    {res.status === "ACTIVE" && (
                      <button
                        onClick={() => openCheckout(res)}
                        disabled={actioningId === res.id}
                        className="inline-flex items-center gap-1.5 bg-status-cleaning-bg text-status-cleaning-text border border-status-cleaning-border px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-status-cleaning-icon-bg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Check-out
                      </button>
                    )}
                    {res.status === "COMPLETED" && (
                      <button
                        onClick={() => setDetailTarget(res)}
                        title="Ver detalle"
                        className="inline-flex items-center gap-1.5 bg-background text-muted-foreground border border-border/50 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted hover:text-foreground transition-all active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver detalle
                      </button>
                    )}
                    {res.status === "CANCELLED" && (
                      <button
                        onClick={() => setDetailTarget(res)}
                        title="Ver detalle"
                        className="inline-flex items-center gap-1.5 bg-background text-muted-foreground border border-border/50 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted hover:text-foreground transition-all active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver detalle
                      </button>
                    )}
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

      <Dialog
        open={checkoutTarget !== null}
        onOpenChange={(open) => !open && setCheckoutTarget(null)}
      >
        <DialogContent className="sm:max-w-[440px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Cobro y Check-out</DialogTitle>
            <DialogDescription>
              Revisa el detalle de la estadía y registra el método de pago para
              cerrar la reserva.
            </DialogDescription>
          </DialogHeader>

          {checkoutTarget &&
            (() => {
              const nights = calcNights(
                checkoutTarget.checkIn,
                checkoutTarget.checkOut,
              );
              const rateSnapshot = Number(checkoutTarget.rateSnapshot ?? 0);
              const roomTotal = nights * rateSnapshot;
              const chargesTotal = checkoutCharges.reduce(
                (acc, c) => acc + Number(c.amount),
                0,
              );
              const subtotal = roomTotal + chargesTotal;
              const selectedDiscounts = activeDiscounts
                .filter((d) => selectedDiscountIds.includes(d.id))
                .sort((a, b) => a.id - b.id);
              let running = subtotal;
              const discountLines = selectedDiscounts.map((d) => {
                const pct = Number(d.percentage);
                const amount = (running * pct) / 100;
                running -= amount;
                return { id: d.id, name: d.name, pct, amount };
              });
              const grandTotal = running;
              const groupedDiscounts = activeDiscounts.reduce<
                { type: string; items: Discount[] }[]
              >((acc, d) => {
                const group = acc.find((g) => g.type === d.type);
                if (group) group.items.push(d);
                else acc.push({ type: d.type, items: [d] });
                return acc;
              }, []);

              return (
                <div className="flex flex-col gap-4 mt-2">
                  {isLoadingCheckout ? (
                    <div className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm">Cargando detalle...</span>
                    </div>
                  ) : (
                    <>
                      <div className="bg-muted rounded-xl p-4 flex flex-col gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Huésped</span>
                          <span className="font-semibold text-foreground">
                            {checkoutTarget.guest.fullName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Habitación
                          </span>
                          <span className="font-semibold text-foreground">
                            Cto. {checkoutTarget.room.number}
                          </span>
                        </div>
                        <div className="border-t border-border/50 mt-1 pt-2 flex justify-between">
                          <span className="text-muted-foreground">
                            Habitación ({nights} noche{nights > 1 ? "s" : ""} ×
                            S/. {rateSnapshot.toFixed(2)})
                          </span>
                          <span className="font-semibold text-foreground">
                            S/. {roomTotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Cargos adicionales
                          </span>
                          <span className="font-semibold text-foreground">
                            S/. {chargesTotal.toFixed(2)}
                          </span>
                        </div>
                        {discountLines.map((line) => (
                          <div key={line.id} className="flex justify-between">
                            <span className="text-muted-foreground">
                              {line.name} ({line.pct.toFixed(0)}%)
                            </span>
                            <span className="font-semibold text-destructive">
                              − S/. {line.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div className="border-t border-border/50 mt-1 pt-2 flex justify-between items-center">
                          <span className="font-semibold text-foreground">
                            Total a cobrar
                          </span>
                          <span className="text-xl font-bold text-primary">
                            S/. {grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">
                          Descuentos
                        </label>
                        {activeDiscounts.length === 0 ? (
                          <span className="text-sm text-muted-foreground">
                            No hay descuentos disponibles
                          </span>
                        ) : (
                          <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background p-3 max-h-60 overflow-y-auto">
                            {groupedDiscounts.map((group) => {
                              const sameTypeIds = group.items.map((x) => x.id);
                              const selectedInGroup =
                                group.items.find((x) =>
                                  selectedDiscountIds.includes(x.id),
                                )?.id ?? "";
                              return (
                                <div
                                  key={group.type}
                                  className="flex flex-col gap-1"
                                >
                                  <span className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                                    {DISCOUNT_TYPE_LABELS[group.type] ??
                                      group.type}
                                  </span>
                                  <select
                                    value={selectedInGroup}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setSelectedDiscountIds((prev) => {
                                        const without = prev.filter(
                                          (id) => !sameTypeIds.includes(id),
                                        );
                                        return value
                                          ? [...without, Number(value)]
                                          : without;
                                      });
                                    }}
                                    className="h-11 px-3 rounded-lg border border-border/50 bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                  >
                                    <option value="">Sin descuento</option>
                                    {group.items.map((d) => (
                                      <option key={d.id} value={d.id}>
                                        {d.name} (
                                        {Number(d.percentage).toFixed(0)}%)
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-muted-foreground">
                          Método de pago
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["CASH", "CARD", "TRANSFER"] as const).map(
                            (method) => (
                              <button
                                key={method}
                                type="button"
                                onClick={() => setPaymentMethod(method)}
                                className={`px-3 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                                  paymentMethod === method
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background text-muted-foreground border-border/50 hover:bg-muted"
                                }`}
                              >
                                {PAYMENT_LABELS[method]}
                              </button>
                            ),
                          )}
                        </div>
                      </div>

                      <button
                        onClick={confirmCheckOut}
                        disabled={actioningId === checkoutTarget.id}
                        className="w-full bg-primary text-primary-foreground h-11 rounded-lg font-semibold shadow hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                      >
                        {actioningId === checkoutTarget.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />{" "}
                            Procesando...
                          </>
                        ) : (
                          "Confirmar y Cobrar"
                        )}
                      </button>
                    </>
                  )}
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>

      <Dialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Cancelar Reserva</DialogTitle>
            <DialogDescription>
              Esta acción libera las fechas de la habitación. La reserva no se
              elimina, queda registrada como cancelada.
            </DialogDescription>
          </DialogHeader>

          {cancelTarget && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="bg-muted rounded-xl p-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Huésped</span>
                  <span className="font-semibold text-foreground">
                    {cancelTarget.guest.fullName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Habitación</span>
                  <span className="font-semibold text-foreground">
                    Cto. {cancelTarget.room.number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fechas</span>
                  <span className="font-semibold text-foreground">
                    {formatDate(cancelTarget.checkIn)} →{" "}
                    {formatDate(cancelTarget.checkOut)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCancelTarget(null)}
                  className="flex-1 h-11 rounded-lg border border-border/50 bg-background text-foreground font-semibold hover:bg-muted transition-all active:scale-95"
                >
                  Volver
                </button>
                <button
                  onClick={confirmCancel}
                  disabled={actioningId === cancelTarget.id}
                  className="flex-1 h-11 rounded-lg bg-destructive text-primary-foreground font-semibold shadow hover:bg-destructive/90 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actioningId === cancelTarget.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Cancelando...
                    </>
                  ) : (
                    "Sí, cancelar"
                  )}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
