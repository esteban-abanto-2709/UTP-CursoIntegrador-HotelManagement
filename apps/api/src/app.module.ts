import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './providers/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, RoomsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
