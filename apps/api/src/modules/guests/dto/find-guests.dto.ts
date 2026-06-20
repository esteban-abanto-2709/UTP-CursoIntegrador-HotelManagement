import { IsOptional, IsString } from 'class-validator';
import { CursorPaginationDto } from '@/common/pagination/cursor-pagination.dto';

export class FindGuestsDto extends CursorPaginationDto {
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto' })
  search?: string;
}
