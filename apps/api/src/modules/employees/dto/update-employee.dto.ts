import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Turno } from '@prisma/client';
import { VALID_CARGOS } from './create-employee.dto';
import type { Cargo } from './create-employee.dto';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'El usuario debe tener al menos 3 caracteres' })
  username?: string;

  // Opcional: solo se re-hashea si se envía una nueva contraseña
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'El DNI debe tener al menos 8 caracteres' })
  dni?: string;

  @IsOptional()
  @IsString()
  nombres?: string;

  @IsOptional()
  @IsString()
  apellidoPaterno?: string;

  @IsOptional()
  @IsString()
  apellidoMaterno?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsIn(VALID_CARGOS, { message: 'Cargo inválido' })
  cargo?: Cargo;

  @IsOptional()
  @IsEnum(Turno, { message: 'Turno inválido' })
  turno?: Turno;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsString()
  @MinLength(9, { message: 'El teléfono debe tener al menos 9 dígitos' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email?: string;

  @IsOptional()
  @IsString()
  direccion?: string;
}
