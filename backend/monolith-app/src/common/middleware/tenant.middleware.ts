import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

// Extend Express Request to include tenantId
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenantId?: string;
      userId?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Skip tenant check for public routes
    const publicRoutes = ['/api/health', '/api/auth/login', '/api/auth/register', '/api/docs'];

    const isPublicRoute = publicRoutes.some((route) => req.path.startsWith(route));

    if (isPublicRoute) {
      return next();
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Let auth guards handle authentication
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      // Verify and decode JWT token
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });

      // Extract tenantId and userId from token
      req.tenantId = decoded.tenantId;
      req.userId = decoded.sub || decoded.userId;

      // Log tenant context for debugging
      if (process.env.NODE_ENV === 'development') {
        this.logger.log(
          `[Tenant Context] TenantID: ${req.tenantId}, UserID: ${req.userId}, Path: ${req.path}`,
        );
      }
    } catch (error) {
      // Invalid token - let auth guards handle it
      this.logger.warn('[Tenant Middleware] Invalid token:', error.message);
    }

    next();
  }
}
