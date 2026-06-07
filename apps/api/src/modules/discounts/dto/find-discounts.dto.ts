import { IsOptional, IsBooleanString } from 'class-validator';

export class FindDiscountsDto {
  @IsOptional()
  @IsBooleanString({ message: 'active debe ser "true" o "false"' })
  active?: string;
}
