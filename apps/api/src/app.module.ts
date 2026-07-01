import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './providers/prisma/prisma.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { GuestsModule } from './modules/guests/guests.module';
import { RoomChargesModule } from './modules/room-charges/room-charges.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AuditModule } from './modules/audit/audit.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [PrismaModule, EmployeesModule, AuthModule, RoomsModule, ReservationsModule, GuestsModule, RoomChargesModule, DiscountsModule, PaymentsModule, AuditModule, AnalyticsModule, ReportsModule, MailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
