import { IsOptional, IsNumberString } from 'class-validator';

export class CursorPaginationDto {
  @IsOptional()
  @IsNumberString({}, { message: 'cursor debe ser numérico' })
  cursor?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'take debe ser numérico' })
  take?: string;
}

export const DEFAULT_TAKE = 20;
export const MAX_TAKE = 100;
