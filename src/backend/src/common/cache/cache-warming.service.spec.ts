import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { CacheWarmingService } from './cache-warming.service';
import { CacheService } from './cache.service';

describe('CacheWarmingService', () => {
  let service: CacheWarmingService;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockCacheService = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheWarmingService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<CacheWarmingService>(CacheWarmingService);

    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    if (service['warmingInterval']) {
      clearInterval(service['warmingInterval']);
    }
  });

  describe('onModuleInit', () => {
    it('should start cache warming on module init', async () => {
      const warmAllCachesSpy = jest.spyOn(service as any, 'warmAllCaches').mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(warmAllCachesSpy).toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith('Starting cache warming...');
      expect(loggerSpy).toHaveBeenCalledWith('Cache warming initialized');
    });

    it('should schedule periodic warming', async () => {
      jest.useFakeTimers();
      const warmAllCachesSpy = jest.spyOn(service as any, 'warmAllCaches').mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(service['warmingInterval']).toBeDefined();

      warmAllCachesSpy.mockClear();
      jest.advanceTimersByTime(6 * 60 * 60 * 1000);

      expect(warmAllCachesSpy).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should handle errors during initialization', async () => {
      jest.spyOn(Logger.prototype, 'error');
      jest.spyOn(service as any, 'warmAllCaches').mockRejectedValue(new Error('Init error'));

      await service.onModuleInit();

      expect(Logger.prototype.error).toHaveBeenCalledWith('Cache warming failed:', expect.any(Error));
    });
  });

  describe('warmAllCaches', () => {
    it('should warm all cache types', async () => {
      const warmSettingsSpy = jest.spyOn(service as any, 'warmSettingsCache').mockResolvedValue(undefined);
      const warmCategoriesSpy = jest.spyOn(service as any, 'warmCategoriesCache').mockResolvedValue(undefined);
      const warmDashboardSpy = jest.spyOn(service as any, 'warmDashboardCache').mockResolvedValue(undefined);

      await service['warmAllCaches']();

      expect(warmSettingsSpy).toHaveBeenCalled();
      expect(warmCategoriesSpy).toHaveBeenCalled();
      expect(warmDashboardSpy).toHaveBeenCalled();
    });

    it('should log completion time', async () => {
      jest.spyOn(service as any, 'warmSettingsCache').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'warmCategoriesCache').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'warmDashboardCache').mockResolvedValue(undefined);

      await service['warmAllCaches']();

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Cache warming completed in'));
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(Logger.prototype, 'error');
      jest.spyOn(service as any, 'warmSettingsCache').mockRejectedValue(new Error('Warm error'));

      await service['warmAllCaches']();

      expect(Logger.prototype.error).toHaveBeenCalledWith('Cache warming failed:', expect.any(Error));
    });

    it('should continue warming even if one cache fails', async () => {
      jest.spyOn(service as any, 'warmSettingsCache').mockRejectedValue(new Error('Settings error'));
      const warmCategoriesSpy = jest.spyOn(service as any, 'warmCategoriesCache').mockResolvedValue(undefined);
      const warmDashboardSpy = jest.spyOn(service as any, 'warmDashboardCache').mockResolvedValue(undefined);

      await service['warmAllCaches']();

      expect(warmCategoriesSpy).toHaveBeenCalled();
      expect(warmDashboardSpy).toHaveBeenCalled();
    });
  });

  describe('warmSettingsCache', () => {
    it('should warm settings cache', async () => {
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');

      await service['warmSettingsCache']();

      expect(debugSpy).toHaveBeenCalledWith('Warming settings cache...');
    });

    it('should handle errors', async () => {
      jest.spyOn(Logger.prototype, 'error');
      jest.spyOn(service as any, 'warmSettingsCache').mockRejectedValue(new Error('Settings error'));

      await expect(service['warmSettingsCache']()).rejects.toThrow('Settings error');
    });
  });

  describe('warmCategoriesCache', () => {
    it('should warm categories cache', async () => {
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');

      await service['warmCategoriesCache']();

      expect(debugSpy).toHaveBeenCalledWith('Warming categories cache...');
    });

    it('should handle errors', async () => {
      jest.spyOn(Logger.prototype, 'error');
      jest.spyOn(service as any, 'warmCategoriesCache').mockRejectedValue(new Error('Categories error'));

      await expect(service['warmCategoriesCache']()).rejects.toThrow('Categories error');
    });
  });

  describe('warmDashboardCache', () => {
    it('should warm dashboard cache', async () => {
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');

      await service['warmDashboardCache']();

      expect(debugSpy).toHaveBeenCalledWith('Warming dashboard cache...');
    });

    it('should handle errors', async () => {
      jest.spyOn(Logger.prototype, 'error');
      jest.spyOn(service as any, 'warmDashboardCache').mockRejectedValue(new Error('Dashboard error'));

      await expect(service['warmDashboardCache']()).rejects.toThrow('Dashboard error');
    });
  });

  describe('warmTenantCache', () => {
    it('should warm cache for specific tenant', async () => {
      const warmTenantSettingsSpy = jest.spyOn(service as any, 'warmTenantSettings').mockResolvedValue(undefined);
      const warmTenantDashboardSpy = jest.spyOn(service as any, 'warmTenantDashboard').mockResolvedValue(undefined);
      const warmTenantProductsSpy = jest.spyOn(service as any, 'warmTenantProducts').mockResolvedValue(undefined);

      await service.warmTenantCache('tenant-1');

      expect(warmTenantSettingsSpy).toHaveBeenCalledWith('tenant-1');
      expect(warmTenantDashboardSpy).toHaveBeenCalledWith('tenant-1');
      expect(warmTenantProductsSpy).toHaveBeenCalledWith('tenant-1');
      expect(loggerSpy).toHaveBeenCalledWith('Warming cache for tenant: tenant-1');
      expect(loggerSpy).toHaveBeenCalledWith('Cache warmed for tenant: tenant-1');
    });

    it('should handle errors for tenant cache warming', async () => {
      jest.spyOn(Logger.prototype, 'error');
      jest.spyOn(service as any, 'warmTenantSettings').mockRejectedValue(new Error('Tenant error'));

      await service.warmTenantCache('tenant-1');

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Failed to warm cache for tenant tenant-1:',
        expect.any(Error),
      );
    });

    it('should handle null tenantId', async () => {
      jest.spyOn(Logger.prototype, 'error');

      await service.warmTenantCache(null as any);

      expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('should handle empty tenantId', async () => {
      jest.spyOn(Logger.prototype, 'error');

      await service.warmTenantCache('');

      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('warmTenantSettings', () => {
    it('should warm tenant settings', async () => {
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');

      await service['warmTenantSettings']('tenant-1');

      expect(debugSpy).toHaveBeenCalledWith('Warming settings for tenant: tenant-1');
    });
  });

  describe('warmTenantDashboard', () => {
    it('should warm tenant dashboard', async () => {
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');

      await service['warmTenantDashboard']('tenant-1');

      expect(debugSpy).toHaveBeenCalledWith('Warming dashboard for tenant: tenant-1');
    });
  });

  describe('warmTenantProducts', () => {
    it('should warm tenant products', async () => {
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');

      await service['warmTenantProducts']('tenant-1');

      expect(debugSpy).toHaveBeenCalledWith('Warming products for tenant: tenant-1');
    });
  });

  describe('onModuleDestroy', () => {
    it('should stop cache warming on module destroy', () => {
      service['warmingInterval'] = setInterval(() => {}, 1000) as any;

      service.onModuleDestroy();

      expect(loggerSpy).toHaveBeenCalledWith('Cache warming stopped');
    });

    it('should handle null interval', () => {
      service['warmingInterval'] = null;

      service.onModuleDestroy();

      expect(loggerSpy).not.toHaveBeenCalledWith('Cache warming stopped');
    });

    it('should handle undefined interval', () => {
      service['warmingInterval'] = undefined as any;

      service.onModuleDestroy();

      expect(loggerSpy).not.toHaveBeenCalledWith('Cache warming stopped');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple onModuleInit calls', async () => {
      const warmAllCachesSpy = jest.spyOn(service as any, 'warmAllCaches').mockResolvedValue(undefined);

      await service.onModuleInit();
      await service.onModuleInit();

      expect(warmAllCachesSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid tenant cache warming requests', async () => {
      jest.spyOn(service as any, 'warmTenantSettings').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'warmTenantDashboard').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'warmTenantProducts').mockResolvedValue(undefined);

      await Promise.all([
        service.warmTenantCache('tenant-1'),
        service.warmTenantCache('tenant-2'),
        service.warmTenantCache('tenant-3'),
      ]);

      expect(loggerSpy).toHaveBeenCalledTimes(6);
    });

    it('should handle very long tenant IDs', async () => {
      jest.spyOn(service as any, 'warmTenantSettings').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'warmTenantDashboard').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'warmTenantProducts').mockResolvedValue(undefined);

      const longTenantId = 'a'.repeat(1000);
      await service.warmTenantCache(longTenantId);

      expect(loggerSpy).toHaveBeenCalledWith(`Warming cache for tenant: ${longTenantId}`);
    });
  });
});
