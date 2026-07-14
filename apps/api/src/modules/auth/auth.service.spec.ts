import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let employees: any;
  let jwt: any;

  const storedUser = {
    id: 1,
    username: 'admin',
    password: bcrypt.hashSync('secreto123', 10),
    role: 'OWNER',
    firstName: 'Esteban',
    lastName: 'Abanto',
  };

  beforeEach(() => {
    employees = { findByUsername: jest.fn() };
    jwt = { sign: jest.fn().mockReturnValue('jwt-token') };
    service = new AuthService(employees, jwt);
  });

  describe('validateUser', () => {
    it('con credenciales correctas devuelve el usuario sin la contraseña', async () => {
      employees.findByUsername.mockResolvedValue(storedUser);

      const result = await service.validateUser('admin', 'secreto123');

      expect(result).toMatchObject({ id: 1, username: 'admin', role: 'OWNER' });
      expect(result.password).toBeUndefined();
    });

    it('con contraseña incorrecta devuelve null', async () => {
      employees.findByUsername.mockResolvedValue(storedUser);

      expect(await service.validateUser('admin', 'incorrecta')).toBeNull();
    });

    it('con usuario inexistente devuelve null', async () => {
      employees.findByUsername.mockResolvedValue(null);

      expect(await service.validateUser('nadie', 'secreto123')).toBeNull();
    });
  });

  describe('login', () => {
    it('firma el JWT con sub, username y role', async () => {
      const result = await service.login(storedUser);

      expect(jwt.sign).toHaveBeenCalledWith({
        sub: 1,
        username: 'admin',
        role: 'OWNER',
      });
      expect(result.access_token).toBe('jwt-token');
      expect(result.user).toEqual({
        id: 1,
        username: 'admin',
        role: 'OWNER',
        nombres: 'Esteban',
        apellidoPaterno: 'Abanto',
      });
    });
  });
});
