import { IsOptional, IsIn, IsString } from 'class-validator';
import { CursorPaginationDto } from '@/common/pagination/cursor-pagination.dto';
import { VALID_ROOM_TYPES } from './create-room.dto';
import type { RoomTypeName } from './create-room.dto';
import { VALID_ROOM_STATUSES } from './update-room-status.dto';
import type { RoomStatusName } from './update-room-status.dto';

export class FindRoomsDto extends CursorPaginationDto {
  @IsOptional()
  @IsIn(VALID_ROOM_TYPES, {
    message: 'El tipo de habitación debe ser SINGLE, DOUBLE o SUITE',
  })
  type?: RoomTypeName;

  @IsOptional()
  @IsIn(VALID_ROOM_STATUSES, {
    message: 'El estado debe ser AVAILABLE, OCCUPIED, CLEANING o MAINTENANCE',
  })
  status?: RoomStatusName;

  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto' })
  search?: string;
}
