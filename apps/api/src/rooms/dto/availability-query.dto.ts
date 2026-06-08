import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsNumberString,
} from 'class-validator';
import { VALID_ROOM_TYPES } from './create-room.dto';
import type { RoomTypeName } from './create-room.dto';

export class AvailabilityQueryDto {
  @IsDateString(
    {},
    { message: 'checkIn debe ser una fecha válida (ISO 8601)' },
  )
  checkIn: string;

  @IsDateString(
    {},
    { message: 'checkOut debe ser una fecha válida (ISO 8601)' },
  )
  checkOut: string;

  @IsIn(VALID_ROOM_TYPES, {
    message: 'El tipo de habitación debe ser SINGLE, DOUBLE o SUITE',
  })
  @IsNotEmpty({ message: 'El tipo de habitación es obligatorio' })
  type: RoomTypeName;

  @IsOptional()
  @IsNumberString({}, { message: 'excludeReservationId debe ser numérico' })
  excludeReservationId?: string;
}
