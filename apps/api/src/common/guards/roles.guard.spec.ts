import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const contextFor = (role?: string): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : undefined }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('permite el acceso si la ruta no declara @Roles()', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(contextFor('EMPLOYEE'))).toBe(true);
  });

  it('OWNER accede a una ruta restringida a OWNER/MANAGER', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['OWNER', 'MANAGER']);

    expect(guard.canActivate(contextFor('OWNER'))).toBe(true);
  });

  it('MANAGER accede a una ruta restringida a OWNER/MANAGER', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['OWNER', 'MANAGER']);

    expect(guard.canActivate(contextFor('MANAGER'))).toBe(true);
  });

  it('EMPLOYEE recibe 403 en una ruta restringida a OWNER/MANAGER', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['OWNER', 'MANAGER']);

    expect(() => guard.canActivate(contextFor('EMPLOYEE'))).toThrow(
      ForbiddenException,
    );
  });

  it('petición sin usuario autenticado recibe 403', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['OWNER']);

    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
