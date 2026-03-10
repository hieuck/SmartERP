import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';
import { createMockUser } from '@/common/test/test-helpers';

describe('TenantGuard', () => {
  let guard: TenantGuard;

  beforeEach(() => {
    guard = new TenantGuard();
  });

  const createMockExecutionContext = (user?: any): ExecutionContext => {
    const request = {
      user,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should throw ForbiddenException when user is not authenticated', () => {
      const context = createMockExecutionContext(undefined);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('User not authenticated');
    });

    it('should throw ForbiddenException when user has no tenantId', () => {
      const context = createMockExecutionContext({ userId: 'user-123' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('User has no tenant association');
    });

    it('should allow access and add tenantId to request when user has tenantId', () => {
      const user = { userId: 'user-123', tenantId: 'tenant-123' };
      const context = createMockExecutionContext(user);
      const request = context.switchToHttp().getRequest();

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.tenantId).toBe('tenant-123');
    });

    it('should allow access for different tenants', () => {
      const user1 = { userId: 'user-123', tenantId: 'tenant-123' };
      const context1 = createMockExecutionContext(user1);

      const result1 = guard.canActivate(context1);
      expect(result1).toBe(true);

      const user2 = { userId: 'user-456', tenantId: 'tenant-456' };
      const context2 = createMockExecutionContext(user2);

      const result2 = guard.canActivate(context2);
      expect(result2).toBe(true);
    });
  });
});
