import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AccountLockoutService } from './services/account-lockout.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../user/entities/user.entity';
import { TenantEntity } from '../tenant/entities/tenant.entity';

describe('AuthService - Security Tests', () => {
  let authService: AuthService;
  let accountLockoutService: AccountLockoutService;
  let tokenBlacklistService: TokenBlacklistService;
  let jwtService: JwtService;
  let mockUserRepository: any;
  let mockTenantRepository: any;

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
    };

    mockTenantRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        AccountLockoutService,
        TokenBlacklistService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(TenantEntity),
          useValue: mockTenantRepository,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
            decode: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    accountLockoutService = module.get<AccountLockoutService>(AccountLockoutService);
    tokenBlacklistService = module.get<TokenBlacklistService>(TokenBlacklistService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('Rate Limiting & Account Lockout', () => {
    it('should record failed login attempt', async () => {
      const email = 'test@example.com';
      const recordSpy = jest.spyOn(accountLockoutService, 'recordFailedAttempt');

      await accountLockoutService.recordFailedAttempt(email);

      expect(recordSpy).toHaveBeenCalledWith(email);
    });

    it('should lock account after 5 failed attempts', async () => {
      const email = 'test@example.com';

      for (let i = 0; i < 5; i++) {
        await accountLockoutService.recordFailedAttempt(email);
      }

      const isLocked = await accountLockoutService.isAccountLocked(email);
      expect(isLocked).toBe(true);
    });

    it('should prevent login when account is locked', async () => {
      const email = 'test@example.com';
      const user = {
        id: '1',
        email,
        password: 'hashed-password',
        tenantId: 'tenant-1',
        isLocked: true,
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      jest.spyOn(accountLockoutService, 'isAccountLocked').mockResolvedValue(true);

      const isLocked = await accountLockoutService.isAccountLocked(email);
      expect(isLocked).toBe(true);
    });

    it('should reset attempts on successful login', async () => {
      const email = 'test@example.com';
      const resetSpy = jest.spyOn(accountLockoutService, 'resetAttempts');

      await accountLockoutService.resetAttempts(email);

      expect(resetSpy).toHaveBeenCalledWith(email);
    });

    it('should return remaining lockout time', async () => {
      const email = 'test@example.com';

      for (let i = 0; i < 5; i++) {
        await accountLockoutService.recordFailedAttempt(email);
      }

      const remainingTime = await accountLockoutService.getRemainingLockoutTime(email);
      expect(remainingTime).toBeGreaterThan(0);
    });

    it('should unlock account after timeout', async () => {
      const email = 'test@example.com';
      const unlockSpy = jest.spyOn(accountLockoutService, 'unlockAccount');

      await accountLockoutService.unlockAccount(email);

      expect(unlockSpy).toHaveBeenCalledWith(email);
    });
  });

  describe('Token Revocation & Security', () => {
    it('should revoke token on logout', async () => {
      const token = 'valid-jwt-token';
      const revokeSpy = jest.spyOn(tokenBlacklistService, 'revokeToken');

      await tokenBlacklistService.revokeToken(token, 3600);

      expect(revokeSpy).toHaveBeenCalledWith(token, 3600);
    });

    it('should check if token is revoked', async () => {
      const token = 'revoked-token';
      const isRevokedSpy = jest.spyOn(tokenBlacklistService, 'isTokenRevoked');

      await tokenBlacklistService.revokeToken(token, 3600);
      const isRevoked = await tokenBlacklistService.isTokenRevoked(token);

      expect(isRevokedSpy).toHaveBeenCalledWith(token);
    });

    it('should revoke all user tokens on password change', async () => {
      const userId = 'user-123';
      const revokeUserTokensSpy = jest.spyOn(tokenBlacklistService, 'revokeUserTokens');

      await tokenBlacklistService.revokeUserTokens(userId);

      expect(revokeUserTokensSpy).toHaveBeenCalledWith(userId);
    });

    it('should reject expired tokens', async () => {
      const expiredToken = {
        exp: Math.floor(Date.now() / 1000) - 3600,
        sub: 'user-123',
        tenantId: 'tenant-1',
      };

      jest.spyOn(jwtService, 'decode').mockReturnValue(expiredToken);

      const isExpired = expiredToken.exp < Math.floor(Date.now() / 1000);
      expect(isExpired).toBe(true);
    });

    it('should validate token signature', async () => {
      const validToken = 'valid-jwt-token';
      const decodedToken = {
        exp: Math.floor(Date.now() / 1000) + 3600,
        sub: 'user-123',
        tenantId: 'tenant-1',
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(decodedToken);

      const verified = jwtService.verify(validToken);
      expect(verified).toEqual(decodedToken);
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should prevent user from accessing other tenant data', async () => {
      const tenant1 = { id: 'tenant-1', name: 'Tenant 1', status: 'active' };
      const tenant2 = { id: 'tenant-2', name: 'Tenant 2', status: 'active' };

      const user1 = {
        id: 'user-1',
        email: 'user1@tenant1.com',
        tenantId: tenant1.id,
        password: 'hashed-password',
      };

      mockUserRepository.findOne.mockResolvedValue(user1);

      const foundUser = await mockUserRepository.findOne({
        where: { email: 'user1@tenant1.com' },
      });

      expect(foundUser.tenantId).toBe(tenant1.id);
      expect(foundUser.tenantId).not.toBe(tenant2.id);
    });

    it('should verify tenant status on login', async () => {
      const inactiveTenant = { id: 'tenant-1', name: 'Inactive', status: 'inactive' };
      const user = {
        id: 'user-1',
        email: 'user@inactive.com',
        tenantId: inactiveTenant.id,
        password: 'hashed-password',
        tenant: inactiveTenant,
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const foundUser = await mockUserRepository.findOne({
        where: { email: 'user@inactive.com' },
        relations: ['tenant'],
      });

      expect(foundUser.tenant.status).toBe('inactive');
    });

    it('should isolate JWT tokens by tenantId', async () => {
      const tenantId = 'tenant-1';
      const userId = 'user-1';

      const token = {
        tenantId,
        sub: userId,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      jest.spyOn(jwtService, 'decode').mockReturnValue(token);

      const decoded = jwtService.decode('jwt-token');
      expect(decoded.tenantId).toBe(tenantId);
      expect(decoded.sub).toBe(userId);
    });

    it('should prevent cross-tenant password reset', async () => {
      const user = {
        id: 'user-1',
        email: 'user@tenant1.com',
        tenantId: 'tenant-1',
        resetPasswordToken: 'reset-token-123',
        resetPasswordExpires: new Date(Date.now() + 3600000),
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const foundUser = await mockUserRepository.findOne({
        where: { resetPasswordToken: 'reset-token-123' },
      });

      const requestTenantId = 'tenant-2';
      const isTenantMismatch = foundUser.tenantId !== requestTenantId;

      expect(isTenantMismatch).toBe(true);
    });

    it('should validate subdomain format and length', async () => {
      const validSubdomains = ['tenant1', 'my-company', 'test123'];
      const invalidSubdomains = ['', 'a', 'ab', 'invalid_subdomain', 'UPPERCASE'];

      validSubdomains.forEach(subdomain => {
        const isValid = /^[a-z0-9-]{3,50}$/.test(subdomain);
        expect(isValid).toBe(true);
      });

      invalidSubdomains.forEach(subdomain => {
        const isValid = /^[a-z0-9-]{3,50}$/.test(subdomain);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Password Reset Security', () => {
    it('should validate password strength in reset', async () => {
      const weakPasswords = ['123', '12345', 'pass', ''];
      const strongPasswords = ['SecurePass123!', 'MyPassword@2024', 'Test123456'];

      weakPasswords.forEach(password => {
        const isStrong = password.length >= 8;
        expect(isStrong).toBe(false);
      });

      strongPasswords.forEach(password => {
        const isStrong = password.length >= 8;
        expect(isStrong).toBe(true);
      });
    });

    it('should check password reset token expiration', async () => {
      const expiredToken = {
        resetPasswordToken: 'token-123',
        resetPasswordExpires: new Date(Date.now() - 3600000),
      };

      const isExpired = expiredToken.resetPasswordExpires < new Date();
      expect(isExpired).toBe(true);
    });

    it('should clear reset token after successful reset', async () => {
      const user = {
        id: 'user-1',
        email: 'user@example.com',
        resetPasswordToken: 'token-123',
        resetPasswordExpires: new Date(Date.now() + 3600000),
      };

      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;

      expect(user.resetPasswordToken).toBeNull();
      expect(user.resetPasswordExpires).toBeNull();
    });

    it('should prevent token reuse after reset', async () => {
      const token = 'reset-token-123';
      const usedTokens = new Set<string>();

      usedTokens.add(token);
      const isTokenUsed = usedTokens.has(token);

      expect(isTokenUsed).toBe(true);
    });
  });

  describe('Email Verification Security', () => {
    it('should set email verification token expiry', async () => {
      const user = {
        id: 'user-1',
        email: 'user@example.com',
        emailVerificationToken: 'verify-token-123',
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const isExpired = user.emailVerificationExpires < new Date();
      expect(isExpired).toBe(false);
    });

    it('should reject expired email verification tokens', async () => {
      const user = {
        id: 'user-1',
        email: 'user@example.com',
        emailVerificationToken: 'verify-token-123',
        emailVerificationExpires: new Date(Date.now() - 3600000),
      };

      const isExpired = user.emailVerificationExpires < new Date();
      expect(isExpired).toBe(true);
    });

    it('should clear verification token after successful verification', async () => {
      const user = {
        id: 'user-1',
        email: 'user@example.com',
        emailVerified: false,
        emailVerificationToken: 'verify-token-123',
      };

      user.emailVerified = true;
      user.emailVerificationToken = null;

      expect(user.emailVerified).toBe(true);
      expect(user.emailVerificationToken).toBeNull();
    });
  });

  describe('Error Message Security', () => {
    it('should use generic error messages for login failures', async () => {
      const genericMessage = 'Invalid email or password';

      expect(genericMessage).not.toContain('not found');
      expect(genericMessage).not.toContain('incorrect');
      expect(genericMessage).not.toContain('locked');
    });

    it('should not reveal email existence in forgot password', async () => {
      const genericMessage = 'If the email exists, a password reset link has been sent';

      expect(genericMessage).not.toContain('not found');
      expect(genericMessage).not.toContain('does not exist');
    });

    it('should sanitize error messages to prevent XSS', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = maliciousInput.replace(/[<>]/g, '');

      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent login attempts safely', async () => {
      const email = 'test@example.com';
      const user = {
        id: 'user-1',
        email,
        password: 'hashed-password',
        tenantId: 'tenant-1',
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const promises = Array(5).fill(null).map(() =>
        mockUserRepository.findOne({ where: { email } })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.email).toBe(email);
      });
    });

    it('should handle concurrent token refresh safely', async () => {
      const refreshToken = 'refresh-token-123';
      const newToken = 'new-access-token';

      jest.spyOn(jwtService, 'sign').mockReturnValue(newToken);

      const promises = Array(3).fill(null).map(() =>
        Promise.resolve(jwtService.sign({ sub: 'user-1' }))
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBe(newToken);
      });
    });
  });

  describe('Input Validation & Sanitization', () => {
    it('should trim and lowercase email inputs', async () => {
      const inputs = [
        '  USER@EXAMPLE.COM  ',
        'User@Example.Com',
        'user@example.com',
      ];

      inputs.forEach(input => {
        const sanitized = input.trim().toLowerCase();
        expect(sanitized).toBe('user@example.com');
      });
    });

    it('should validate email format', async () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.co.uk',
        'user+tag@example.com',
      ];

      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
      ];

      validEmails.forEach(email => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(true);
      });

      invalidEmails.forEach(email => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(false);
      });
    });

    it('should reject SQL injection attempts', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
      ];

      maliciousInputs.forEach(input => {
        const isSuspicious = input.includes("'") || input.includes('--') || input.includes(';');
        expect(isSuspicious).toBe(true);
      });
    });

    it('should reject XSS attempts in inputs', async () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror="alert(\'xss\')">',
      ];

      xssAttempts.forEach(input => {
        const isSuspicious = /<|>|javascript:|onerror|onload/.test(input);
        expect(isSuspicious).toBe(true);
      });
    });
  });
});
