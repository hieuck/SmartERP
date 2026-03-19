import { CallHandler, ExecutionContext, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
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

  function createHealthContext() {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          url: '/api/health',
        }),
        getResponse: () => ({
          statusCode: HttpStatus.OK,
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

  it('skips slow-query warnings for health endpoints', (done) => {
    const dateNowSpy = jest.spyOn(Date, 'now');
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

    dateNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(250);

    interceptor
      .intercept(createHealthContext(), {
        handle: () => of({ ok: true }),
      } as CallHandler)
      .subscribe({
        next: () => {
          expect(metricsService.recordQueryDuration).toHaveBeenCalledWith(
            'GET',
            '/api/health',
            HttpStatus.OK,
            250,
          );
          expect(metricsService.incrementSlowQuery).not.toHaveBeenCalled();
          expect(warn).not.toHaveBeenCalled();
          expect(error).not.toHaveBeenCalled();
          dateNowSpy.mockRestore();
          done();
        },
        error: (err) => {
          dateNowSpy.mockRestore();
          done(err);
        },
      });
  });
});
