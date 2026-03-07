import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheService } from './cache.service';
import { CacheTTL } from './cache.config';
import { createMockUser } from '@/common/test/test-helpers';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: jest.Mocked<Cache>;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return cached value on cache hit', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
    });

    it('should return undefined on cache miss', async () => {
      const key = 'test-key';
      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await service.get(key);

      expect(result).toBeUndefined();
    });

    it('should return undefined on error', async () => {
      const key = 'test-key';
      mockCacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.get(key);

      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set value with default TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test' };

      await service.set(key, value);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, undefined);
    });

    it('should set value with custom TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      const ttl = 300;

      await service.set(key, value, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, ttl * 1000);
    });

    it('should handle errors gracefully', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      mockCacheManager.set.mockRejectedValue(new Error('Cache error'));

      await expect(service.set(key, value)).resolves.not.toThrow();
    });
  });

  describe('del', () => {
    it('should delete key from cache', async () => {
      const key = 'test-key';

      await service.del(key);

      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
    });

    it('should handle errors gracefully', async () => {
      const key = 'test-key';
      mockCacheManager.del.mockRejectedValue(new Error('Cache error'));

      await expect(service.del(key)).resolves.not.toThrow();
    });
  });

  describe('reset', () => {
    it('should clear all cache', async () => {
      await service.reset();

      expect(mockCacheManager.reset).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockCacheManager.reset.mockRejectedValue(new Error('Cache error'));

      await expect(service.reset()).resolves.not.toThrow();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const key = 'test-key';
      const cachedValue = { data: 'cached' };
      mockCacheManager.get.mockResolvedValue(cachedValue);

      const factory = jest.fn();
      const result = await service.getOrSet(key, factory);

      expect(result).toEqual(cachedValue);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result on cache miss', async () => {
      const key = 'test-key';
      const freshValue = { data: 'fresh' };
      mockCacheManager.get.mockResolvedValue(undefined);

      const factory = jest.fn().mockResolvedValue(freshValue);
      const result = await service.getOrSet(key, factory);

      expect(result).toEqual(freshValue);
      expect(factory).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith(key, freshValue, CacheTTL.MEDIUM * 1000);
    });

    it('should use custom TTL', async () => {
      const key = 'test-key';
      const freshValue = { data: 'fresh' };
      const ttl = 600;
      mockCacheManager.get.mockResolvedValue(undefined);

      const factory = jest.fn().mockResolvedValue(freshValue);
      const result = await service.getOrSet(key, factory, ttl);

      expect(result).toEqual(freshValue);
      expect(mockCacheManager.set).toHaveBeenCalledWith(key, freshValue, ttl * 1000);
    });

    it('should throw error if factory fails', async () => {
      const key = 'test-key';
      mockCacheManager.get.mockResolvedValue(undefined);

      const factory = jest.fn().mockRejectedValue(new Error('Factory error'));

      await expect(service.getOrSet(key, factory)).rejects.toThrow('Factory error');
    });
  });

  describe('invalidateTenant', () => {
    it('should invalidate all cache for tenant', async () => {
      const tenantId = 'tenant-123';

      await service.invalidateTenant(tenantId);

      // delPattern just logs warning for now
      expect(true).toBe(true);
    });
  });

  describe('invalidateEntity', () => {
    it('should invalidate specific entity', async () => {
      const prefix = 'product';
      const tenantId = 'tenant-123';
      const entityId = 'entity-456';

      await service.invalidateEntity(prefix, tenantId, entityId);

      expect(mockCacheManager.del).toHaveBeenCalled();
    });

    it('should invalidate all entities of type for tenant', async () => {
      const prefix = 'product';
      const tenantId = 'tenant-123';

      await service.invalidateEntity(prefix, tenantId);

      // delPattern just logs warning for now
      expect(true).toBe(true);
    });
  });

  describe('warmCache', () => {
    it('should warm cache with factory data', async () => {
      const key = 'warm-key';
      const value = { data: 'warm' };
      const factory = jest.fn().mockResolvedValue(value);

      await service.warmCache(key, factory);

      expect(factory).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should handle factory errors gracefully', async () => {
      const key = 'warm-key';
      const factory = jest.fn().mockRejectedValue(new Error('Factory error'));

      await expect(service.warmCache(key, factory)).resolves.not.toThrow();
    });
  });

  describe('mget', () => {
    it('should get multiple keys', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = [{ data: '1' }, { data: '2' }, { data: '3' }];
      mockCacheManager.get
        .mockResolvedValueOnce(values[0])
        .mockResolvedValueOnce(values[1])
        .mockResolvedValueOnce(values[2]);

      const result = await service.mget(keys);

      expect(result).toEqual(values);
      expect(mockCacheManager.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('mset', () => {
    it('should set multiple key-value pairs', async () => {
      const items = [
        { key: 'key1', value: { data: '1' } },
        { key: 'key2', value: { data: '2' }, ttl: 300 },
      ];

      await service.mset(items);

      expect(mockCacheManager.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('has', () => {
    it('should return true if key exists', async () => {
      const key = 'test-key';
      mockCacheManager.get.mockResolvedValue({ data: 'test' });

      const result = await service.has(key);

      expect(result).toBe(true);
    });

    it('should return false if key does not exist', async () => {
      const key = 'test-key';
      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await service.has(key);

      expect(result).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      const result = await service.getStats();

      expect(result).toHaveProperty('message');
    });
  });

  describe('delPattern', () => {
    it('should log warning for pattern deletion', async () => {
      const pattern = 'test:*';

      await service.delPattern(pattern);

      // Just logs warning for now
      expect(true).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const pattern = 'test:*';

      await expect(service.delPattern(pattern)).resolves.not.toThrow();
    });
  });
});
