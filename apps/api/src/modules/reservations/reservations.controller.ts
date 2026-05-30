import { Controller, Post, Get, Patch, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { CheckoutReservationDto } from './dto/checkout-reservation.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.create(dto);
  }

  @Get()
  findAll() {
    return this.reservationsService.findAll();
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(id, dto);
  }

  @Patch(':id/checkin')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  checkIn(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.checkIn(id);
  }

  @Patch(':id/checkout')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER')
  checkOut(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CheckoutReservationDto,
  ) {
    return this.reservationsService.checkOut(id, dto);
  }
}
