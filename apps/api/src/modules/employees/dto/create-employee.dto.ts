import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsDateString,
  IsIn,
} from 'class-validator';

export const VALID_CARGOS = [
  'Manager',
  'Recepcionista',
  'Botones',
  'Limpieza',
] as const;

export type Cargo = (typeof VALID_CARGOS)[number];

export const VALID_TURNOS = ['MAÑANA', 'TARDE', 'NOCHE'] as const;

export type Turno = (typeof VALID_TURNOS)[number];

export class CreateEmployeeDto {
  @IsString()
  @MinLength(3, { message: 'El usuario debe tener al menos 3 caracteres' })
  username!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;

  @IsString()
  @MinLength(8, { message: 'El DNI debe tener al menos 8 caracteres' })
  dni!: string;

  @IsString()
  nombres!: string;

  @IsString()
  apellidoPaterno!: string;

  @IsString()
  apellidoMaterno!: string;

  @IsDateString()
  fechaNacimiento!: string;

  @IsIn(VALID_CARGOS, { message: 'Cargo inválido' })
  cargo!: Cargo;

  @IsIn(VALID_TURNOS, { message: 'Turno inválido' })
  turno!: Turno;

  @IsDateString()
  fechaInicio!: string;

  @IsString()
  @MinLength(9, { message: 'El teléfono debe tener al menos 9 dígitos' })
  telefono!: string;

  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email!: string;

  @IsOptional()
  @IsString()
  direccion?: string;
}
