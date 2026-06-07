import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RoomChargesService } from './room-charges.service';
import { CreateRoomChargeDto } from './dto/create-room-charge.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('reservations/:id/charges')
@UseGuards(JwtAuthGuard)
export class RoomChargesController {
  constructor(private readonly roomChargesService: RoomChargesService) {}

  @Post()
  create(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateRoomChargeDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.roomChargesService.create(id, dto, user.id);
  }

  @Get()
  findAll(@Param('id', ParseIntPipe) id: number) {
    return this.roomChargesService.findByReservation(id);
  }
}
