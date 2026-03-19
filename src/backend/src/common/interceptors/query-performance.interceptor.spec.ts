import { CallHandler, ExecutionContext, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { throwError } from 'rxjs';
import { QueryPerformanceInterceptor } from './query-performance.interceptor';

describe('QueryPerformanceInterceptor', () => {
  function createContext() {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          url: '/api/auth/refresh',
        }),
        getResponse: () => ({
          statusCode: HttpStatus.UNAUTHORIZED,
        }),
      }),
    } as ExecutionContext;
  }

  it('logs client auth failures as warnings instead of errors', (done) => {
    const metricsService = {
      recordQueryDuration: jest.fn(),
      incrementSlowQuery: jest.fn(),
      incrementQueryError: jest.fn(),
    };
    const interceptor = new QueryPerformanceInterceptor(metricsService as never);
    const warn = jest.fn();
    const error = jest.fn();
    (interceptor as unknown as { logger: { warn: jest.Mock; error: jest.Mock } }).logger = {
      warn,
      error,
    };

    interceptor
      .intercept(createContext(), {
        handle: () => throwError(() => new UnauthorizedException('Refresh token not provided')),
      } as CallHandler)
      .subscribe({
        error: () => {
          expect(metricsService.incrementQueryError).toHaveBeenCalledWith(
            'POST',
            '/api/auth/refresh',
            'UnauthorizedException',
          );
          expect(warn).toHaveBeenCalled();
          expect(error).not.toHaveBeenCalled();
          done();
        },
      });
  });
});
