import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * UserId decorator - Extract userId from authenticated user
 *
 * Usage:
 * async someMethod(@UserId() userId: string) { ... }
 *
 * Requires JwtAuthGuard to be applied first
 */
export const UserId = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.id || request.user?.userId;
});
