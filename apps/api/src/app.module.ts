import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './providers/prisma/prisma.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { GuestsModule } from './modules/guests/guests.module';

@Module({
  imports: [PrismaModule, EmployeesModule, AuthModule, RoomsModule, ReservationsModule, GuestsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
