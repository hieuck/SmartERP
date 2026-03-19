import { CallHandler, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { throwError } from 'rxjs';
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
});
