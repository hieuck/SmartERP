import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger: LoggerService;

  constructor() {
    this.logger = new LoggerService();
    this.logger.setContext('ExceptionFilter');
  }

  private isExpectedRefreshMiss(
    method: string,
    url: string,
    status: number,
    errorMessage: string,
  ): boolean {
    return (
      method === 'POST' &&
      status === HttpStatus.UNAUTHORIZED &&
      errorMessage === 'Refresh token not provided' &&
      (url === '/api/auth/refresh' || url.endsWith('/api/auth/refresh'))
    );
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    // Extract error details
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'Internal server error';
    const errorDetails: Record<string, unknown> = {};

    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
      errorCode = this.getErrorCode(status);
    } else if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as Record<string, unknown>;
      errorCode = this.getErrorCode(status);

      // Handle validation errors (message as array)
      if (responseObj.message && Array.isArray(responseObj.message)) {
        errorDetails.validationErrors = responseObj.message;
        errorMessage = responseObj.message[0] || errorMessage; // Use first error as main message
      } else {
        errorMessage = (responseObj.message as string) || errorMessage;
      }
    }

    // Standardized error response format
    const errorResponse = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        ...(Object.keys(errorDetails).length > 0 && { details: errorDetails }),
      },
    };

    // Extract user and tenant from request
    const user = (request as Request & { user?: { id?: string; tenantId?: string } }).user;
    const userId = user?.id;
    const tenantId = user?.tenantId;

    const logMessage = `${request.method} ${request.url} - ${errorMessage} - ${JSON.stringify({
      statusCode: status,
      errorCode,
      userId,
      tenantId,
      body: request.body,
      query: request.query,
      params: request.params,
    })}`;
    const logStack = exception instanceof Error ? exception.stack : '';

    if (status >= 500) {
      this.logger.error(logMessage, logStack);
    } else if (this.isExpectedRefreshMiss(request.method, request.url, status, errorMessage)) {
      this.logger.log(logMessage);
    } else {
      this.logger.warn(logMessage);
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Get error code from HTTP status
   */
  private getErrorCode(status: number): string {
    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'TOO_MANY_REQUESTS',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return errorCodes[status] || 'INTERNAL_SERVER_ERROR';
  }
}
