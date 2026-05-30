"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/date";
import { toast } from "sonner";
import { Search, Plus, Loader2, LogIn, LogOut, Pencil, Ban } from "lucide-react";

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

import ReservationFormDialog, {
  ReservationForEdit,
} from "./ReservationFormDialog";

type ReservationStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

type PaymentMethod = "CASH" | "CARD" | "TRANSFER";

interface Reservation {
  id: number;
  guestName: string;
  dni: string;
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  roomId: number;
  room: { number: string; type: string };
  // Facturación (Prisma serializa Decimal como string; null hasta el check-out)
  pricePerNight: string | null;
  totalAmount: string | null;
  paymentMethod: PaymentMethod | null;
}

// Noches reservadas, mínimo 1 — debe coincidir con el cálculo del backend
function calcNights(checkIn: string, checkOut: string) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diff =
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / MS_PER_DAY;
  return Math.max(1, Math.ceil(diff));
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

function getRoomTypeLabel(type: string) {
  const labels: Record<string, string> = {
    SINGLE: "Sencilla",
    DOUBLE: "Doble",
    SUITE: "Suite",
  };
  return labels[type] ?? type;
}

export default function ReservasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ReservationStatus>(
    "ALL",
  );
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReservation, setEditingReservation] =
    useState<ReservationForEdit | null>(null);
  // Id de la reserva sobre la que se está ejecutando un check-in/check-out/cancelación
  const [actioningId, setActioningId] = useState<number | null>(null);
  // Reserva en proceso de cobro (abre el diálogo de check-out)
  const [checkoutTarget, setCheckoutTarget] = useState<Reservation | null>(null);
  // Reserva en proceso de cancelación (abre el diálogo de confirmación)
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  const fetchReservations = useCallback(async () => {
    try {
      const res = await api.get(routes.api.reservations.list());
      setReservations(res.data);
    } catch {
      toast.error("Error al cargar las reservas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleNew = () => {
    setEditingReservation(null);
    setIsFormOpen(true);
  };

  const handleEdit = (res: Reservation) => {
    setEditingReservation({
      id: res.id,
      guestName: res.guestName,
      dni: res.dni,
      checkIn: res.checkIn,
      checkOut: res.checkOut,
      roomId: res.roomId,
      room: res.room,
    });
    setIsFormOpen(true);
  };

  const handleCheckIn = async (id: number) => {
    setActioningId(id);
    try {
      const res = await api.patch(routes.api.reservations.checkIn(id));
      toast.success(res.data.message ?? "Check-in realizado");
      fetchReservations();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const raw = err.response?.data?.message;
      const msg = Array.isArray(raw) ? raw[0] : raw ?? "Error al hacer check-in";
      toast.error(msg);
    } finally {
      setActioningId(null);
    }
  };

  const openCheckout = (reservation: Reservation) => {
    setPaymentMethod("CASH");
    setCheckoutTarget(reservation);
  };

  const confirmCheckOut = async () => {
    if (!checkoutTarget) return;
    setActioningId(checkoutTarget.id);
    try {
      const res = await api.patch(
        routes.api.reservations.checkOut(checkoutTarget.id),
        { paymentMethod },
      );
      toast.success(res.data.message ?? "Check-out realizado");
      setCheckoutTarget(null);
      fetchReservations();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const raw = err.response?.data?.message;
      const msg = Array.isArray(raw) ? raw[0] : raw ?? "Error al hacer check-out";
      toast.error(msg);
    } finally {
      setActioningId(null);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setActioningId(cancelTarget.id);
    try {
      const res = await api.patch(routes.api.reservations.cancel(cancelTarget.id));
      toast.success(res.data.message ?? "Reserva cancelada");
      setCancelTarget(null);
      fetchReservations();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const raw = err.response?.data?.message;
      const msg = Array.isArray(raw) ? raw[0] : raw ?? "Error al cancelar la reserva";
      toast.error(msg);
    } finally {
      setActioningId(null);
    }
  };

  const filteredReservations = reservations.filter((r) => {
    const matchesSearch =
      r.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.dni.includes(searchTerm);
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-status-occupied-bg text-status-occupied-text font-semibold border border-status-occupied-border">
            En Hotel (Activa)
          </span>
        );
      case "PENDING":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-status-cleaning-bg text-status-cleaning-text font-semibold border border-status-cleaning-border">
            Próximos a llegar
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-status-available-bg text-status-available-text font-semibold border border-status-available-border">
            Finalizada
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-status-maintenance-bg text-status-maintenance-text font-semibold border border-status-maintenance-border">
            Cancelada
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Gestión de Reservas
          </h2>
          <p className="text-muted-foreground mt-2 text-base">
            Administra el historial y controla los próximos ingresos para evitar
            overbooking al 100%.
          </p>
        </div>

        <button
          onClick={handleNew}
          className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-zinc-800 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" /> Nueva Reserva
        </button>
      </div>

      <ReservationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={fetchReservations}
        reservation={editingReservation}
      />

      {/* Buscador + Filtro */}
      <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar reserva por Documento o Nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-muted transition-all font-medium text-foreground"
          />
        </div>
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
      </div>

      {/* Tabla */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden mb-8">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold text-muted-foreground py-4 w-[80px] pl-6">
                ID
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                Huésped
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                Documento
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                Alojamiento
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                Fechas (In → Out)
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground">
                Estado
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-right pr-6">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Cargando reservas...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredReservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  {searchTerm || statusFilter !== "ALL" ? (
                    "No se encontraron reservas con esos criterios."
                  ) : (
                    "No hay reservas registradas aún."
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredReservations.map((res) => (
                <TableRow
                  key={res.id}
                  className="transition-colors hover:bg-muted/50 group"
                >
                  <TableCell className="font-bold text-foreground pl-6">
                    #{res.id}
                  </TableCell>
                  <TableCell className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {res.guestName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {res.dni}
                  </TableCell>
                  <TableCell>
                    <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-md text-xs font-bold border border-border/50">
                      Cto. {res.room.number} — {getRoomTypeLabel(res.room.type)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(res.checkIn)}{" "}
                    <span className="opacity-50">→</span>{" "}
                    {formatDate(res.checkOut)}
                  </TableCell>
                  <TableCell>{getStatusBadge(res.status)}</TableCell>
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
                          className="inline-flex items-center justify-center w-8 h-8 bg-background text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/10 hover:border-red-500/40 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
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
                      <span className="text-xs font-semibold text-foreground">
                        S/. {Number(res.totalAmount ?? 0).toFixed(2)}
                        {res.paymentMethod && (
                          <span className="ml-1 font-normal text-muted-foreground">
                            ({PAYMENT_LABELS[res.paymentMethod]})
                          </span>
                        )}
                      </span>
                    )}
                    {res.status === "CANCELLED" && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de Cobro / Check-out */}
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
              const pricePerNight = Number(checkoutTarget.pricePerNight ?? 0);
              const total = nights * pricePerNight;

              return (
                <div className="flex flex-col gap-4 mt-2">
                  {/* Resumen */}
                  <div className="bg-muted rounded-xl p-4 flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Huésped</span>
                      <span className="font-semibold text-foreground">
                        {checkoutTarget.guestName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Habitación</span>
                      <span className="font-semibold text-foreground">
                        Cto. {checkoutTarget.room.number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {nights} noche{nights > 1 ? "s" : ""} × S/.{" "}
                        {pricePerNight.toFixed(2)}
                      </span>
                      <span className="font-semibold text-foreground">
                        S/. {total.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-border/50 mt-1 pt-2 flex justify-between items-center">
                      <span className="font-semibold text-foreground">
                        Total a cobrar
                      </span>
                      <span className="text-xl font-bold text-primary">
                        S/. {total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Método de pago */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">
                      Método de pago
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["CASH", "CARD", "TRANSFER"] as const).map((method) => (
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
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={confirmCheckOut}
                    disabled={actioningId === checkoutTarget.id}
                    className="w-full bg-primary text-primary-foreground h-11 rounded-lg font-semibold shadow hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                  >
                    {actioningId === checkoutTarget.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                      </>
                    ) : (
                      "Confirmar y Cobrar"
                    )}
                  </button>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación de Cancelación */}
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
                    {cancelTarget.guestName}
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
                  className="flex-1 h-11 rounded-lg bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
