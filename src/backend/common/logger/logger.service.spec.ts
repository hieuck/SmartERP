import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';
import * as winston from 'winston';
import { createMockUser } from '@/common/test/test-helpers';

// Mock winston
jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    log: jest.fn(),
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      errors: jest.fn(),
      json: jest.fn(),
      printf: jest.fn(),
      colorize: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
  };
});

const mockUser = {
    id: 'user1',
    tenantId: 'tenant1',
    roles: ['admin'],
  };

  describe('LoggerService', () => {
  let service: LoggerService;
  let mockWinstonLogger: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    mockWinstonLogger = (winston.createLogger as jest.Mock).mock.results[0].value;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setContext', () => {
    it('should set context', () => {
      service.setContext('TestContext');
      
      service.log('test message');
      
      expect(mockWinstonLogger.info).toHaveBeenCalledWith('test message', {
        context: 'TestContext',
      });
    });
  });

  describe('log', () => {
    it('should log info message with context', () => {
      service.log('test message', 'TestContext');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('test message', {
        context: 'TestContext',
      });
    });

    it('should use default context if not provided', () => {
      service.setContext('DefaultContext');
      service.log('test message');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('test message', {
        context: 'DefaultContext',
      });
    });
  });

  describe('error', () => {
    it('should log error message with trace', () => {
      const message = 'error message';
      const trace = 'error trace';
      const context = 'ErrorContext';

      service.error(message, trace, context);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
        context,
        trace,
      });
    });

    it('should log error without trace', () => {
      service.error('error message', undefined, 'ErrorContext');

      expect(mockWinstonLogger.error).toHaveBeenCalledWith('error message', {
        context: 'ErrorContext',
        trace: undefined,
      });
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      service.warn('warning message', 'WarnContext');

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith('warning message', {
        context: 'WarnContext',
      });
    });
  });

  describe('debug', () => {
    it('should log debug message', () => {
      service.debug('debug message', 'DebugContext');

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('debug message', {
        context: 'DebugContext',
      });
    });
  });

  describe('verbose', () => {
    it('should log verbose message', () => {
      service.verbose('verbose message', 'VerboseContext');

      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith('verbose message', {
        context: 'VerboseContext',
      });
    });
  });

  describe('logWithMetadata', () => {
    it('should log with custom metadata', () => {
      const metadata = { userId: '123', action: 'create' };
      service.setContext('MetadataContext');

      service.logWithMetadata('info', 'test message', metadata);

      expect(mockWinstonLogger.log).toHaveBeenCalledWith('info', 'test message', {
        context: 'MetadataContext',
        userId: '123',
        action: 'create',
      });
    });
  });

  describe('logRequest', () => {
    it('should log HTTP request', () => {
      service.logRequest('GET', '/api/users', 200, 150, 'user-123', mockUser);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('HTTP Request', {
        context: 'HTTP',
        method: 'GET',
        url: '/api/users',
        statusCode: 200,
        responseTime: 150,
        userId: 'user-123',
        tenantId: 'tenant-456',
      });
    });

    it('should log HTTP request without user and tenant', () => {
      service.logRequest('POST', '/api/products', 201, 200);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('HTTP Request', {
        context: 'HTTP',
        method: 'POST',
        url: '/api/products',
        statusCode: 201,
        responseTime: 200,
        userId: undefined,
        tenantId: undefined,
      });
    });
  });

  describe('logDatabaseQuery', () => {
    it('should log database query', () => {
      const query = 'SELECT * FROM users WHERE id = $1';
      const duration = 25;
      const tenantId = 'tenant-123';

      service.logDatabaseQuery(query, duration, tenantId);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('Database Query', {
        context: 'Database',
        query,
        duration,
        tenantId,
      });
    });

    it('should log database query without tenant', () => {
      const query = 'SELECT * FROM products';
      const duration = 15;

      service.logDatabaseQuery(query, duration);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('Database Query', {
        context: 'Database',
        query,
        duration,
        tenantId: undefined,
      });
    });
  });

  describe('logBusinessEvent', () => {
    it('should log business event', () => {
      const event = 'ORDER_CREATED';
      const data = { orderId: 'order-123', amount: 1000 };
      const userId = 'user-456';
      const tenantId = 'tenant-789';

      service.logBusinessEvent(event, data, userId, tenantId);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Business Event', {
        context: 'Business',
        event,
        data,
        userId,
        tenantId,
      });
    });

    it('should log business event without user and tenant', () => {
      const event = 'SYSTEM_STARTUP';
      const data = { version: '1.0.0' };

      service.logBusinessEvent(event, data);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Business Event', {
        context: 'Business',
        event,
        data,
        userId: undefined,
        tenantId: undefined,
      });
    });
  });
});
