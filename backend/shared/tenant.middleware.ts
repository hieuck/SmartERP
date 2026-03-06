import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export interface RequestWithTenant extends Request {
  tenantId?: string;
  userId?: string;
  userRole?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: RequestWithTenant, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

      // Extract tenant_id from JWT
      req.tenantId = decoded.tenant_id || decoded.tenantId;
      req.userId = decoded.user_id || decoded.userId || decoded.sub;
      req.userRole = decoded.role;

      if (!req.tenantId) {
        throw new UnauthorizedException('No tenant_id in token');
      }

      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

// Helper decorator to get tenant_id in controllers
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenant>();
    return request.tenantId;
  },
);

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenant>();
    return request.userId;
  },
);
