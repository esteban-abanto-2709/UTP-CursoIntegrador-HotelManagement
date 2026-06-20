import {
  IsOptional,
  IsString,
  IsNumberString,
  IsDateString,
} from 'class-validator';
import { CursorPaginationDto } from '@/common/pagination/cursor-pagination.dto';

export class FilterAuditLogsDto extends CursorPaginationDto {
  @IsOptional()
  @IsString()
  tableName?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'employeeId debe ser numérico' })
  employeeId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'from debe ser una fecha válida (ISO 8601)' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to debe ser una fecha válida (ISO 8601)' })
  to?: string;
}
