import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { RoomType } from '@prisma/client';

export class UpdateRoomDto {
  @IsOptional()
  @IsString({ message: 'El número de habitación debe ser una cadena de texto' })
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'El número de habitación solo puede contener letras, números y guiones',
  })
  number?: string;

  @IsOptional()
  @IsEnum(RoomType, {
    message: 'El tipo de habitación debe ser SINGLE, DOUBLE o SUITE',
  })
  type?: RoomType;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un número con hasta 2 decimales' },
  )
  @Min(0, { message: 'El precio no puede ser negativo' })
  price?: number;
}
