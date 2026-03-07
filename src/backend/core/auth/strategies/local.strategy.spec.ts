import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      validateUser: jest.fn(),
    };

  const mockUser = createMockUser();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'Password123!';
      const expectedUser = {
        id: 'user-123',
        email,
        tenantId: 'tenant-456',
        role: 'admin',
        status: 'active',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      authService.validateUser.mockResolvedValue(expectedUser);

      const result = await strategy.validate(email, password);

      expect(result).toEqual(expectedUser);
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const email = 'wrong@example.com';
      const password = 'wrongpassword';

      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(email, password)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate('nonexistent@example.com', 'anypassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should call authService.validateUser with correct parameters', async () => {
      const email = 'user@test.com';
      const password = 'testpass';

      authService.validateUser.mockResolvedValue({
        id: '1',
        email,
        tenantId: 'tenant-1',
        role: 'user',
        status: 'active',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await strategy.validate(email, password);

      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
      expect(authService.validateUser).toHaveBeenCalledTimes(1);
    });
  });
});
