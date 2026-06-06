import { IsOptional, IsString } from 'class-validator';

export class FindGuestsDto {
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto' })
  search?: string;
}
