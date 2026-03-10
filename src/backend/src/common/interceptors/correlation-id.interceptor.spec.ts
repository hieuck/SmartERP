import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { CorrelationIdInterceptor } from './correlation-id.interceptor';

describe('CorrelationIdInterceptor', () => {
  let interceptor: CorrelationIdInterceptor;

  beforeEach(() => {
    interceptor = new CorrelationIdInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should use existing correlation ID from header', () => {
    const existingId = 'existing-correlation-id';
    const mockRequest: any = {
      headers: {
        'x-correlation-id': existingId,
      },
    };
    const mockResponse = {
      setHeader: jest.fn(),
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of({}),
    };

    interceptor.intercept(mockContext, mockCallHandler);

    expect(mockRequest.correlationId).toBe(existingId);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Correlation-ID', existingId);
  });

  it('should generate new correlation ID if not provided', () => {
    const mockRequest: any = {
      headers: {},
    };
    const mockResponse = {
      setHeader: jest.fn(),
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of({}),
    };

    interceptor.intercept(mockContext, mockCallHandler);

    expect(mockRequest.correlationId).toBeDefined();
    expect(typeof mockRequest.correlationId).toBe('string');
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Correlation-ID',
      mockRequest.correlationId,
    );
  });

  it('should call next.handle()', () => {
    const mockRequest: any = {
      headers: {},
    };
    const mockResponse = {
      setHeader: jest.fn(),
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: jest.fn(() => of({})),
    };

    interceptor.intercept(mockContext, mockCallHandler);

    expect(mockCallHandler.handle).toHaveBeenCalled();
  });
});
