import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * TenantId decorator - Extract tenantId from authenticated user
 *
 * Usage:
 * async someMethod(@TenantId() tenantId: string) { ... }
 *
 * Requires JwtAuthGuard to be applied first
 */
export const TenantId = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.tenantId || request.tenantId;
});
