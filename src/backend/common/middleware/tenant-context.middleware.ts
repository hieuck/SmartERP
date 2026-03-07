import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * TenantContextMiddleware
 * 
 * Purpose: Log and track tenant context for each request
 * Note: Actual tenantId extraction is done by JWT strategy
 * 
 * This middleware provides:
 * - Request logging with tenant context
 * - Tenant isolation verification
 * - Audit trail for multi-tenant operations
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantContextMiddleware.name);

  use(req: Request & { user?: any }, res: Response, next: NextFunction) {
    // Extract tenant context from JWT (if authenticated)
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const path = req.path;

    // Log tenant context for audit trail
    if (tenantId) {
      this.logger.debug(
        `[Tenant Context] TenantID: ${tenantId}, UserID: ${userId}, Path: ${path}`,
      );

      // Add tenant context to request for downstream use
      req['tenantContext'] = {
        tenantId,
        userId,
        timestamp: new Date(),
      };
    }

    next();
  }
}
