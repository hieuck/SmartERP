import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard - Role-based access control guard with multi-tenant isolation
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('admin', 'manager')
 * async someMethod() { ... }
 *
 * Security:
 * - Validates user has required role
 * - Validates tenant isolation (prevents cross-tenant access)
 * - Logs failed authorization attempts
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      // No roles required, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      // No user in request, deny access
      this.logger.warn('Authorization failed: No user in request', {
        endpoint: request.url,
        method: request.method,
        ip: request.ip,
      });
      return false;
    }

    // CRITICAL: Validate tenant isolation
    // Prevent cross-tenant data access
    const requestTenantId =
      request.params.tenantId || request.body?.tenantId || request.query?.tenantId;
    if (requestTenantId && user.tenantId !== requestTenantId) {
      this.logger.warn('Authorization failed: Cross-tenant access attempt', {
        userId: user.userId,
        userTenantId: user.tenantId,
        requestTenantId,
        endpoint: request.url,
        method: request.method,
        ip: request.ip,
      });
      return false;
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.warn('Authorization failed: Insufficient role', {
        userId: user.userId,
        tenantId: user.tenantId,
        userRole: user.role,
        requiredRoles,
        endpoint: request.url,
        method: request.method,
        ip: request.ip,
      });
    }

    return hasRole;
  }
}
