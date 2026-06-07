import { IsOptional, IsString, IsNumberString, IsDateString } from 'class-validator';

export class FilterAuditLogsDto {
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
