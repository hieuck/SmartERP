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

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as Record<string, unknown>).message,
    };

    // Extract user and tenant from request
    const user = (request as Request & { user?: { id?: string; tenantId?: string } }).user;
    const userId = user?.id;
    const tenantId = user?.tenantId;

    // Log error with full context
    this.logger.error(
      `${request.method} ${request.url} - ${errorResponse.message} - ${JSON.stringify({
        statusCode: status,
        userId,
        tenantId,
        body: request.body,
        query: request.query,
        params: request.params,
      })}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json(errorResponse);
  }
}
