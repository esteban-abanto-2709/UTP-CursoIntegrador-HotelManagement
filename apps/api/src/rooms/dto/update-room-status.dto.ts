import { IsIn, IsNotEmpty } from 'class-validator';

export const VALID_ROOM_STATUSES = [
  'AVAILABLE',
  'OCCUPIED',
  'CLEANING',
  'MAINTENANCE',
] as const;

export type RoomStatusName = (typeof VALID_ROOM_STATUSES)[number];

export class UpdateRoomStatusDto {
  @IsIn(VALID_ROOM_STATUSES, {
    message: 'El estado debe ser AVAILABLE, OCCUPIED, CLEANING o MAINTENANCE',
  })
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  status: RoomStatusName;
}
