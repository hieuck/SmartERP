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

type RequestWithTenant = {
  user?: {
    tenantId?: string;
  };
};

type TenantScopedRecord = {
  tenantId?: string;
  data?: unknown;
  items?: unknown;
};

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
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
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
    if (typeof data === 'object' && data !== null) {
      const scopedData = data as TenantScopedRecord;

      // Check if object has tenantId field
      if (scopedData.tenantId && scopedData.tenantId !== userTenantId) {
        this.logger.error(
          `Tenant isolation violation: User tenant ${userTenantId} attempted to access data from tenant ${scopedData.tenantId}`,
        );
        throw new ForbiddenException('Access denied: Tenant isolation violation');
      }

      // Check nested data property (common in API responses)
      if (scopedData.data) {
        this.validateTenantIsolation(scopedData.data, userTenantId);
      }

      // Check items array (common in paginated responses)
      if (Array.isArray(scopedData.items)) {
        this.validateTenantIsolation(scopedData.items, userTenantId);
      }
    }
  }
}
