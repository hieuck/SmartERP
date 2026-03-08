import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard as NestThrottlerGuard, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

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
  constructor(
    protected readonly reflector: Reflector,
    protected readonly storageService: ThrottlerStorage,
  ) {
    super(
      {
        throttlers: [
          {
            ttl: 60000, // 60 seconds
            limit: 100, // 100 requests per minute
          },
        ],
      },
      storageService,
      reflector,
    );
  }

  /**
   * Get tracker key for rate limiting
   * 
   * Uses user ID if authenticated, otherwise falls back to IP address
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // If user is authenticated, use user ID for tracking
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }

    // Otherwise, use IP address
    return req.ip || req.connection.remoteAddress;
  }

  /**
   * Handle rate limit exceeded
   * 
   * Customize error message and response
   */
  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const tracker = await this.getTracker(request);
    
    throw new Error(
      `Rate limit exceeded for ${tracker}. Please try again later.`,
    );
  }
}
