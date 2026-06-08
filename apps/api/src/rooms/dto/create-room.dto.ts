import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export const VALID_ROOM_TYPES = ['SINGLE', 'DOUBLE', 'SUITE'] as const;

export type RoomTypeName = (typeof VALID_ROOM_TYPES)[number];

export class CreateRoomDto {
  @IsString({ message: 'El número de habitación debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El número de habitación es obligatorio' })
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'El número de habitación solo puede contener letras, números y guiones',
  })
  number: string;

  @IsIn(VALID_ROOM_TYPES, {
    message: 'El tipo de habitación debe ser SINGLE, DOUBLE o SUITE',
  })
  @IsNotEmpty({ message: 'El tipo de habitación es obligatorio' })
  type: RoomTypeName;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un número con hasta 2 decimales' },
  )
  @Min(0, { message: 'El precio no puede ser negativo' })
  price: number;
}
