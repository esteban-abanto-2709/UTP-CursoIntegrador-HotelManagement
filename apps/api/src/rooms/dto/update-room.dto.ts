import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { VALID_ROOM_TYPES } from './create-room.dto';
import type { RoomTypeName } from './create-room.dto';

export class UpdateRoomDto {
  @IsOptional()
  @IsString({ message: 'El número de habitación debe ser una cadena de texto' })
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'El número de habitación solo puede contener letras, números y guiones',
  })
  number?: string;

  @IsOptional()
  @IsIn(VALID_ROOM_TYPES, {
    message: 'El tipo de habitación debe ser SINGLE, DOUBLE o SUITE',
  })
  type?: RoomTypeName;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un número con hasta 2 decimales' },
  )
  @Min(0, { message: 'El precio no puede ser negativo' })
  price?: number;
}
