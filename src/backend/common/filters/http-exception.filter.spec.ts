import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { createMockUser } from '@/common/test/test-helpers';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/api/test',
      method: 'GET',
      body: {},
      query: {},
      params: {},
      user: undefined,
    };
  });

  const createMockArgumentsHost = (): ArgumentsHost => {
    return {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  };

  describe('catch', () => {
    it('should handle HttpException with string message', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Test error',
        },
      });
    });

    it('should handle HttpException with object message', () => {
      const exception = new HttpException(
        { message: 'Validation failed', errors: ['field1', 'field2'] },
        HttpStatus.BAD_REQUEST,
      );
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Validation failed',
        },
      });
    });

    it('should handle non-HttpException errors', () => {
      const exception = new Error('Unexpected error');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        },
      });
    });

    it('should include user and tenant information in logs', () => {
      mockRequest.user = { id: 'user-123', tenantId: 'tenant-123' };
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden',
        },
      });
    });

    it('should handle different HTTP status codes', () => {
      const testCases = [
        { status: HttpStatus.NOT_FOUND, message: 'Not found', code: 'NOT_FOUND' },
        { status: HttpStatus.UNAUTHORIZED, message: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: HttpStatus.FORBIDDEN, message: 'Forbidden', code: 'FORBIDDEN' },
        { status: HttpStatus.CONFLICT, message: 'Conflict', code: 'CONFLICT' },
      ];

      testCases.forEach(({ status, message, code }) => {
        const exception = new HttpException(message, status);
        const host = createMockArgumentsHost();

        filter.catch(exception, host);

        expect(mockResponse.status).toHaveBeenCalledWith(status);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            code,
            message,
          },
        });
      });
    });

    it('should return standardized error format', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: expect.any(String),
            message: expect.any(String),
          }),
        }),
      );
    });

    it('should include validation errors in details', () => {
      const exception = new HttpException(
        { message: ['field1 is required', 'field2 must be a number'] },
        HttpStatus.BAD_REQUEST,
      );
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'field1 is required',
          details: {
            validationErrors: ['field1 is required', 'field2 must be a number'],
          },
        },
      });
    });
  });
});
