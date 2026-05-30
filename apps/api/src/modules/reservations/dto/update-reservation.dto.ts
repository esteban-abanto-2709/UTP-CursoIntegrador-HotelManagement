import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class UpdateReservationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  guestName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  dni?: string;

  @IsOptional()
  @IsInt()
  roomId?: number;

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;
}
