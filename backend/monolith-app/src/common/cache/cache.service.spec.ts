import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import { CacheTTL } from './cache.config';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    reset: jest.Mock;
  };

  beforeEach(async () => {
    // Mock cache manager
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should get value from cache', async () => {
      const key = 'test:key';
      const value = { data: 'test' };
      cacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(cacheManager.get).toHaveBeenCalledWith(key);
    });

    it('should return undefined on cache miss', async () => {
      cacheManager.get.mockResolvedValue(undefined);

      const result = await service.get('missing:key');

      expect(result).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      cacheManager.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get('error:key');

      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set value in cache with TTL', async () => {
      const key = 'test:key';
      const value = { data: 'test' };
      const ttl = 3600;

      await service.set(key, value, ttl);

      expect(cacheManager.set).toHaveBeenCalledWith(key, value, ttl * 1000);
    });

    it('should set value without TTL', async () => {
      const key = 'test:key';
      const value = { data: 'test' };

      await service.set(key, value);

      expect(cacheManager.set).toHaveBeenCalledWith(key, value, undefined);
    });

    it('should handle errors gracefully', async () => {
      cacheManager.set.mockRejectedValue(new Error('Redis error'));

      await expect(service.set('error:key', 'value')).resolves.not.toThrow();
    });
  });

  describe('del', () => {
    it('should delete value from cache', async () => {
      const key = 'test:key';

      await service.del(key);

      expect(cacheManager.del).toHaveBeenCalledWith(key);
    });

    it('should handle errors gracefully', async () => {
      cacheManager.del.mockRejectedValue(new Error('Redis error'));

      await expect(service.del('error:key')).resolves.not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset all cache', async () => {
      await service.reset();

      expect(cacheManager.reset).toHaveBeenCalled();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const key = 'test:key';
      const cachedValue = { data: 'cached' };
      cacheManager.get.mockResolvedValue(cachedValue);

      const factory = jest.fn();
      const result = await service.getOrSet(key, factory);

      expect(result).toEqual(cachedValue);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should fetch and cache value on miss', async () => {
      const key = 'test:key';
      const freshValue = { data: 'fresh' };
      cacheManager.get.mockResolvedValue(undefined);

      const factory = jest.fn().mockResolvedValue(freshValue);
      const result = await service.getOrSet(key, factory, CacheTTL.SHORT);

      expect(result).toEqual(freshValue);
      expect(factory).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(key, freshValue, CacheTTL.SHORT * 1000);
    });

    it('should propagate factory errors', async () => {
      const key = 'test:key';
      cacheManager.get.mockResolvedValue(undefined);

      const factory = jest.fn().mockRejectedValue(new Error('Factory error'));

      await expect(service.getOrSet(key, factory)).rejects.toThrow('Factory error');
    });
  });

  describe('mget', () => {
    it('should get multiple values', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = ['value1', 'value2', 'value3'];
      cacheManager.get
        .mockResolvedValueOnce(values[0])
        .mockResolvedValueOnce(values[1])
        .mockResolvedValueOnce(values[2]);

      const result = await service.mget(keys);

      expect(result).toEqual(values);
      expect(cacheManager.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('mset', () => {
    it('should set multiple values', async () => {
      const items = [
        { key: 'key1', value: 'value1', ttl: 100 },
        { key: 'key2', value: 'value2', ttl: 200 },
      ];

      await service.mset(items);

      expect(cacheManager.set).toHaveBeenCalledTimes(2);
      expect(cacheManager.set).toHaveBeenCalledWith('key1', 'value1', 100000);
      expect(cacheManager.set).toHaveBeenCalledWith('key2', 'value2', 200000);
    });
  });

  describe('has', () => {
    it('should return true if key exists', async () => {
      cacheManager.get.mockResolvedValue('value');

      const result = await service.has('existing:key');

      expect(result).toBe(true);
    });

    it('should return false if key does not exist', async () => {
      cacheManager.get.mockResolvedValue(undefined);

      const result = await service.has('missing:key');

      expect(result).toBe(false);
    });
  });

  describe('warmCache', () => {
    it('should warm cache with factory data', async () => {
      const key = 'warm:key';
      const value = { data: 'warm' };
      const factory = jest.fn().mockResolvedValue(value);

      await service.warmCache(key, factory, CacheTTL.LONG);

      expect(factory).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(key, value, CacheTTL.LONG * 1000);
    });

    it('should handle factory errors gracefully', async () => {
      const factory = jest.fn().mockRejectedValue(new Error('Factory error'));

      await expect(service.warmCache('error:key', factory)).resolves.not.toThrow();
    });
  });
});
