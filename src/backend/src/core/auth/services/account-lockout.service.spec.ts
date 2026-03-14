/**
 * AccountLockoutService Unit Tests
 * Coverage target: >90%
 * 
 * Test cases:
 * 1. isAccountLocked - Check if account is locked
 * 2. recordFailedAttempt - Record failed login attempts
 * 3. resetAttempts - Reset failed attempts on success
 * 4. getRemainingLockoutTime - Get remaining lockout time
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AccountLockoutService } from './account-lockout.service';
import { CacheService } from '@common/cache/cache.service';

describe('AccountLockoutService', () => {
  let service: AccountLockoutService;
  let cacheService: jest.Mocked<CacheService>;

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  beforeEach(async () => {
    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      incr: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountLockoutService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<AccountLockoutService>(AccountLockoutService);
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isAccountLocked', () => {
    it('should return false when no failed attempts recorded', async () => {
      // Arrange
      cacheService.get.mockResolvedValue(null);

      // Act
      const result = await service.isAccountLocked('test@example.com');

      // Assert
      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith('lockout:test@example.com');
    });

    it('should return false when attempts below threshold', async () => {
      // Arrange
      cacheService.get.mockResolvedValue('3'); // 3 attempts

      // Act
      const result = await service.isAccountLocked('test@example.com');

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when attempts exceed threshold', async () => {
      // Arrange
      cacheService.get.mockResolvedValue('5'); // 5 attempts (threshold)

      // Act
      const result = await service.isAccountLocked('test@example.com');

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when attempts far exceed threshold', async () => {
      // Arrange
      cacheService.get.mockResolvedValue('10'); // 10 attempts

      // Act
      const result = await service.isAccountLocked('test@example.com');

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('recordFailedAttempt', () => {
    it('should increment failed attempts counter', async () => {
      // Arrange
      cacheService.incr.mockResolvedValue(1);

      // Act
      await service.recordFailedAttempt('test@example.com');

      // Assert
      expect(cacheService.incr).toHaveBeenCalledWith('lockout:test@example.com');
      expect(cacheService.set).toHaveBeenCalledWith(
        'lockout:test@example.com',
        expect.any(Number),
        LOCKOUT_DURATION_MS,
      );
    });

    it('should set expiration on first failed attempt', async () => {
      // Arrange
      cacheService.incr.mockResolvedValue(1);

      // Act
      await service.recordFailedAttempt('test@example.com');

      // Assert
      expect(cacheService.set).toHaveBeenCalledWith(
        'lockout:test@example.com',
        1,
        LOCKOUT_DURATION_MS,
      );
    });

    it('should handle multiple failed attempts', async () => {
      // Arrange
      cacheService.incr
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3);

      // Act
      await service.recordFailedAttempt('test@example.com');
      await service.recordFailedAttempt('test@example.com');
      await service.recordFailedAttempt('test@example.com');

      // Assert
      expect(cacheService.incr).toHaveBeenCalledTimes(3);
    });
  });

  describe('resetAttempts', () => {
    it('should delete failed attempts counter', async () => {
      // Arrange
      cacheService.del.mockResolvedValue(undefined);

      // Act
      await service.resetAttempts('test@example.com');

      // Assert
      expect(cacheService.del).toHaveBeenCalledWith('lockout:test@example.com');
    });

    it('should handle reset for non-existent counter', async () => {
      // Arrange
      cacheService.del.mockResolvedValue(undefined);

      // Act
      await service.resetAttempts('nonexistent@example.com');

      // Assert
      expect(cacheService.del).toHaveBeenCalledWith('lockout:nonexistent@example.com');
    });
  });

  describe('getRemainingLockoutTime', () => {
    it('should return 0 when account is not locked', async () => {
      // Arrange
      cacheService.get.mockResolvedValue(null);

      // Act
      const result = await service.getRemainingLockoutTime('test@example.com');

      // Assert
      expect(result).toBe(0);
    });

    it('should return remaining time when account is locked', async () => {
      // Arrange
      const lockoutTime = Date.now() + 10 * 60 * 1000; // 10 minutes from now
      cacheService.get.mockResolvedValue(lockoutTime.toString());

      // Act
      const result = await service.getRemainingLockoutTime('test@example.com');

      // Assert
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(10 * 60 * 1000);
    });

    it('should return 0 when lockout time has expired', async () => {
      // Arrange
      const lockoutTime = Date.now() - 1000; // 1 second ago
      cacheService.get.mockResolvedValue(lockoutTime.toString());

      // Act
      const result = await service.getRemainingLockoutTime('test@example.com');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty email', async () => {
      // Arrange
      cacheService.get.mockResolvedValue(null);

      // Act
      const result = await service.isAccountLocked('');

      // Assert
      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith('lockout:');
    });

    it('should handle email with special characters', async () => {
      // Arrange
      cacheService.get.mockResolvedValue(null);

      // Act
      const result = await service.isAccountLocked('test+tag@example.com');

      // Assert
      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith('lockout:test+tag@example.com');
    });

    it('should handle cache service errors gracefully', async () => {
      // Arrange
      cacheService.get.mockRejectedValue(new Error('Cache error'));

      // Act & Assert
      await expect(service.isAccountLocked('test@example.com')).rejects.toThrow('Cache error');
    });
  });
});
