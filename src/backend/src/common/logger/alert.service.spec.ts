import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AlertService, AlertLevel, Alert } from './alert.service';

describe('AlertService', () => {
  let service: AlertService;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertService],
    }).compile();

    service = module.get<AlertService>(AlertService);
    mockLogger = (service as any).logger;

    // Mock logger methods
    mockLogger.error = jest.fn();
    mockLogger.warn = jest.fn();
    mockLogger.log = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendAlert', () => {
    it('should send CRITICAL alert and log as error', async () => {
      const alert: Alert = {
        level: AlertLevel.CRITICAL,
        message: 'Critical system failure',
        timestamp: new Date('2024-01-01T00:00:00Z'),
        metadata: { system: 'database' },
      };

      await service.sendAlert(alert);

      expect(mockLogger.error).toHaveBeenCalledWith({
        type: 'alert',
        level: AlertLevel.CRITICAL,
        message: 'Critical system failure',
        timestamp: '2024-01-01T00:00:00.000Z',
        metadata: { system: 'database' },
      });
    });

    it('should send ERROR alert and log as error', async () => {
      const alert: Alert = {
        level: AlertLevel.ERROR,
        message: 'Error occurred',
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      await service.sendAlert(alert);

      expect(mockLogger.error).toHaveBeenCalledWith({
        type: 'alert',
        level: AlertLevel.ERROR,
        message: 'Error occurred',
        timestamp: '2024-01-01T00:00:00.000Z',
        metadata: undefined,
      });
    });

    it('should send WARNING alert and log as warn', async () => {
      const alert: Alert = {
        level: AlertLevel.WARNING,
        message: 'Warning message',
        timestamp: new Date('2024-01-01T00:00:00Z'),
        metadata: { threshold: 80 },
      };

      await service.sendAlert(alert);

      expect(mockLogger.warn).toHaveBeenCalledWith({
        type: 'alert',
        level: AlertLevel.WARNING,
        message: 'Warning message',
        timestamp: '2024-01-01T00:00:00.000Z',
        metadata: { threshold: 80 },
      });
    });

    it('should send INFO alert and log as info', async () => {
      const alert: Alert = {
        level: AlertLevel.INFO,
        message: 'Info message',
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      await service.sendAlert(alert);

      expect(mockLogger.log).toHaveBeenCalledWith({
        type: 'alert',
        level: AlertLevel.INFO,
        message: 'Info message',
        timestamp: '2024-01-01T00:00:00.000Z',
        metadata: undefined,
      });
    });

    it('should handle alert without metadata', async () => {
      const alert: Alert = {
        level: AlertLevel.WARNING,
        message: 'Simple warning',
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      await service.sendAlert(alert);

      expect(mockLogger.warn).toHaveBeenCalledWith({
        type: 'alert',
        level: AlertLevel.WARNING,
        message: 'Simple warning',
        timestamp: '2024-01-01T00:00:00.000Z',
        metadata: undefined,
      });
    });

    it('should handle alert with complex metadata', async () => {
      const alert: Alert = {
        level: AlertLevel.ERROR,
        message: 'Complex error',
        timestamp: new Date('2024-01-01T00:00:00Z'),
        metadata: {
          error: 'Connection failed',
          stack: 'Error stack trace',
          context: { host: 'localhost', port: 5432 },
        },
      };

      await service.sendAlert(alert);

      expect(mockLogger.error).toHaveBeenCalledWith({
        type: 'alert',
        level: AlertLevel.ERROR,
        message: 'Complex error',
        timestamp: '2024-01-01T00:00:00.000Z',
        metadata: {
          error: 'Connection failed',
          stack: 'Error stack trace',
          context: { host: 'localhost', port: 5432 },
        },
      });
    });
  });

  describe('alertHighMemory', () => {
    it('should send high memory alert with correct parameters', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');
      const heapUsedMB = 1500;
      const threshold = 1024;

      await service.alertHighMemory(heapUsedMB, threshold);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AlertLevel.WARNING,
          message: `High memory usage detected: ${heapUsedMB}MB (threshold: ${threshold}MB)`,
          metadata: expect.objectContaining({
            heapUsedMB,
            threshold,
            memoryUsage: expect.any(Object),
          }),
        }),
      );
    });

    it('should include process memory usage in metadata', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');

      await service.alertHighMemory(2000, 1024);

      const callArg = sendAlertSpy.mock.calls[0][0];
      expect(callArg.metadata?.memoryUsage).toBeDefined();
      expect(callArg.metadata?.memoryUsage).toHaveProperty('heapUsed');
      expect(callArg.metadata?.memoryUsage).toHaveProperty('heapTotal');
    });

    it('should handle edge case with zero threshold', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');

      await service.alertHighMemory(100, 0);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AlertLevel.WARNING,
          message: 'High memory usage detected: 100MB (threshold: 0MB)',
        }),
      );
    });

    it('should handle very high memory usage', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');

      await service.alertHighMemory(10000, 8192);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AlertLevel.WARNING,
          message: 'High memory usage detected: 10000MB (threshold: 8192MB)',
        }),
      );
    });
  });

  describe('alertSlowResponse', () => {
    it('should send slow response alert with correct parameters', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');
      const url = '/api/users';
      const duration = 5500;
      const threshold = 1000;

      await service.alertSlowResponse(url, duration, threshold);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AlertLevel.WARNING,
          message: `Slow API response detected: ${url} took ${duration}ms (threshold: ${threshold}ms)`,
          metadata: {
            url,
            duration,
            threshold,
          },
        }),
      );
    });

    it('should handle different URLs', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');

      await service.alertSlowResponse('/api/products/search', 3000, 1000);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Slow API response detected: /api/products/search took 3000ms (threshold: 1000ms)',
        }),
      );
    });

    it('should handle very slow responses', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');

      await service.alertSlowResponse('/api/reports/generate', 30000, 5000);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AlertLevel.WARNING,
          metadata: {
            url: '/api/reports/generate',
            duration: 30000,
            threshold: 5000,
          },
        }),
      );
    });

    it('should handle edge case with zero duration', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');

      await service.alertSlowResponse('/api/health', 0, 100);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Slow API response detected: /api/health took 0ms (threshold: 100ms)',
        }),
      );
    });
  });

  describe('alertDatabaseError', () => {
    it('should send database error alert with CRITICAL level', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');
      const error = new Error('Connection timeout');
      error.stack = 'Error stack trace';

      await service.alertDatabaseError(error);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AlertLevel.CRITICAL,
          message: 'Database connection error: Connection timeout',
          metadata: {
            error: 'Connection timeout',
            stack: 'Error stack trace',
          },
        }),
      );
    });

    it('should handle error without stack trace', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');
      const error = new Error('Database unavailable');
      delete error.stack;

      await service.alertDatabaseError(error);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AlertLevel.CRITICAL,
          metadata: {
            error: 'Database unavailable',
            stack: undefined,
          },
        }),
      );
    });

    it('should handle different error types', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');
      const error = new Error('Query execution failed');

      await service.alertDatabaseError(error);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Database connection error: Query execution failed',
        }),
      );
    });
  });

  describe('alertCacheError', () => {
    it('should send cache error alert with ERROR level', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');
      const error = new Error('Redis connection lost');
      error.stack = 'Error stack trace';

      await service.alertCacheError(error);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AlertLevel.ERROR,
          message: 'Cache connection error: Redis connection lost',
          metadata: {
            error: 'Redis connection lost',
            stack: 'Error stack trace',
          },
        }),
      );
    });

    it('should handle error without stack trace', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');
      const error = new Error('Cache unavailable');
      delete error.stack;

      await service.alertCacheError(error);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AlertLevel.ERROR,
          metadata: {
            error: 'Cache unavailable',
            stack: undefined,
          },
        }),
      );
    });

    it('should handle different cache error types', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');
      const error = new Error('Cache write failed');

      await service.alertCacheError(error);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cache connection error: Cache write failed',
        }),
      );
    });
  });

  describe('alertHighErrorRate', () => {
    it('should send high error rate alert with correct calculation', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');
      const errorCount = 50;
      const totalRequests = 1000;
      const threshold = 3;

      await service.alertHighErrorRate(errorCount, totalRequests, threshold);

      const errorRate = (errorCount / totalRequests) * 100;

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: AlertLevel.ERROR,
          message: `High error rate detected: ${errorRate.toFixed(2)}% (threshold: ${threshold}%)`,
          metadata: {
            errorCount,
            totalRequests,
            errorRate,
            threshold,
          },
        }),
      );
    });

    it('should calculate error rate correctly for different values', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');

      await service.alertHighErrorRate(10, 100, 5);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'High error rate detected: 10.00% (threshold: 5%)',
          metadata: expect.objectContaining({
            errorRate: 10,
          }),
        }),
      );
    });

    it('should handle low error rate', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');

      await service.alertHighErrorRate(1, 1000, 1);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'High error rate detected: 0.10% (threshold: 1%)',
          metadata: expect.objectContaining({
            errorRate: 0.1,
          }),
        }),
      );
    });

    it('should handle 100% error rate', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');

      await service.alertHighErrorRate(100, 100, 50);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'High error rate detected: 100.00% (threshold: 50%)',
          metadata: expect.objectContaining({
            errorRate: 100,
          }),
        }),
      );
    });

    it('should format error rate with 2 decimal places', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');

      await service.alertHighErrorRate(33, 1000, 2);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'High error rate detected: 3.30% (threshold: 2%)',
        }),
      );
    });

    it('should handle edge case with zero total requests', async () => {
      const sendAlertSpy = jest.spyOn(service, 'sendAlert');

      await service.alertHighErrorRate(0, 0, 5);

      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('NaN'),
        }),
      );
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple alerts in sequence', async () => {
      await service.alertHighMemory(1500, 1024);
      await service.alertSlowResponse('/api/users', 5000, 1000);
      await service.alertHighErrorRate(50, 1000, 3);

      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });

    it('should handle critical system failure scenario', async () => {
      const dbError = new Error('Database connection lost');
      const cacheError = new Error('Redis unavailable');

      await service.alertDatabaseError(dbError);
      await service.alertCacheError(cacheError);

      expect(mockLogger.error).toHaveBeenCalledTimes(2);
    });

    it('should handle performance degradation scenario', async () => {
      await service.alertHighMemory(2000, 1024);
      await service.alertSlowResponse('/api/reports', 10000, 1000);

      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
    });
  });
});
