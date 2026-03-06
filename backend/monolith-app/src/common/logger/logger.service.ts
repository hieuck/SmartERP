import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import { loggerConfig } from './logger.config';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor() {
    this.logger = winston.createLogger(loggerConfig);
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    this.logger.info(message, {
      context: context || this.context,
    });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, {
      context: context || this.context,
      trace,
    });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, {
      context: context || this.context,
    });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, {
      context: context || this.context,
    });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, {
      context: context || this.context,
    });
  }

  // Additional methods for structured logging
  logWithMetadata(level: string, message: string, metadata: Record<string, unknown>) {
    this.logger.log(level, message, {
      context: this.context,
      ...metadata,
    });
  }

  logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
    tenantId?: string,
  ) {
    this.logger.info('HTTP Request', {
      context: 'HTTP',
      method,
      url,
      statusCode,
      responseTime,
      userId,
      tenantId,
    });
  }

  logDatabaseQuery(query: string, duration: number, tenantId?: string) {
    this.logger.debug('Database Query', {
      context: 'Database',
      query,
      duration,
      tenantId,
    });
  }

  logBusinessEvent(
    event: string,
    data: Record<string, unknown>,
    userId?: string,
    tenantId?: string,
  ) {
    this.logger.info('Business Event', {
      context: 'Business',
      event,
      data,
      userId,
      tenantId,
    });
  }
}
