import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

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
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Test error',
          path: '/api/test',
          method: 'GET',
        }),
      );
    });

    it('should handle HttpException with object message', () => {
      const exception = new HttpException(
        { message: 'Validation failed', errors: ['field1', 'field2'] },
        HttpStatus.BAD_REQUEST,
      );
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation failed',
        }),
      );
    });

    it('should handle non-HttpException errors', () => {
      const exception = new Error('Unexpected error');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        }),
      );
    });

    it('should include user and tenant information in logs', () => {
      mockRequest.user = { id: 'user-123', tenantId: 'tenant-123' };
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    });

    it('should handle different HTTP status codes', () => {
      const testCases = [
        { status: HttpStatus.NOT_FOUND, message: 'Not found' },
        { status: HttpStatus.UNAUTHORIZED, message: 'Unauthorized' },
        { status: HttpStatus.FORBIDDEN, message: 'Forbidden' },
        { status: HttpStatus.CONFLICT, message: 'Conflict' },
      ];

      testCases.forEach(({ status, message }) => {
        const exception = new HttpException(message, status);
        const host = createMockArgumentsHost();

        filter.catch(exception, host);

        expect(mockResponse.status).toHaveBeenCalledWith(status);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: status,
            message,
          }),
        );
      });
    });

    it('should include timestamp in error response', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        }),
      );
    });

    it('should include request details in error response', () => {
      mockRequest.body = { field: 'value' };
      mockRequest.query = { page: '1' };
      mockRequest.params = { id: '123' };

      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/test',
          method: 'GET',
        }),
      );
    });
  });
});
