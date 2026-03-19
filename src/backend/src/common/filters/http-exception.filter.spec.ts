import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    (filter as unknown as { logger: { warn: jest.Mock; error: jest.Mock } }).logger = {
      warn: jest.fn(),
      error: jest.fn(),
    };
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
  });

  function createHost() {
    return {
      switchToHttp: () => ({
        getResponse: () => ({
          status: statusMock,
          json: jsonMock,
        }),
        getRequest: () => ({
          method: 'POST',
          url: '/api/auth/refresh',
          body: {},
          query: {},
          params: {},
        }),
      }),
    } as ArgumentsHost;
  }

  it('maps throttler exceptions to 429 responses', () => {
    filter.catch(
      new ThrottlerException('Rate limit exceeded for 127.0.0.1. Please try again later.'),
      createHost(),
    );

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded for 127.0.0.1. Please try again later.',
      },
    });
    expect((filter as unknown as { logger: { warn: jest.Mock } }).logger.warn).toHaveBeenCalled();
  });

  it('preserves existing bad request handling', () => {
    filter.catch(new HttpException('Invalid payload', HttpStatus.BAD_REQUEST), createHost());

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid payload',
      },
    });
    expect((filter as unknown as { logger: { warn: jest.Mock } }).logger.warn).toHaveBeenCalled();
  });
});
