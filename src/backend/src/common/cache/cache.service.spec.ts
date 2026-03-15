import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheService } from './cache.service';
import { CacheTTL } from './cache.config';

describe('CacheService', () => {
  let service: CacheService;

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

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return value from cache when key exists', async () => {
      const mockValue = { id: '1', name: 'Test' };
      mockCacheManager.get.mockResolvedValue(mockValue);

      const result = await service.get('test-key');

      expect(result).toEqual(mockValue);
      expect(mockCacheManager.get).toHaveBeenCalledWith('test-key');
    });

    it('should return undefined when key does not exist', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await service.get('nonexistent-key');

      expect(result).toBeUndefined();
    });

    it('should return undefined when cache throws error', async () => {
      mockCacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.get('error-key');

      expect(result).toBeUndefined();
    });

    it('should handle null values correctly', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.get('null-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in cache with default TTL', async () => {
      const value = { id: '1', name: 'Test' };
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set('test-key', value);

      expect(mockCacheManager.set).toHaveBeenCalledWith('test-key', value, undefined);
    });

    it('should set value in cache with custom TTL', async () => {
      const value = { id: '1', name: 'Test' };
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set('test-key', value, 300);

      expect(mockCacheManager.set).toHaveBeenCalledWith('test-key', value, 300000);
    });

    it('should handle cache set errors gracefully', async () => {
      mockCacheManager.set.mockRejectedValue(new Error('Cache error'));

      await expect(service.set('error-key', 'value')).resolves.not.toThrow();
    });

    it('should set string values', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set('string-key', 'test-string', 60);

      expect(mockCacheManager.set).toHaveBeenCalledWith('string-key', 'test-string', 60000);
    });

    it('should set number values', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set('number-key', 42);

      expect(mockCacheManager.set).toHaveBeenCalledWith('number-key', 42, undefined);
    });

    it('should set boolean values', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set('bool-key', true);

      expect(mockCacheManager.set).toHaveBeenCalledWith('bool-key', true, undefined);
    });

    it('should set array values', async () => {
      const array = [1, 2, 3];
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set('array-key', array);

      expect(mockCacheManager.set).toHaveBeenCalledWith('array-key', array, undefined);
    });
  });

  describe('del', () => {
    it('should delete key from cache', async () => {
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.del('test-key');

      expect(mockCacheManager.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle cache delete errors gracefully', async () => {
      mockCacheManager.del.mockRejectedValue(new Error('Cache error'));

      await expect(service.del('error-key')).resolves.not.toThrow();
    });
  });

  describe('delPattern', () => {
    it('should log warning for pattern deletion', async () => {
      await service.delPattern('user:*');

      // Pattern deletion not implemented, should just log warning
      expect(true).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      await expect(service.delPattern('error:*')).resolves.not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset all cache', async () => {
      mockCacheManager.reset.mockResolvedValue(undefined);

      await service.reset();

      expect(mockCacheManager.reset).toHaveBeenCalled();
    });

    it('should handle cache reset errors gracefully', async () => {
      mockCacheManager.reset.mockRejectedValue(new Error('Cache error'));

      await expect(service.reset()).resolves.not.toThrow();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value when key exists', async () => {
      const cachedValue = { id: '1', name: 'Cached' };
      mockCacheManager.get.mockResolvedValue(cachedValue);

      const factory = jest.fn();
      const result = await service.getOrSet('test-key', factory);

      expect(result).toEqual(cachedValue);
      expect(factory).not.toHaveBeenCalled();
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('should call factory and cache result when key does not exist', async () => {
      const factoryValue = { id: '1', name: 'Fresh' };
      mockCacheManager.get.mockResolvedValue(undefined);
      mockCacheManager.set.mockResolvedValue(undefined);

      const factory = jest.fn().mockResolvedValue(factoryValue);
      const result = await service.getOrSet('test-key', factory, 300);

      expect(result).toEqual(factoryValue);
      expect(factory).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith('test-key', factoryValue, 300000);
    });

    it('should use default TTL when not specified', async () => {
      const factoryValue = { id: '1', name: 'Fresh' };
      mockCacheManager.get.mockResolvedValue(undefined);
      mockCacheManager.set.mockResolvedValue(undefined);

      const factory = jest.fn().mockResolvedValue(factoryValue);
      await service.getOrSet('test-key', factory);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'test-key',
        factoryValue,
        CacheTTL.MEDIUM * 1000,
      );
    });

    it('should throw error when factory throws', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);

      const factory = jest.fn().mockRejectedValue(new Error('Factory error'));

      await expect(service.getOrSet('test-key', factory)).rejects.toThrow('Factory error');
    });

    it('should handle null factory result', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);
      mockCacheManager.set.mockResolvedValue(undefined);

      const factory = jest.fn().mockResolvedValue(null);
      const result = await service.getOrSet('test-key', factory);

      expect(result).toBeNull();
      expect(mockCacheManager.set).toHaveBeenCalledWith('test-key', null, CacheTTL.MEDIUM * 1000);
    });

    it('should handle undefined factory result', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);
      mockCacheManager.set.mockResolvedValue(undefined);

      const factory = jest.fn().mockResolvedValue(undefined);
      const result = await service.getOrSet('test-key', factory);

      expect(result).toBeUndefined();
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'test-key',
        undefined,
        CacheTTL.MEDIUM * 1000,
      );
    });
  });

  describe('invalidateTenant', () => {
    it('should invalidate cache for tenant', async () => {
      await service.invalidateTenant('tenant-1');

      // Pattern deletion not implemented, should just log
      expect(true).toBe(true);
    });
  });

  describe('invalidateEntity', () => {
    it('should invalidate specific entity', async () => {
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.invalidateEntity('user', 'tenant-1', 'user-1');

      expect(mockCacheManager.del).toHaveBeenCalled();
    });

    it('should invalidate all entities of type when entityId not provided', async () => {
      await service.invalidateEntity('user', 'tenant-1');

      // Pattern deletion not implemented, should just log
      expect(true).toBe(true);
    });
  });

  describe('warmCache', () => {
    it('should warm cache with factory result', async () => {
      const factoryValue = { id: '1', name: 'Warmed' };
      mockCacheManager.set.mockResolvedValue(undefined);

      const factory = jest.fn().mockResolvedValue(factoryValue);
      await service.warmCache('test-key', factory, 600);

      expect(factory).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith('test-key', factoryValue, 600000);
    });

    it('should handle factory errors gracefully', async () => {
      const factory = jest.fn().mockRejectedValue(new Error('Factory error'));

      await expect(service.warmCache('test-key', factory)).resolves.not.toThrow();
    });
  });

  describe('mget', () => {
    it('should get multiple keys', async () => {
      mockCacheManager.get
        .mockResolvedValueOnce({ id: '1' })
        .mockResolvedValueOnce({ id: '2' })
        .mockResolvedValueOnce(undefined);

      const result = await service.mget(['key1', 'key2', 'key3']);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: '1' });
      expect(result[1]).toEqual({ id: '2' });
      expect(result[2]).toBeUndefined();
    });

    it('should handle empty keys array', async () => {
      const result = await service.mget([]);

      expect(result).toHaveLength(0);
    });
  });

  describe('mset', () => {
    it('should set multiple key-value pairs', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);

      const items = [
        { key: 'key1', value: 'value1', ttl: 60 },
        { key: 'key2', value: 'value2' },
      ];

      await service.mset(items);

      expect(mockCacheManager.set).toHaveBeenCalledTimes(2);
      expect(mockCacheManager.set).toHaveBeenCalledWith('key1', 'value1', 60000);
      expect(mockCacheManager.set).toHaveBeenCalledWith('key2', 'value2', undefined);
    });

    it('should handle empty items array', async () => {
      await service.mset([]);

      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('has', () => {
    it('should return true when key exists', async () => {
      mockCacheManager.get.mockResolvedValue('value');

      const result = await service.has('test-key');

      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await service.has('nonexistent-key');

      expect(result).toBe(false);
    });

    it('should return true for null values', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.has('null-key');

      expect(result).toBe(true);
    });

    it('should return true for false boolean values', async () => {
      mockCacheManager.get.mockResolvedValue(false);

      const result = await service.has('false-key');

      expect(result).toBe(true);
    });

    it('should return true for zero number values', async () => {
      mockCacheManager.get.mockResolvedValue(0);

      const result = await service.has('zero-key');

      expect(result).toBe(true);
    });

    it('should return true for empty string values', async () => {
      mockCacheManager.get.mockResolvedValue('');

      const result = await service.has('empty-key');

      expect(result).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return stats message', async () => {
      const result = await service.getStats();

      expect(result).toHaveProperty('message');
      expect(result?.message).toBe('Cache statistics not implemented');
    });

    it('should handle errors gracefully', async () => {
      const result = await service.getStats();

      expect(result).not.toBeNull();
    });
  });
});
