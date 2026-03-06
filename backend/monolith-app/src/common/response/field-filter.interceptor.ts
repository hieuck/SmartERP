import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Field Filter Interceptor
 *
 * Allows clients to specify which fields to include/exclude in responses
 * Reduces payload size and improves performance
 *
 * Usage:
 * GET /api/products?fields=id,name,price
 * GET /api/products?exclude=description,metadata
 */
@Injectable()
export class FieldFilterInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const fields = request.query.fields;
    const exclude = request.query.exclude;

    return next.handle().pipe(
      map((data) => {
        // Skip if no filtering requested
        if (!fields && !exclude) {
          return data;
        }

        // Handle array responses
        if (Array.isArray(data)) {
          return data.map((item) => this.filterFields(item, fields, exclude));
        }

        // Handle paginated responses
        if (data && data.data && Array.isArray(data.data)) {
          return {
            ...data,
            data: data.data.map((item) => this.filterFields(item, fields, exclude)),
          };
        }

        // Handle single object
        return this.filterFields(data, fields, exclude);
      }),
    );
  }

  /**
   * Filter fields from object
   */
  private filterFields(
    obj: Record<string, unknown>,
    fields?: string,
    exclude?: string,
  ): Record<string, unknown> | unknown {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // Include specific fields
    if (fields) {
      const fieldList = fields.split(',').map((f) => f.trim());
      const filtered: Record<string, unknown> = {};

      fieldList.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(obj, field)) {
          filtered[field] = obj[field];
        }
      });

      return filtered;
    }

    // Exclude specific fields
    if (exclude) {
      const excludeList = exclude.split(',').map((f) => f.trim());
      const filtered = { ...obj };

      excludeList.forEach((field) => {
        delete filtered[field];
      });

      return filtered;
    }

    return obj;
  }
}

/**
 * Response Transform Interceptor
 *
 * Transforms response format for consistency
 * Adds metadata and wraps data
 */
@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        // Skip transformation for certain endpoints
        if (this.shouldSkipTransform(request.url)) {
          return data;
        }

        // Already transformed
        if (data && data.success !== undefined) {
          return data;
        }

        // Transform response
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }

  private shouldSkipTransform(url: string): boolean {
    const skipPatterns = ['/health', '/metrics', '/swagger', '/api-docs'];

    return skipPatterns.some((pattern) => url.includes(pattern));
  }
}

/**
 * JSON Optimization Interceptor
 *
 * Optimizes JSON serialization for better performance
 */
@Injectable()
export class JSONOptimizationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        // Remove null/undefined values
        return this.removeEmpty(data);
      }),
    );
  }

  private removeEmpty(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeEmpty(item));
    }

    if (obj && typeof obj === 'object') {
      const cleaned: Record<string, unknown> = {};

      Object.keys(obj).forEach((key) => {
        const value = (obj as Record<string, unknown>)[key];

        // Skip null/undefined
        if (value === null || value === undefined) {
          return;
        }

        // Recursively clean nested objects
        if (typeof value === 'object') {
          cleaned[key] = this.removeEmpty(value);
        } else {
          cleaned[key] = value;
        }
      });

      return cleaned;
    }

    return obj;
  }
}
