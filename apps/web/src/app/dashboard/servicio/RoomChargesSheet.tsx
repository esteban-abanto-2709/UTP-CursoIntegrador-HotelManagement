"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/date";
import { getApiErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";
import { Loader2, Plus, Receipt } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export interface ActiveReservation {
  id: number;
  guest: { fullName: string; nationalId: string };
  room: { number: string; type: string };
  checkIn: string;
  checkOut: string;
}

interface ExpenseCategory {
  id: number;
  name: string;
}

interface RoomCharge {
  id: number;
  description: string;
  amount: string;
  chargedAt: string;
  category: { id: number; name: string };
}

interface RoomChargesSheetProps {
  reservation: ActiveReservation | null;
  onOpenChange: (open: boolean) => void;
}

export default function RoomChargesSheet({
  reservation,
  onOpenChange,
}: RoomChargesSheetProps) {
  const [charges, setCharges] = useState<RoomCharge[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const fetchData = useCallback(async (reservationId: number) => {
    setIsLoading(true);
    try {
      const [chargesRes, categoriesRes] = await Promise.all([
        api.get(routes.api.reservations.charges(reservationId)),
        api.get(routes.api.expenseCategories.list()),
      ]);
      setCharges(chargesRes.data);
      setCategories(categoriesRes.data);
    } catch {
      toast.error("Error al cargar los cargos de la reserva");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (reservation) {
      setCategoryId("");
      setDescription("");
      setAmount("");
      fetchData(reservation.id);
    }
  }, [reservation, fetchData]);

  const subtotal = charges.reduce((acc, c) => acc + Number(c.amount), 0);

  const handleSubmit = async () => {
    if (!reservation) return;

    const parsedAmount = Number(amount);
    if (!categoryId) {
      toast.error("Selecciona una categoría");
      return;
    }
    if (!description.trim()) {
      toast.error("La descripción es obligatoria");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    setIsSaving(true);
    try {
      await api.post(routes.api.reservations.charges(reservation.id), {
        categoryId: Number(categoryId),
        description: description.trim(),
        amount: parsedAmount,
      });
      toast.success("Cargo registrado");
      setDescription("");
      setAmount("");
      setCategoryId("");
      fetchData(reservation.id);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Error al registrar el cargo"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={reservation !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0">
        <SheetHeader className="border-b">
          <SheetTitle className="text-lg">Cargos a la habitación</SheetTitle>
          <SheetDescription>
            {reservation
              ? `${reservation.guest.fullName} · Cto. ${reservation.room.number}`
              : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Lista de cargos */}
          {isLoading ? (
            <div className="h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm">Cargando cargos...</span>
            </div>
          ) : charges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <Receipt className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Sin cargos aún. Agrega el primero abajo.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {charges.map((charge) => (
                <div
                  key={charge.id}
                  className="flex justify-between items-start gap-3 bg-muted rounded-xl p-3"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {charge.category.name}
                    </span>
                    <span className="text-sm font-medium text-foreground truncate">
                      {charge.description}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(charge.chargedAt)}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground whitespace-nowrap">
                    S/. {Number(charge.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Subtotal */}
          {charges.length > 0 && (
            <div className="border-t border-border/50 pt-3 flex justify-between items-center">
              <span className="font-semibold text-foreground">Subtotal</span>
              <span className="text-xl font-bold text-primary">
                S/. {subtotal.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Formulario nuevo cargo */}
        <div className="border-t p-4 flex flex-col gap-3">
          <span className="text-sm font-semibold text-foreground">
            Nuevo cargo
          </span>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-11 px-3 rounded-xl border border-border/50 bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. 2 aguas del minibar"
              className="h-11 px-3 rounded-xl border border-border/50 bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Monto (S/.)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-11 px-3 rounded-xl border border-border/50 bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-11 rounded-xl font-semibold shadow hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Agregar cargo
              </>
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
