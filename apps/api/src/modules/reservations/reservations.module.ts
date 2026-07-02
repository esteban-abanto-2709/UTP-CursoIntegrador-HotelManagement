import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { GuestsModule } from '../guests/guests.module';
import { PaymentsModule } from '../payments/payments.module';
import { RoomChargesModule } from '../room-charges/room-charges.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [GuestsModule, PaymentsModule, RoomChargesModule, MailModule],
  providers: [ReservationsService],
  controllers: [ReservationsController],
})
export class ReservationsModule {}
