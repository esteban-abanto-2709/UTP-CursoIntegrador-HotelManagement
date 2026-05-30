import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsNumberString,
} from 'class-validator';
import { RoomType } from '@prisma/client';

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

  @IsEnum(RoomType, {
    message: 'El tipo de habitación debe ser SINGLE, DOUBLE o SUITE',
  })
  @IsNotEmpty({ message: 'El tipo de habitación es obligatorio' })
  type: RoomType;

  @IsOptional()
  @IsNumberString({}, { message: 'excludeReservationId debe ser numérico' })
  excludeReservationId?: string;
}
