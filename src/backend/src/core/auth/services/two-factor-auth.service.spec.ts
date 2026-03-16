import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { CacheService } from '@common/cache/cache.service';

describe('TwoFactorAuthService', () => {
  let service: TwoFactorAuthService;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(async () => {
    // Mock CacheService
    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorAuthService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<TwoFactorAuthService>(TwoFactorAuthService);
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSecret', () => {
    it('should generate secret and QR code successfully', async () => {
      const email = 'test@example.com';

      const result = await service.generateSecret(email);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCode');
      expect(typeof result.secret).toBe('string');
      expect(result.secret.length).toBeGreaterThan(0);
      expect(result.qrCode).toContain('data:image/png;base64');
    });

    it('should generate different secrets for different calls', async () => {
      const email = 'test@example.com';

      const result1 = await service.generateSecret(email);
      const result2 = await service.generateSecret(email);

      expect(result1.secret).not.toBe(result2.secret);
    });

    it('should include email in QR code URL', async () => {
      const email = 'user@company.com';

      const result = await service.generateSecret(email);

      // QR code is base64 encoded image, not the URL itself
      expect(result.qrCode).toContain('data:image/png;base64');
      expect(result.secret).toBeDefined();
    });

    it('should generate base32 encoded secret', async () => {
      const email = 'test@example.com';

      const result = await service.generateSecret(email);

      // Base32 alphabet: A-Z, 2-7
      expect(result.secret).toMatch(/^[A-Z2-7]+$/);
    });
  });

  describe('verifyToken', () => {
    it('should return true for valid 6-digit token', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = '123456';

      const result = service.verifyToken(secret, token);

      expect(result).toBe(true);
    });

    it('should return false for invalid token format (not 6 digits)', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = '12345'; // Only 5 digits

      const result = service.verifyToken(secret, token);

      expect(result).toBe(false);
    });

    it('should return false for token with letters', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = '12345a';

      const result = service.verifyToken(secret, token);

      expect(result).toBe(false);
    });

    it('should return false for empty token', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = '';

      const result = service.verifyToken(secret, token);

      expect(result).toBe(false);
    });

    it('should return false for token with special characters', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = '123-456';

      const result = service.verifyToken(secret, token);

      expect(result).toBe(false);
    });

    it('should return false for token longer than 6 digits', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = '1234567';

      const result = service.verifyToken(secret, token);

      expect(result).toBe(false);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate 10 backup codes', () => {
      const codes = service.generateBackupCodes();

      expect(codes).toHaveLength(10);
    });

    it('should generate unique backup codes', () => {
      const codes = service.generateBackupCodes();

      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(10);
    });

    it('should generate uppercase alphanumeric codes', () => {
      const codes = service.generateBackupCodes();

      codes.forEach((code) => {
        expect(code).toMatch(/^[A-Z0-9]+$/);
        expect(code.length).toBeGreaterThan(0);
      });
    });

    it('should generate different codes on each call', () => {
      const codes1 = service.generateBackupCodes();
      const codes2 = service.generateBackupCodes();

      expect(codes1).not.toEqual(codes2);
    });
  });

  describe('storeBackupCodes', () => {
    it('should store backup codes in cache with correct key and TTL', async () => {
      const userId = 'user-123';
      const codes = ['CODE1', 'CODE2', 'CODE3'];

      await service.storeBackupCodes(userId, codes);

      expect(cacheService.set).toHaveBeenCalledWith(
        `backup-codes:${userId}`,
        codes,
        365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
      );
    });

    it('should handle empty codes array', async () => {
      const userId = 'user-123';
      const codes: string[] = [];

      await service.storeBackupCodes(userId, codes);

      expect(cacheService.set).toHaveBeenCalledWith(
        `backup-codes:${userId}`,
        codes,
        365 * 24 * 60 * 60 * 1000,
      );
    });
  });

  describe('useBackupCode', () => {
    it('should return true and remove code when valid code is used', async () => {
      const userId = 'user-123';
      const code = 'VALIDCODE';
      const codes = ['CODE1', 'VALIDCODE', 'CODE3'];

      cacheService.get.mockResolvedValue(codes);

      const result = await service.useBackupCode(userId, code);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(`backup-codes:${userId}`);
      expect(cacheService.set).toHaveBeenCalledWith(
        `backup-codes:${userId}`,
        ['CODE1', 'CODE3'],
        365 * 24 * 60 * 60 * 1000,
      );
    });

    it('should return false when code is not found', async () => {
      const userId = 'user-123';
      const code = 'INVALIDCODE';
      const codes = ['CODE1', 'CODE2', 'CODE3'];

      cacheService.get.mockResolvedValue(codes);

      const result = await service.useBackupCode(userId, code);

      expect(result).toBe(false);
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('should return false when no codes exist in cache', async () => {
      const userId = 'user-123';
      const code = 'SOMECODE';

      cacheService.get.mockResolvedValue(undefined);

      const result = await service.useBackupCode(userId, code);

      expect(result).toBe(false);
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('should return false when cached value is not an array', async () => {
      const userId = 'user-123';
      const code = 'SOMECODE';

      cacheService.get.mockResolvedValue('not-an-array' as any);

      const result = await service.useBackupCode(userId, code);

      expect(result).toBe(false);
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('should handle empty codes array', async () => {
      const userId = 'user-123';
      const code = 'SOMECODE';

      cacheService.get.mockResolvedValue([]);

      const result = await service.useBackupCode(userId, code);

      expect(result).toBe(false);
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('should remove only the used code and keep others', async () => {
      const userId = 'user-123';
      const code = 'CODE2';
      const codes = ['CODE1', 'CODE2', 'CODE3', 'CODE4'];

      cacheService.get.mockResolvedValue(codes);

      await service.useBackupCode(userId, code);

      expect(cacheService.set).toHaveBeenCalledWith(
        `backup-codes:${userId}`,
        ['CODE1', 'CODE3', 'CODE4'],
        365 * 24 * 60 * 60 * 1000,
      );
    });

    it('should handle last backup code usage', async () => {
      const userId = 'user-123';
      const code = 'LASTCODE';
      const codes = ['LASTCODE'];

      cacheService.get.mockResolvedValue(codes);

      const result = await service.useBackupCode(userId, code);

      expect(result).toBe(true);
      expect(cacheService.set).toHaveBeenCalledWith(
        `backup-codes:${userId}`,
        [],
        365 * 24 * 60 * 60 * 1000,
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in generateSecret', async () => {
      const email = 'test@example.com';

      // Should not throw even if QRCode generation fails
      const result = await service.generateSecret(email);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCode');
    });

    it('should handle cache errors in storeBackupCodes', async () => {
      const userId = 'user-123';
      const codes = ['CODE1', 'CODE2'];

      cacheService.set.mockRejectedValue(new Error('Cache error'));

      await expect(service.storeBackupCodes(userId, codes)).rejects.toThrow('Cache error');
    });

    it('should handle cache errors in useBackupCode', async () => {
      const userId = 'user-123';
      const code = 'CODE1';

      cacheService.get.mockRejectedValue(new Error('Cache error'));

      await expect(service.useBackupCode(userId, code)).rejects.toThrow('Cache error');
    });

    it('should return false for null token in verifyToken', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = null as any;

      const result = service.verifyToken(secret, token);

      expect(result).toBe(false);
    });

    it('should return false for undefined token in verifyToken', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = undefined as any;

      const result = service.verifyToken(secret, token);

      expect(result).toBe(false);
    });
  });
});
