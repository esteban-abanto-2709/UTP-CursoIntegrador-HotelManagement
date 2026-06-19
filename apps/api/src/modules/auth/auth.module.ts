import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EmployeesModule } from '@/modules/employees/employees.module';
import { JwtModule } from '@nestjs/jwt';

import { JwtStrategy } from './jwt.strategy';
import { JWT_SECRET } from './jwt.constants';

@Module({
  imports: [
    EmployeesModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '12h' }, // El token expirará en 12 horas
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
