import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';
import * as winston from 'winston';

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

describe('LoggerService', () => {
  let service: LoggerService;
  let mockWinstonLogger: jest.Mocked<winston.Logger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    mockWinstonLogger = (winston.createLogger as jest.Mock)() as jest.Mocked<winston.Logger>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create winston logger on initialization', () => {
      expect(winston.createLogger).toHaveBeenCalled();
    });
  });

  describe('setContext', () => {
    it('should set context successfully', () => {
      service.setContext('TestContext');

      // Verify context is set by checking it's used in log
      service.log('Test message');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Test message', {
        context: 'TestContext',
      });
    });

    it('should update context when called multiple times', () => {
      service.setContext('Context1');
      service.setContext('Context2');

      service.log('Test message');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Test message', {
        context: 'Context2',
      });
    });
  });

  describe('log', () => {
    it('should log info message with context', () => {
      service.setContext('TestContext');
      service.log('Test message');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Test message', {
        context: 'TestContext',
      });
    });

    it('should log info message with inline context', () => {
      service.log('Test message', 'InlineContext');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Test message', {
        context: 'InlineContext',
      });
    });

    it('should log info message without context', () => {
      service.log('Test message');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Test message', {
        context: undefined,
      });
    });

    it('should prioritize inline context over set context', () => {
      service.setContext('SetContext');
      service.log('Test message', 'InlineContext');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Test message', {
        context: 'InlineContext',
      });
    });
  });

  describe('error', () => {
    it('should log error message with trace', () => {
      service.setContext('TestContext');
      service.error('Error message', 'Stack trace');

      expect(mockWinstonLogger.error).toHaveBeenCalledWith('Error message', {
        context: 'TestContext',
        trace: 'Stack trace',
      });
    });

    it('should log error message without trace', () => {
      service.error('Error message');

      expect(mockWinstonLogger.error).toHaveBeenCalledWith('Error message', {
        context: undefined,
        trace: undefined,
      });
    });

    it('should log error message with inline context', () => {
      service.error('Error message', 'Stack trace', 'ErrorContext');

      expect(mockWinstonLogger.error).toHaveBeenCalledWith('Error message', {
        context: 'ErrorContext',
        trace: 'Stack trace',
      });
    });
  });

  describe('warn', () => {
    it('should log warning message with context', () => {
      service.setContext('TestContext');
      service.warn('Warning message');

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith('Warning message', {
        context: 'TestContext',
      });
    });

    it('should log warning message with inline context', () => {
      service.warn('Warning message', 'WarnContext');

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith('Warning message', {
        context: 'WarnContext',
      });
    });
  });

  describe('debug', () => {
    it('should log debug message with context', () => {
      service.setContext('TestContext');
      service.debug('Debug message');

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('Debug message', {
        context: 'TestContext',
      });
    });

    it('should log debug message with inline context', () => {
      service.debug('Debug message', 'DebugContext');

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('Debug message', {
        context: 'DebugContext',
      });
    });
  });

  describe('verbose', () => {
    it('should log verbose message with context', () => {
      service.setContext('TestContext');
      service.verbose('Verbose message');

      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith('Verbose message', {
        context: 'TestContext',
      });
    });

    it('should log verbose message with inline context', () => {
      service.verbose('Verbose message', 'VerboseContext');

      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith('Verbose message', {
        context: 'VerboseContext',
      });
    });
  });

  describe('logWithMetadata', () => {
    it('should log message with metadata', () => {
      service.setContext('TestContext');
      const metadata = { userId: 'user-1', action: 'create' };

      service.logWithMetadata('info', 'Test message', metadata);

      expect(mockWinstonLogger.log).toHaveBeenCalledWith('info', 'Test message', {
        context: 'TestContext',
        userId: 'user-1',
        action: 'create',
      });
    });

    it('should log message with empty metadata', () => {
      service.logWithMetadata('info', 'Test message', {});

      expect(mockWinstonLogger.log).toHaveBeenCalledWith('info', 'Test message', {
        context: undefined,
      });
    });

    it('should log message with different log levels', () => {
      service.logWithMetadata('error', 'Error message', { error: 'details' });

      expect(mockWinstonLogger.log).toHaveBeenCalledWith('error', 'Error message', {
        context: undefined,
        error: 'details',
      });
    });
  });

  describe('logRequest', () => {
    it('should log HTTP request with all parameters', () => {
      service.logRequest('GET', '/api/users', 200, 150, 'user-1', 'tenant-1');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('HTTP Request', {
        context: 'HTTP',
        method: 'GET',
        url: '/api/users',
        statusCode: 200,
        responseTime: 150,
        userId: 'user-1',
        tenantId: 'tenant-1',
      });
    });

    it('should log HTTP request without userId and tenantId', () => {
      service.logRequest('POST', '/api/products', 201, 250);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('HTTP Request', {
        context: 'HTTP',
        method: 'POST',
        url: '/api/products',
        statusCode: 201,
        responseTime: 250,
        userId: undefined,
        tenantId: undefined,
      });
    });

    it('should log HTTP request with error status code', () => {
      service.logRequest('GET', '/api/users/999', 404, 50, 'user-1', 'tenant-1');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('HTTP Request', {
        context: 'HTTP',
        method: 'GET',
        url: '/api/users/999',
        statusCode: 404,
        responseTime: 50,
        userId: 'user-1',
        tenantId: 'tenant-1',
      });
    });
  });

  describe('logDatabaseQuery', () => {
    it('should log database query with all parameters', () => {
      service.logDatabaseQuery('SELECT * FROM users WHERE id = $1', 25, 'tenant-1');

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('Database Query', {
        context: 'Database',
        query: 'SELECT * FROM users WHERE id = $1',
        duration: 25,
        tenantId: 'tenant-1',
      });
    });

    it('should log database query without tenantId', () => {
      service.logDatabaseQuery('INSERT INTO products VALUES ($1, $2)', 50);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('Database Query', {
        context: 'Database',
        query: 'INSERT INTO products VALUES ($1, $2)',
        duration: 50,
        tenantId: undefined,
      });
    });

    it('should log slow database query', () => {
      service.logDatabaseQuery('SELECT * FROM large_table', 5000, 'tenant-1');

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('Database Query', {
        context: 'Database',
        query: 'SELECT * FROM large_table',
        duration: 5000,
        tenantId: 'tenant-1',
      });
    });
  });

  describe('logBusinessEvent', () => {
    it('should log business event with all parameters', () => {
      const eventData = { orderId: 'order-1', amount: 1000 };
      service.logBusinessEvent('OrderCreated', eventData, 'user-1', 'tenant-1');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Business Event', {
        context: 'Business',
        event: 'OrderCreated',
        data: eventData,
        userId: 'user-1',
        tenantId: 'tenant-1',
      });
    });

    it('should log business event without userId and tenantId', () => {
      const eventData = { productId: 'product-1' };
      service.logBusinessEvent('ProductViewed', eventData);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Business Event', {
        context: 'Business',
        event: 'ProductViewed',
        data: eventData,
        userId: undefined,
        tenantId: undefined,
      });
    });

    it('should log business event with empty data', () => {
      service.logBusinessEvent('SystemStarted', {}, 'system', 'system');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Business Event', {
        context: 'Business',
        event: 'SystemStarted',
        data: {},
        userId: 'system',
        tenantId: 'system',
      });
    });

    it('should log business event with complex data', () => {
      const eventData = {
        orderId: 'order-1',
        items: [
          { productId: 'p1', quantity: 2 },
          { productId: 'p2', quantity: 1 },
        ],
        total: 1500,
      };
      service.logBusinessEvent('OrderCompleted', eventData, 'user-1', 'tenant-1');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Business Event', {
        context: 'Business',
        event: 'OrderCompleted',
        data: eventData,
        userId: 'user-1',
        tenantId: 'tenant-1',
      });
    });
  });
});
