import { CallHandler, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  it('logs auth failures as warnings instead of errors', (done) => {
    const interceptor = new LoggingInterceptor();
    const warn = jest.fn();
    const error = jest.fn();

    (interceptor as unknown as { logger: { log: jest.Mock; warn: jest.Mock; error: jest.Mock } })
      .logger = {
      log: jest.fn(),
      warn,
      error,
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          url: '/api/auth/refresh',
          user: undefined,
        }),
        getResponse: () => ({
          statusCode: 401,
        }),
      }),
    } as ExecutionContext;

    interceptor
      .intercept(context, {
        handle: () => throwError(() => new UnauthorizedException('Refresh token not provided')),
      } as CallHandler)
      .subscribe({
        error: () => {
          expect(warn).toHaveBeenCalledWith(
            expect.objectContaining({
              type: 'error',
              method: 'POST',
              url: '/api/auth/refresh',
              statusCode: 401,
              error: 'Refresh token not provided',
            }),
          );
          expect(error).not.toHaveBeenCalled();
          done();
        },
      });
  });

  it('skips success logs for health endpoints', (done) => {
    const interceptor = new LoggingInterceptor();
    const log = jest.fn();
    const warn = jest.fn();
    const error = jest.fn();

    (interceptor as unknown as { logger: { log: jest.Mock; warn: jest.Mock; error: jest.Mock } })
      .logger = {
      log,
      warn,
      error,
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          url: '/api/health',
          user: undefined,
        }),
        getResponse: () => ({
          statusCode: 200,
        }),
      }),
    } as ExecutionContext;

    interceptor
      .intercept(context, {
        handle: () => of({ status: 'ok' }),
      } as CallHandler)
      .subscribe({
        next: () => {
          expect(log).not.toHaveBeenCalled();
          expect(warn).not.toHaveBeenCalled();
          expect(error).not.toHaveBeenCalled();
          done();
        },
        error: done,
      });
  });
});
