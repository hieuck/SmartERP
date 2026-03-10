import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const SKIP_CSRF_KEY = 'skipCsrf';

/**
 * CSRF Protection Guard
 *
 * Implements CSRF protection using Double Submit Cookie pattern:
 * - Validates CSRF token from header matches cookie
 * - Protects state-changing operations (POST, PUT, PATCH, DELETE)
 * - Safe methods (GET, HEAD, OPTIONS) are allowed
 * - Can be skipped with @SkipCsrf() decorator
 *
 * Usage:
 * - Global guard in app.module.ts
 * - Use @SkipCsrf() decorator for public endpoints
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if CSRF should be skipped
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCsrf) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    // Safe methods don't need CSRF protection
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(method)) {
      return true;
    }

    // Get CSRF token from header and cookie
    const tokenFromHeader = request.headers['x-csrf-token'] as string;
    const tokenFromCookie = request.cookies?.['csrf-token'];

    // Validate CSRF token
    if (!tokenFromHeader || !tokenFromCookie) {
      throw new ForbiddenException('CSRF token missing');
    }

    if (tokenFromHeader !== tokenFromCookie) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    return true;
  }
}
