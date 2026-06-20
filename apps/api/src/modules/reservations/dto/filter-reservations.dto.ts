import {
  IsOptional,
  IsIn,
  IsNumberString,
  IsDateString,
  IsString,
} from 'class-validator';
import { VALID_RESERVATION_STATUSES } from './update-reservation-status.dto';
import type { ReservationStatusName } from './update-reservation-status.dto';
import { CursorPaginationDto } from '@/common/pagination/cursor-pagination.dto';

export class FilterReservationsDto extends CursorPaginationDto {
  @IsOptional()
  @IsIn(VALID_RESERVATION_STATUSES, {
    message: 'El estado debe ser PENDING, ACTIVE, COMPLETED o CANCELLED',
  })
  status?: ReservationStatusName;

  @IsOptional()
  @IsNumberString({}, { message: 'roomId debe ser numérico' })
  roomId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'from debe ser una fecha válida (ISO 8601)' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to debe ser una fecha válida (ISO 8601)' })
  to?: string;

  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto' })
  search?: string;
}
