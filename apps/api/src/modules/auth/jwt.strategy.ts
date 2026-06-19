import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JWT_SECRET } from './jwt.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  // Passport automáticamente verificará la firma del JWT.
  // Si es válido, extraerá el payload y llamará a esta función.
  // Lo que retornemos aquí se inyectará en el objeto `req.user` de NestJS.
  async validate(payload: any) {
    return { id: payload.sub, username: payload.username, role: payload.role };
  }
}
