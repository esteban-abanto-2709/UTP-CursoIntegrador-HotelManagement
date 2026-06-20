import {
  getReservationStatusClass,
  getReservationStatusLabel,
} from "@/lib/reservation";

export function ReservationStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full font-semibold border ${getReservationStatusClass(status)}`}
    >
      {getReservationStatusLabel(status)}
    </span>
  );
}
