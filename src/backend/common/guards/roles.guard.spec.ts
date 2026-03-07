import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { createMockUser } from '@/common/test/test-helpers';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockExecutionContext = (user?: any, params?: any, body?: any, query?: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params: params || {},
          body: body || {},
          query: query || {},
          url: '/api/test',
          method: 'GET',
          ip: '127.0.0.1',
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockExecutionContext({ userId: 'user-123', tenantId: 'tenant-123', role: 'user' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user is not in request', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const context = createMockExecutionContext(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow access when user has required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'manager']);
      const context = createMockExecutionContext({ userId: 'user-123', tenantId: 'tenant-123', role: 'admin' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'manager']);
      const context = createMockExecutionContext({ userId: 'user-123', tenantId: 'tenant-123', role: 'user' });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should deny access on cross-tenant access attempt via params', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const context = createMockExecutionContext(
        { userId: 'user-123', tenantId: 'tenant-123', role: 'admin' },
        { tenantId: 'tenant-456' },
      );

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should deny access on cross-tenant access attempt via body', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const context = createMockExecutionContext(
        { userId: 'user-123', tenantId: 'tenant-123', role: 'admin' },
        {},
        { tenantId: 'tenant-456' },
      );

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should deny access on cross-tenant access attempt via query', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const context = createMockExecutionContext(
        { userId: 'user-123', tenantId: 'tenant-123', role: 'admin' },
        {},
        {},
        { tenantId: 'tenant-456' },
      );

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow access when tenantId matches', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const context = createMockExecutionContext(
        { userId: 'user-123', tenantId: 'tenant-123', role: 'admin' },
        { tenantId: 'tenant-123' },
      );

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when no tenantId in request', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      const context = createMockExecutionContext({ userId: 'user-123', tenantId: 'tenant-123', role: 'admin' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'manager', 'supervisor']);
      const context = createMockExecutionContext({ userId: 'user-123', tenantId: 'tenant-123', role: 'manager' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
