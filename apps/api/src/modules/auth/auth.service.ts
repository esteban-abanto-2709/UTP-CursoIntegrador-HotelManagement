import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EmployeesService } from '@/modules/employees/employees.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private employeesService: EmployeesService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.employeesService.findByUsername(username);

    // Comparamos la contraseña en texto plano con el hash de la DB
    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // 2. Genera el JWT con la información esencial del usuario
  async login(user: any) {
    const payload = {
      sub: user.id, // El 'sub' (subject) es el estandar para el ID en JWT
      username: user.username,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }
}
