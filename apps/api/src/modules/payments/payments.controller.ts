import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get(':reservationId')
  findByReservation(
    @Param('reservationId', ParseIntPipe) reservationId: number,
  ) {
    return this.paymentsService.findByReservation(reservationId);
  }
}
