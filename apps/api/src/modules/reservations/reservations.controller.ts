import { Controller, Post, Get, Patch, Body, Param, Query, ParseIntPipe, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { FilterReservationsDto } from './dto/filter-reservations.dto';
import { CheckoutReservationDto } from './dto/checkout-reservation.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER', 'EMPLOYEE')
  create(
    @Body() dto: CreateReservationDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.reservationsService.create(dto, user.id);
  }

  @Get()
  findAll(@Query() filters: FilterReservationsDto) {
    return this.reservationsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.findOne(id);
  }

  @Get(':id/comprobante.pdf')
  async comprobante(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { filename, buffer } = await this.reservationsService.comprobantePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER', 'EMPLOYEE')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.reservationsService.update(id, dto, user.id);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER', 'EMPLOYEE')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.reservationsService.cancel(id, user.id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER', 'EMPLOYEE')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(id, dto);
  }

  @Patch(':id/checkin')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER', 'EMPLOYEE')
  checkIn(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.reservationsService.checkIn(id, user.id);
  }

  @Patch(':id/checkout')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'MANAGER', 'EMPLOYEE')
  checkOut(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CheckoutReservationDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.reservationsService.checkOut(id, dto, user.id);
  }
}
