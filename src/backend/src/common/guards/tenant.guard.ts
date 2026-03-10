import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * TenantGuard - Ensures tenant isolation
 *
 * Validates that the user's tenantId matches the requested resource's tenantId
 * This prevents cross-tenant data access
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, TenantGuard)
 * async someMethod(@Param('id') id: string) { ... }
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!user.tenantId) {
      throw new ForbiddenException('User has no tenant association');
    }

    // Add tenantId to request for easy access in services
    request.tenantId = user.tenantId;

    return true;
  }
}
