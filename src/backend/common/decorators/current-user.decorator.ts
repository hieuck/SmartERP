import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../security/permission.service';

/**
 * Extract current user from request
 * 
 * Usage:
 * @Get()
 * findAll(@CurrentUser() user: User) {
 *   return this.service.findAll(user);
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    const { user: authUser, tenantId } = request;
    
    return {
      id: authUser?.id || 'system',
      tenantId: tenantId || authUser?.tenantId,
      roles: authUser?.roles || ['user'],
    };
  },
);
