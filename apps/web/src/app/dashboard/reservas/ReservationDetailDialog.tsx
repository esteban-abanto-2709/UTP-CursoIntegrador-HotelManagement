"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/date";
import { calcNights } from "@/lib/pricing";
import { getRoomTypeLabel } from "@/lib/room";
import { getApiErrorMessage } from "@/lib/api-error";
import type { ReservationStatus } from "@/lib/reservation";
import { ReservationStatusBadge } from "@/components/reservation-status-badge";
import { generarComprobante } from "@/lib/printComprobante";
import { toast } from "sonner";
import { Loader2, Printer } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PaymentMethod = "CASH" | "CARD" | "TRANSFER";

export interface ReservationForDetail {
  id: number;
  guest: {
    nationalId: string;
    fullName: string;
  };
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  room: { number: string; type: string };
  payment: { grandTotal: string; paymentMethod: PaymentMethod } | null;
}

interface RoomCharge {
  id: number;
  description: string;
  amount: string;
  category: { name: string };
}

interface Payment {
  id: number;
  roomTotal: string;
  chargesTotal: string;
  subtotal: string;
  discountAmount: string;
  grandTotal: string;
  processedAt: string;
  employee: { firstName: string; lastName: string };
  discount: { name: string; percentage: string } | null;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
};

const money = (value: number) => `S/. ${value.toFixed(2)}`;

export default function ReservationDetailDialog({
  reservation,
  onOpenChange,
}: {
  reservation: ReservationForDetail | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [charges, setCharges] = useState<RoomCharge[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!reservation) return;
    let cancelled = false;
    const isCompleted = reservation.status === "COMPLETED";

    setCharges([]);
    setPayment(null);
    setIsLoading(true);

    const requests: [
      Promise<{ data: RoomCharge[] }>,
      Promise<{ data: Payment }> | null,
    ] = [
      api.get(routes.api.reservations.charges(reservation.id)),
      isCompleted
        ? api.get(routes.api.payments.getByReservation(reservation.id))
        : null,
    ];

    Promise.all([requests[0], requests[1] ?? Promise.resolve(null)])
      .then(([chargesRes, paymentRes]) => {
        if (cancelled) return;
        setCharges(chargesRes.data);
        if (paymentRes) setPayment(paymentRes.data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Error al cargar el detalle de la reserva");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reservation]);

  const handlePrint = async () => {
    if (!reservation) return;
    setIsPrinting(true);
    try {
      await generarComprobante(reservation.id);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "No se pudo generar el comprobante"),
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const nights = reservation
    ? calcNights(reservation.checkIn, reservation.checkOut)
    : 0;

  return (
    <Dialog
      open={reservation !== null}
      onOpenChange={(open) => !open && onOpenChange(false)}
    >
      <DialogContent className="sm:max-w-[520px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Detalle de la reserva</DialogTitle>
          <DialogDescription>
            Consulta los consumos del huésped y regenera el comprobante de pago.
          </DialogDescription>
        </DialogHeader>

        {reservation && (
          <div className="flex flex-col gap-4 mt-2">
            <div className="bg-muted rounded-xl p-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">
                  {reservation.guest.fullName}
                </span>
                <ReservationStatusBadge status={reservation.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Documento</span>
                <span className="text-foreground">
                  {reservation.guest.nationalId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Habitación</span>
                <span className="text-foreground">
                  Cto. {reservation.room.number} —{" "}
                  {getRoomTypeLabel(reservation.room.type)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fechas</span>
                <span className="text-foreground">
                  {formatDate(reservation.checkIn)} →{" "}
                  {formatDate(reservation.checkOut)} ({nights} noche
                  {nights > 1 ? "s" : ""})
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm">Cargando detalle...</span>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Consumos
                  </span>
                  {charges.length === 0 ? (
                    <p className="text-sm text-muted-foreground rounded-xl border border-border/50 bg-background p-3">
                      Sin consumos adicionales.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-[220px] overflow-auto pr-1">
                      {charges.map((charge) => (
                        <div
                          key={charge.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background p-3 text-sm"
                        >
                          <span className="text-foreground">
                            <span className="font-semibold">
                              {charge.category.name}
                            </span>{" "}
                            — {charge.description}
                          </span>
                          <span className="font-semibold text-foreground whitespace-nowrap">
                            {money(Number(charge.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {reservation.status === "COMPLETED" && payment && (
                  <div className="bg-muted rounded-xl p-4 flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Habitación</span>
                      <span className="font-semibold text-foreground">
                        {money(Number(payment.roomTotal))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Cargos adicionales
                      </span>
                      <span className="font-semibold text-foreground">
                        {money(Number(payment.chargesTotal))}
                      </span>
                    </div>
                    {payment.discount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Descuento — {payment.discount.name} (
                          {Number(payment.discount.percentage).toFixed(0)}%)
                        </span>
                        <span className="font-semibold text-destructive">
                          − {money(Number(payment.discountAmount))}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-border/50 mt-1 pt-2 flex justify-between items-center">
                      <span className="font-semibold text-foreground">
                        Total pagado
                      </span>
                      <span className="text-xl font-bold text-primary">
                        {money(Number(payment.grandTotal))}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {reservation.payment
                          ? PAYMENT_LABELS[reservation.payment.paymentMethod]
                          : "—"}{" "}
                        · {formatDate(payment.processedAt)}
                      </span>
                      <span className="text-muted-foreground">
                        Atendido por {payment.employee.firstName}{" "}
                        {payment.employee.lastName}
                      </span>
                    </div>

                    <button
                      onClick={handlePrint}
                      disabled={isPrinting}
                      className="w-full bg-primary text-primary-foreground h-11 rounded-lg font-semibold shadow hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                    >
                      {isPrinting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />{" "}
                          Generando...
                        </>
                      ) : (
                        <>
                          <Printer className="w-4 h-4" /> Regenerar comprobante
                        </>
                      )}
                    </button>
                  </div>
                )}

                {reservation.status === "CANCELLED" && (
                  <p className="text-sm text-muted-foreground rounded-xl border border-border/50 bg-background p-3 text-center">
                    Reserva cancelada. No hubo cobro ni comprobante.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
