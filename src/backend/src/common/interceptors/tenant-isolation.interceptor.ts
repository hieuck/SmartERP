// @ts-nocheck
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * TenantIsolationInterceptor
 *
 * Purpose: Ensure tenant data isolation in responses
 * Validates that returned data belongs to the authenticated tenant
 *
 * Security: Prevents cross-tenant data leaks
 *
 * Usage: Apply globally or to specific controllers
 * @UseInterceptors(TenantIsolationInterceptor)
 */
@Injectable()
export class TenantIsolationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantIsolationInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const userTenantId = request.user?.tenantId;

    return next.handle().pipe(
      tap((data) => {
        // Skip validation for public endpoints or non-authenticated requests
        if (!userTenantId) {
          return;
        }

        // Validate tenant isolation in response data
        this.validateTenantIsolation(data, userTenantId);
      }),
    );
  }

  /**
   * Validate that response data belongs to the authenticated tenant
   * @param data Response data
   * @param userTenantId Authenticated user's tenant ID
   */
  private validateTenantIsolation(data: unknown, userTenantId: string): void {
    if (!data) {
      return;
    }

    // Handle array responses
    if (Array.isArray(data)) {
      data.forEach((item) => this.validateTenantIsolation(item, userTenantId));
      return;
    }

    // Handle object responses
    if (typeof data === 'object') {
      // Check if object has tenantId field
      if (data.tenantId && data.tenantId !== userTenantId) {
        this.logger.error(
          `Tenant isolation violation: User tenant ${userTenantId} attempted to access data from tenant ${data.tenantId}`,
        );
        throw new ForbiddenException('Access denied: Tenant isolation violation');
      }

      // Check nested data property (common in API responses)
      if (data.data) {
        this.validateTenantIsolation(data.data, userTenantId);
      }

      // Check items array (common in paginated responses)
      if (data.items && Array.isArray(data.items)) {
        this.validateTenantIsolation(data.items, userTenantId);
      }
    }
  }
}
