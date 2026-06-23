"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ReservationFormDialog, {
  type ReservationForEdit,
} from "@/components/reservation-form-dialog";

interface ReservationDialogContextValue {
  openCreate: () => void;
  openEdit: (reservation: ReservationForEdit) => void;
  onSaved: (callback: () => void) => () => void;
}

const ReservationDialogContext =
  createContext<ReservationDialogContextValue | null>(null);

export function useReservationDialog() {
  const ctx = useContext(ReservationDialogContext);
  if (!ctx) {
    throw new Error(
      "useReservationDialog debe usarse dentro de ReservationDialogProvider",
    );
  }
  return ctx;
}

export function ReservationDialogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReservationForEdit | null>(null);
  const subscribersRef = useRef<Set<() => void>>(new Set());

  const openCreate = useCallback(() => {
    setEditing(null);
    setOpen(true);
  }, []);

  const openEdit = useCallback((reservation: ReservationForEdit) => {
    setEditing(reservation);
    setOpen(true);
  }, []);

  const onSaved = useCallback((callback: () => void) => {
    const subscribers = subscribersRef.current;
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  }, []);

  const handleSuccess = useCallback(() => {
    subscribersRef.current.forEach((callback) => callback());
  }, []);

  return (
    <ReservationDialogContext.Provider value={{ openCreate, openEdit, onSaved }}>
      {children}
      <ReservationFormDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
        reservation={editing}
      />
    </ReservationDialogContext.Provider>
  );
}
