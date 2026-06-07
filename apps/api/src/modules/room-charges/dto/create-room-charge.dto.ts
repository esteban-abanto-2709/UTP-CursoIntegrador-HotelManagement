import {
  IsInt,
  IsPositive,
  IsString,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';

export class CreateRoomChargeDto {
  @IsInt({ message: 'La categoría debe ser un entero' })
  @IsPositive({ message: 'La categoría es obligatoria' })
  categoryId: number;

  @IsString({ message: 'La descripción debe ser texto' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  description: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El monto debe ser un número con máximo 2 decimales' },
  )
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  amount: number;
}
