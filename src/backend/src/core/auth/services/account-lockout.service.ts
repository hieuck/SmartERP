import { Injectable } from '@nestjs/common';
import { CacheService } from '@common/cache/cache.service';

/**
 * Account Lockout Service
 * Manages failed login attempts and account lockout to prevent brute force attacks
 * Locks account after 5 failed attempts for 15 minutes
 */
@Injectable()
export class AccountLockoutService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly ATTEMPT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Record a failed login attempt
   * @param email User email
   */
  async recordFailedAttempt(email: string): Promise<void> {
    const key = `login-attempts:${email}`;
    const current = (await this.cacheService.get<number>(key)) || 0;
    const newCount = current + 1;

    // Set TTL to attempt window (1 hour)
    await this.cacheService.set(key, newCount, this.ATTEMPT_WINDOW_MS);

    // If max attempts reached, lock account
    if (newCount >= this.MAX_ATTEMPTS) {
      await this.lockAccount(email);
    }
  }

  /**
   * Check if account is locked
   * @param email User email
   * @returns True if account is locked, false otherwise
   */
  async isAccountLocked(email: string): Promise<boolean> {
    const key = `account-locked:${email}`;
    const locked = await this.cacheService.get(key);
    return !!locked;
  }

  /**
   * Get remaining lockout time in seconds
   * @param email User email
   * @returns Remaining lockout time in seconds, 0 if not locked
   */
  async getRemainingLockoutTime(email: string): Promise<number> {
    const key = `account-locked:${email}`;
    const locked = await this.cacheService.get<boolean>(key);
    // If locked, return the lockout duration in seconds
    // In a real implementation with Redis, you'd use TTL command
    // For now, return full duration if locked, 0 if not
    return locked ? Math.ceil(this.LOCKOUT_DURATION_MS / 1000) : 0;
  }

  /**
   * Get failed attempt count
   * @param email User email
   * @returns Number of failed attempts
   */
  async getAttemptCount(email: string): Promise<number> {
    const key = `login-attempts:${email}`;
    const count = await this.cacheService.get<number>(key);
    return count || 0;
  }

  /**
   * Reset failed attempts for successful login
   * @param email User email
   */
  async resetAttempts(email: string): Promise<void> {
    const key = `login-attempts:${email}`;
    await this.cacheService.del(key);
  }

  /**
   * Unlock account manually (e.g., by admin)
   * @param email User email
   */
  async unlockAccount(email: string): Promise<void> {
    const key = `account-locked:${email}`;
    await this.cacheService.del(key);
    await this.resetAttempts(email);
  }

  /**
   * Lock account (internal use)
   * @param email User email
   */
  private async lockAccount(email: string): Promise<void> {
    const key = `account-locked:${email}`;
    await this.cacheService.set(key, true, this.LOCKOUT_DURATION_MS);
  }
}
