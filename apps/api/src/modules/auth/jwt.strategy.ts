import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-key-123',
    });
  }

  // Passport automáticamente verificará la firma del JWT.
  // Si es válido, extraerá el payload y llamará a esta función.
  // Lo que retornemos aquí se inyectará en el objeto `req.user` de NestJS.
  async validate(payload: any) {
    return { id: payload.sub, username: payload.username, role: payload.role };
  }
}
