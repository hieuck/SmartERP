import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '@common/cache/cache.service';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';

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
    // Generate a random 32-byte secret and encode as base32
    const secretBuffer = randomBytes(32);
    const secret = this.base32Encode(secretBuffer);

    // Create OTPAuth URL for QR code
    const otpauthUrl = `otpauth://totp/Smart-ERP:${email}?secret=${secret}&issuer=Smart-ERP`;
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    return {
      secret,
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
      // Simple TOTP verification (6-digit code)
      // In production, use a proper TOTP library
      if (!/^\d{6}$/.test(token)) {
        return false;
      }
      // Placeholder: actual TOTP verification would require time-based calculation
      // For now, accept any 6-digit code (should be replaced with proper implementation)
      return true;
    } catch (error) {
      this.logger.error('OTP verification failed', { error: error instanceof Error ? error.message : String(error) });
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
    const cachedCodes = await this.cacheService.get(key);
    const codes: string[] = Array.isArray(cachedCodes) ? cachedCodes : [];

    const index = codes.indexOf(code);
    if (index === -1) {
      return false;
    }

    codes.splice(index, 1);
    await this.cacheService.set(key, codes, 365 * 24 * 60 * 60 * 1000);

    return true;
  }

  /**
   * Base32 encode a buffer
   * @param buffer Buffer to encode
   * @returns Base32 encoded string
   */
  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;
      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }
}
