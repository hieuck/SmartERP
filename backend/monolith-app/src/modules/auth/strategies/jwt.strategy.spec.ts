import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../../user/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;
  let userRepository: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'JWT_SECRET') {
                return 'test-secret-key-with-at-least-32-characters-for-security';
              }
              return defaultValue;
            }),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object from JWT payload', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        role: 'admin',
        status: 'active',
      };

      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        role: 'admin',
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: ['id', 'email', 'tenantId', 'role', 'status'],
      });
    });

    it('should extract userId from sub field', async () => {
      const payload = {
        sub: 'different-user-id',
        email: 'user@test.com',
        tenantId: 'tenant-789',
        role: 'user',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockUser = {
        id: 'different-user-id',
        email: 'user@test.com',
        tenantId: 'tenant-789',
        role: 'user',
        status: 'active',
      };

      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result.userId).toBe('different-user-id');
    });

    it('should preserve all required fields', async () => {
      const payload = {
        sub: 'user-id',
        email: 'email@test.com',
        tenantId: 'tenant-id',
        role: 'manager',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockUser = {
        id: 'user-id',
        email: 'email@test.com',
        tenantId: 'tenant-id',
        role: 'manager',
        status: 'active',
      };

      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('tenantId');
      expect(result).toHaveProperty('role');
    });
  });

  describe('configuration', () => {
    it('should use JWT_SECRET from config', () => {
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
});
