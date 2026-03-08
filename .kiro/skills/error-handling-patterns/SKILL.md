---
name: error-handling-patterns
description: Error handling and logging patterns for consistent error management across the application. Use when implementing error handling, logging, or debugging issues.
---

# Error Handling & Logging Patterns

## 1. Custom Exceptions

```typescript
export class BusinessException extends HttpException {
  constructor(message: string, statusCode: number = 400) {
    super({ success: false, error: message, statusCode }, statusCode);
  }
}

export class TenantIsolationException extends BusinessException {
  constructor() {
    super('Access denied: Tenant isolation violation', 403);
  }
}
```

## 2. Global Exception Filter

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    this.logger.error({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json({
      success: false,
      error: message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

## 3. Structured Logging

```typescript
this.logger.log({
  level: 'info',
  message: 'User logged in',
  userId: user.id,
  tenantId: user.tenantId,
  timestamp: new Date(),
});

this.logger.error({
  level: 'error',
  message: 'Database connection failed',
  error: error.message,
  stack: error.stack,
});
```

## 4. Error Response Format

```typescript
{
  "success": false,
  "error": "Product not found",
  "statusCode": 404,
  "timestamp": "2026-03-08T21:00:00Z",
  "path": "/api/products/123"
}
```
