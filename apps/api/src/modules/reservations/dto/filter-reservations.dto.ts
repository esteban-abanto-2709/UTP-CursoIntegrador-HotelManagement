import { IsOptional, IsEnum, IsNumberString, IsDateString } from 'class-validator';
import { ReservationStatus } from '@prisma/client';

export class FilterReservationsDto {
  @IsOptional()
  @IsEnum(ReservationStatus, {
    message: 'El estado debe ser PENDING, ACTIVE, COMPLETED o CANCELLED',
  })
  status?: ReservationStatus;

  @IsOptional()
  @IsNumberString({}, { message: 'roomId debe ser numérico' })
  roomId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'from debe ser una fecha válida (ISO 8601)' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to debe ser una fecha válida (ISO 8601)' })
  to?: string;
}
