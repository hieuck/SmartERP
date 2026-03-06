import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as crypto from 'crypto';

/**
 * ETag Interceptor
 *
 * Implements HTTP ETag for cache validation
 * Reduces bandwidth by returning 304 Not Modified when content hasn't changed
 */
@Injectable()
export class ETagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Only apply to GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    return next.handle().pipe(
      tap((data) => {
        // Generate ETag from response data
        const etag = this.generateETag(data);

        // Set ETag header
        response.setHeader('ETag', etag);

        // Check if client has matching ETag
        const clientETag = request.headers['if-none-match'];

        if (clientETag === etag) {
          // Content hasn't changed, return 304
          response.status(304).send();
        } else {
          // Set cache headers
          response.setHeader('Cache-Control', 'private, must-revalidate');
        }
      }),
    );
  }

  /**
   * Generate ETag from response data
   */
  private generateETag(data: unknown): string {
    const content = JSON.stringify(data);
    const hash = crypto.createHash('md5').update(content).digest('hex');
    return `"${hash}"`;
  }
}

/**
 * Strong ETag Generator
 * Uses SHA-256 for stronger validation
 */
export class StrongETagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    if (request.method !== 'GET') {
      return next.handle();
    }

    return next.handle().pipe(
      tap((data) => {
        const etag = this.generateStrongETag(data);
        response.setHeader('ETag', etag);

        const clientETag = request.headers['if-none-match'];

        if (clientETag === etag) {
          response.status(304).send();
        } else {
          response.setHeader('Cache-Control', 'private, must-revalidate');
        }
      }),
    );
  }

  private generateStrongETag(data: unknown): string {
    const content = JSON.stringify(data);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `"${hash}"`;
  }
}

/**
 * Weak ETag Generator
 * Faster but less precise validation
 */
export class WeakETagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    if (request.method !== 'GET') {
      return next.handle();
    }

    return next.handle().pipe(
      tap((data) => {
        const etag = this.generateWeakETag(data);
        response.setHeader('ETag', `W/${etag}`);

        const clientETag = request.headers['if-none-match'];

        if (clientETag === `W/${etag}` || clientETag === etag) {
          response.status(304).send();
        } else {
          response.setHeader('Cache-Control', 'private, must-revalidate');
        }
      }),
    );
  }

  private generateWeakETag(data: unknown): string {
    // Use content length and timestamp for weak validation
    const content = JSON.stringify(data);
    const length = content.length;
    const timestamp = Date.now();
    return `"${length}-${timestamp}"`;
  }
}
