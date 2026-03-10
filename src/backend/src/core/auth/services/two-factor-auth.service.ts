import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

/**
 * Two-Factor Authentication Service
 * Manages OTP generation and verification for 2FA
 */
@Injectable()
export class TwoFactorAuthService {
  private readonly logger = new Logger(TwoFactorAuthService.name);

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Generate OTP secret for user
   * @param email User email
   * @returns Secret and QR code URL
   */
  async generateSecret(email: string): Promise<{ secret: string; qrCode: string }> {
    const secret = speakeasy.generateSecret({
      name: `Smart-ERP (${email})`,
      issuer: 'Smart-ERP',
      length: 32,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  /**
   * Verify OTP token
   * @param secret User's OTP secret
   * @param token OTP token to verify
   * @returns True if valid, false otherwise
   */
  verifyToken(secret: string, token: string): boolean {
    try {
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2,
      });

      return verified;
    } catch (error) {
      this.logger.error('OTP verification failed', { error: error.message });
      return false;
    }
  }

  /**
   * Generate backup codes for 2FA
   * @returns Array of backup codes
   */
  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Store backup codes in cache
   * @param userId User ID
   * @param codes Backup codes
   */
  async storeBackupCodes(userId: string, codes: string[]): Promise<void> {
    const key = `backup-codes:${userId}`;
    await this.cacheService.set(key, codes, 365 * 24 * 60 * 60 * 1000);
  }

  /**
   * Use backup code
   * @param userId User ID
   * @param code Backup code
   * @returns True if code was valid and used, false otherwise
   */
  async useBackupCode(userId: string, code: string): Promise<boolean> {
    const key = `backup-codes:${userId}`;
    const codes = (await this.cacheService.get(key)) || [];

    const index = codes.indexOf(code);
    if (index === -1) {
      return false;
    }

    codes.splice(index, 1);
    await this.cacheService.set(key, codes, 365 * 24 * 60 * 60 * 1000);

    return true;
  }
}
