export const RESERVATION_STATUSES = [
  "PENDING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: "Próxima",
  ACTIVE: "En hotel",
  COMPLETED: "Finalizada",
  CANCELLED: "Cancelada",
};

const RESERVATION_STATUS_CLASSES: Record<ReservationStatus, string> = {
  PENDING:
    "bg-status-cleaning-bg text-status-cleaning-text border-status-cleaning-border",
  ACTIVE:
    "bg-status-occupied-bg text-status-occupied-text border-status-occupied-border",
  COMPLETED:
    "bg-status-available-bg text-status-available-text border-status-available-border",
  CANCELLED:
    "bg-status-maintenance-bg text-status-maintenance-text border-status-maintenance-border",
};

export function getReservationStatusLabel(status: string): string {
  return RESERVATION_STATUS_LABELS[status as ReservationStatus] ?? status;
}

export function getReservationStatusClass(status: string): string {
  return RESERVATION_STATUS_CLASSES[status as ReservationStatus] ?? "";
}
