/**
 * TokenBlacklistService Unit Tests
 * Coverage target: >90%
 * 
 * Test cases:
 * 1. isTokenRevoked - Check if token is revoked
 * 2. revokeToken - Revoke a single token
 * 3. revokeUserTokens - Revoke all tokens for a user
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TokenBlacklistService } from './token-blacklist.service';
import { CacheService } from '@common/cache/cache.service';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  let cacheService: jest.Mocked<CacheService>;

  const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  beforeEach(async () => {
    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<TokenBlacklistService>(TokenBlacklistService);
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isTokenRevoked', () => {
    it('should return false when token is not revoked', async () => {
      // Arrange
      cacheService.get.mockResolvedValue(null);

      // Act
      const result = await service.isTokenRevoked('valid-token');

      // Assert
      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith('revoked-token:valid-token');
    });

    it('should return true when token is revoked', async () => {
      // Arrange
      cacheService.get.mockResolvedValue(true);

      // Act
      const result = await service.isTokenRevoked('revoked-token');

      // Assert
      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith('revoked-token:revoked-token');
    });

    it('should handle empty token', async () => {
      // Arrange
      cacheService.get.mockResolvedValue(null);

      // Act
      const result = await service.isTokenRevoked('');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('revokeToken', () => {
    it('should add token to blacklist', async () => {
      // Arrange
      const token = 'token-to-revoke';
      cacheService.set.mockResolvedValue(undefined);

      // Act
      await service.revokeToken(token, TOKEN_EXPIRY_MS / 1000); // Convert ms to seconds

      // Assert
      expect(cacheService.set).toHaveBeenCalledWith(
        `revoked-token:${token}`,
        true,
        TOKEN_EXPIRY_MS,
      );
    });

    it('should set expiration time for revoked token', async () => {
      // Arrange
      const token = 'token-to-revoke';
      cacheService.set.mockResolvedValue(undefined);

      // Act
      await service.revokeToken(token, 3600); // 1 hour in seconds

      // Assert
      expect(cacheService.set).toHaveBeenCalledWith(
        `revoked-token:${token}`,
        true,
        3600000, // 1 hour in ms
      );
    });

    it('should handle revoking already revoked token', async () => {
      // Arrange
      const token = 'already-revoked-token';
      cacheService.set.mockResolvedValue(undefined);

      // Act
      await service.revokeToken(token, TOKEN_EXPIRY_MS / 1000);
      await service.revokeToken(token, TOKEN_EXPIRY_MS / 1000);

      // Assert
      expect(cacheService.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('revokeUserTokens', () => {
    it('should revoke all tokens for a user', async () => {
      // Arrange
      const userId = 'user-123';
      cacheService.set.mockResolvedValue(undefined);

      // Act
      await service.revokeUserTokens(userId);

      // Assert
      expect(cacheService.set).toHaveBeenCalledWith(
        `revoked-user:${userId}`,
        true,
        TOKEN_EXPIRY_MS,
      );
    });

    it('should handle revoking tokens for non-existent user', async () => {
      // Arrange
      const userId = 'non-existent-user';
      cacheService.set.mockResolvedValue(undefined);

      // Act
      await service.revokeUserTokens(userId);

      // Assert
      expect(cacheService.set).toHaveBeenCalledWith(
        `revoked-user:${userId}`,
        true,
        TOKEN_EXPIRY_MS,
      );
    });

    it('should handle empty userId', async () => {
      // Arrange
      cacheService.set.mockResolvedValue(undefined);

      // Act
      await service.revokeUserTokens('');

      // Assert
      expect(cacheService.set).toHaveBeenCalledWith(
        'revoked-user:',
        true,
        TOKEN_EXPIRY_MS,
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle cache service errors in isTokenRevoked', async () => {
      // Arrange
      cacheService.get.mockRejectedValue(new Error('Cache error'));

      // Act & Assert
      await expect(service.isTokenRevoked('token')).rejects.toThrow('Cache error');
    });

    it('should handle cache service errors in revokeToken', async () => {
      // Arrange
      cacheService.set.mockRejectedValue(new Error('Cache error'));

      // Act & Assert
      await expect(service.revokeToken('token', 3600)).rejects.toThrow('Cache error');
    });

    it('should handle cache service errors in revokeUserTokens', async () => {
      // Arrange
      cacheService.set.mockRejectedValue(new Error('Cache error'));

      // Act & Assert
      await expect(service.revokeUserTokens('user-123')).rejects.toThrow('Cache error');
    });
  });
});
