import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

/**
 * Tenant Middleware - Extract tenant_id from JWT or subdomain
 * This middleware MUST be applied to all routes
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract tenant_id from JWT token
      const token = this.extractTokenFromHeader(req);
      
      if (token) {
        const payload = this.jwtService.verify(token);
        req['tenantId'] = payload.tenant_id;
        req['userId'] = payload.sub;
      } else {
        // Fallback: Extract from subdomain (for public endpoints)
        const subdomain = this.extractSubdomain(req);
        if (subdomain) {
          // TODO: Query tenant by subdomain
          req['tenantId'] = subdomain; // Temporary
        }
      }

      // CRITICAL: Ensure tenant_id is present
      if (!req['tenantId']) {
        throw new UnauthorizedException('Tenant ID is required');
      }

      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid tenant context');
    }
  }

  private extractTokenFromHeader(req: Request): string | undefined {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private extractSubdomain(req: Request): string | undefined {
    const host = req.headers.host || '';
    const parts = host.split('.');
    
    // Example: tenant1.plaster-erp.com -> tenant1
    if (parts.length >= 3) {
      return parts[0];
    }
    
    return undefined;
  }
}
