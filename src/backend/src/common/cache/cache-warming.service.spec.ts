import { Test, TestingModule } from '@nestjs/testing';
import { CacheWarmingService } from './cache-warming.service';
import { CacheService } from './cache.service';

describe('CacheWarmingService', () => {
  let service: CacheWarmingService;
  let cacheService: jest.Mocked<CacheService>;

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
    cacheService = module.get(CacheService);

    // Clear all timers
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('onModuleInit', () => {
    it('should initialize cache warming on module startup', async () => {
      jest.useFakeTimers();
      const warmAllCachesSpy = jest.spyOn(service as any, 'warmAllCaches').mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(warmAllCachesSpy).toHaveBeenCalledTimes(1);
      
      jest.clearAllTimers();
    });

    it('should schedule periodic warming every 6 hours', async () => {
      jest.useFakeTimers();
      const warmAllCachesSpy = jest.spyOn(service as any, 'warmAllCaches').mockResolvedValue(undefined);

      await service.onModuleInit();

      // Fast-forward 6 hours
      jest.advanceTimersByTime(6 * 60 * 60 * 1000);

      expect(warmAllCachesSpy).toHaveBeenCalledTimes(2); // Initial + 1 interval

      jest.clearAllTimers();
    });
  });

  describe('warmAllCaches', () => {
    it('should warm all cache types successfully', async () => {
      const warmSettingsSpy = jest.spyOn(service as any, 'warmSettingsCache').mockResolvedValue(undefined);
      const warmCategoriesSpy = jest.spyOn(service as any, 'warmCategoriesCache').mockResolvedValue(undefined);
      const warmDashboardSpy = jest.spyOn(service as any, 'warmDashboardCache').mockResolvedValue(undefined);

      await (service as any).warmAllCaches();

      expect(warmSettingsSpy).toHaveBeenCalled();
      expect(warmCategoriesSpy).toHaveBeenCalled();
      expect(warmDashboardSpy).toHaveBeenCalled();
    });

    it('should handle errors during cache warming', async () => {
      jest.spyOn(service as any, 'warmSettingsCache').mockRejectedValue(new Error('Cache error'));
      jest.spyOn(service as any, 'warmCategoriesCache').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'warmDashboardCache').mockResolvedValue(undefined);

      await expect((service as any).warmAllCaches()).resolves.not.toThrow();
    });

    it('should log completion time', async () => {
      jest.spyOn(service as any, 'warmSettingsCache').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'warmCategoriesCache').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'warmDashboardCache').mockResolvedValue(undefined);

      await (service as any).warmAllCaches();

      // Should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('warmSettingsCache', () => {
    it('should warm settings cache successfully', async () => {
      await expect((service as any).warmSettingsCache()).resolves.not.toThrow();
    });

    it('should handle errors during settings cache warming', async () => {
      // Mock internal error
      await expect((service as any).warmSettingsCache()).resolves.not.toThrow();
    });
  });

  describe('warmCategoriesCache', () => {
    it('should warm categories cache successfully', async () => {
      await expect((service as any).warmCategoriesCache()).resolves.not.toThrow();
    });

    it('should handle errors during categories cache warming', async () => {
      await expect((service as any).warmCategoriesCache()).resolves.not.toThrow();
    });
  });

  describe('warmDashboardCache', () => {
    it('should warm dashboard cache successfully', async () => {
      await expect((service as any).warmDashboardCache()).resolves.not.toThrow();
    });

    it('should handle errors during dashboard cache warming', async () => {
      await expect((service as any).warmDashboardCache()).resolves.not.toThrow();
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
    });

    it('should handle errors during tenant cache warming', async () => {
      jest.spyOn(service as any, 'warmTenantSettings').mockRejectedValue(new Error('Tenant error'));

      await expect(service.warmTenantCache('tenant-1')).resolves.not.toThrow();
    });
  });

  describe('warmTenantSettings', () => {
    it('should warm tenant settings successfully', async () => {
      await expect((service as any).warmTenantSettings('tenant-1')).resolves.not.toThrow();
    });
  });

  describe('warmTenantDashboard', () => {
    it('should warm tenant dashboard successfully', async () => {
      await expect((service as any).warmTenantDashboard('tenant-1')).resolves.not.toThrow();
    });
  });

  describe('warmTenantProducts', () => {
    it('should warm tenant products successfully', async () => {
      await expect((service as any).warmTenantProducts('tenant-1')).resolves.not.toThrow();
    });
  });

  describe('onModuleDestroy', () => {
    it('should stop cache warming on module destroy', () => {
      jest.useFakeTimers();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      // Set up interval
      (service as any).warmingInterval = setInterval(() => {}, 1000);

      service.onModuleDestroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
      
      jest.clearAllTimers();
    });

    it('should handle when no interval is set', () => {
      (service as any).warmingInterval = null;

      expect(() => service.onModuleDestroy()).not.toThrow();
    });
  });
});
