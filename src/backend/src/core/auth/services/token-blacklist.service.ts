import { Injectable } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';

/**
 * Token Blacklist Service
 * Manages revoked tokens to prevent reuse after logout, password change, or account suspension
 * Uses Redis cache for fast lookups with automatic expiration
 */
@Injectable()
export class TokenBlacklistService {
  constructor(private readonly cacheService: CacheService) {}

  /**
   * Revoke a token (add to blacklist)
   * @param token JWT token to revoke
   * @param expiresIn Token expiration time in seconds
   */
  async revokeToken(token: string, expiresIn: number): Promise<void> {
    const key = `revoked-token:${token}`;
    // Store with TTL equal to token expiration
    await this.cacheService.set(key, true, expiresIn * 1000);
  }

  /**
   * Check if token is revoked
   * @param token JWT token to check
   * @returns True if token is revoked, false otherwise
   */
  async isTokenRevoked(token: string): Promise<boolean> {
    const key = `revoked-token:${token}`;
    const revoked = await this.cacheService.get(key);
    return !!revoked;
  }

  /**
   * Revoke all tokens for a user (e.g., on password change or account suspension)
   * @param userId User ID
   * @param ttl Time to live in milliseconds (default: 7 days)
   */
  async revokeUserTokens(userId: string, ttl: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const key = `revoked-user:${userId}`;
    await this.cacheService.set(key, true, ttl);
  }

  /**
   * Check if all tokens for a user are revoked
   * @param userId User ID
   * @returns True if all user tokens are revoked, false otherwise
   */
  async areUserTokensRevoked(userId: string): Promise<boolean> {
    const key = `revoked-user:${userId}`;
    const revoked = await this.cacheService.get(key);
    return !!revoked;
  }

  /**
   * Clear revocation for a user (e.g., on account reactivation)
   * @param userId User ID
   */
  async clearUserRevocation(userId: string): Promise<void> {
    const key = `revoked-user:${userId}`;
    await this.cacheService.del(key);
  }
}
