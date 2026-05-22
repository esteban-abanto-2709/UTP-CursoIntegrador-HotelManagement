import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EmployeesModule } from '@/modules/employees/employees.module';
import { JwtModule } from '@nestjs/jwt';

import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    EmployeesModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key-123', // En producción debe venir del .env
      signOptions: { expiresIn: '12h' }, // El token expirará en 12 horas
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
