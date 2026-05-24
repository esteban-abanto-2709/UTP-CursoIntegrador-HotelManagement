import { IsEnum, IsNotEmpty } from 'class-validator';
import { RoomStatus } from '@prisma/client';

export class UpdateRoomStatusDto {
  @IsEnum(RoomStatus, {
    message: 'El estado debe ser AVAILABLE, OCCUPIED, CLEANING o MAINTENANCE',
  })
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  status: RoomStatus;
}
