import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { GuestsModule } from '../guests/guests.module';
import { PaymentsModule } from '../payments/payments.module';
import { RoomChargesModule } from '../room-charges/room-charges.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [GuestsModule, PaymentsModule, RoomChargesModule, PdfModule],
  providers: [ReservationsService],
  controllers: [ReservationsController],
})
export class ReservationsModule {}
