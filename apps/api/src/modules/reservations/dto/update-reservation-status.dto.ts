import { IsIn } from 'class-validator';

export const VALID_RESERVATION_STATUSES = [
  'PENDING',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
] as const;

export type ReservationStatusName = (typeof VALID_RESERVATION_STATUSES)[number];

export class UpdateReservationStatusDto {
  @IsIn(VALID_RESERVATION_STATUSES, {
    message: 'El estado debe ser PENDING, ACTIVE, COMPLETED o CANCELLED',
  })
  status: ReservationStatusName;
}
