import { ExecutionContext, Injectable } from '@nestjs/common';
import {
  ThrottlerException,
  ThrottlerGuard as NestThrottlerGuard,
  ThrottlerLimitDetail,
} from '@nestjs/throttler';

type RequestWithTracker = {
  method?: string;
  url?: string;
  originalUrl?: string;
  cookies?: {
    refreshToken?: string;
  };
  body?: {
    refreshToken?: string;
  };
  user?: {
    id?: string;
  };
  ip?: string;
  connection?: {
    remoteAddress?: string;
  };
};

/**
 * Custom Throttler Guard
 *
 * Extends NestJS ThrottlerGuard to add custom rate limiting logic
 *
 * Features:
 * - IP-based rate limiting
 * - User-based rate limiting (if authenticated)
 * - Skip rate limiting for certain routes (using @SkipThrottle decorator)
 * - Custom error messages
 *
 * Usage:
 * ```typescript
 * @UseGuards(CustomThrottlerGuard)
 * @Controller('api')
 * export class MyController {}
 * ```
 *
 * Or apply globally in app.module.ts:
 * ```typescript
 * {
 *   provide: APP_GUARD,
 *   useClass: CustomThrottlerGuard,
 * }
 * ```
 */
@Injectable()
export class CustomThrottlerGuard extends NestThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithTracker>();
    const requestPath = request.originalUrl || request.url || '';

    if (
      request.method === 'POST' &&
      requestPath.endsWith('/auth/refresh') &&
      !request.cookies?.refreshToken &&
      !request.body?.refreshToken
    ) {
      return true;
    }

    return super.shouldSkip(context);
  }

  /**
   * Get tracker key for rate limiting
   *
   * Uses user ID if authenticated, otherwise falls back to IP address
   */
  protected async getTracker(req: RequestWithTracker): Promise<string> {
    // If user is authenticated, use user ID for tracking
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }

    // Otherwise, use IP address
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  /**
   * Handle rate limit exceeded
   *
   * Customize error message and response
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
    _throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const tracker = await this.getTracker(request);

    throw new ThrottlerException(`Rate limit exceeded for ${tracker}. Please try again later.`);
  }
}
