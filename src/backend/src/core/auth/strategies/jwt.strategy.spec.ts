import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../../user/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('12345678901234567890123456789012'),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns both id and userId with normalized roles for downstream services', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
      tenantId: 'tenant-1',
      role: 'admin',
      roles: [],
      status: 'active',
    } as User);

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'admin@example.com',
        tenantId: 'tenant-1',
        role: 'admin',
        iat: 1,
        exp: 2,
      }),
    ).resolves.toEqual({
      id: 'user-1',
      userId: 'user-1',
      email: 'admin@example.com',
      tenantId: 'tenant-1',
      role: 'admin',
      roles: ['admin'],
    });
  });

  it('preserves explicit roles when present', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'user-2',
      email: 'manager@example.com',
      tenantId: 'tenant-1',
      role: 'manager',
      roles: ['manager', 'approver'],
      status: 'active',
    } as User);

    const result = await strategy.validate({
      sub: 'user-2',
      email: 'manager@example.com',
      tenantId: 'tenant-1',
      role: 'manager',
      iat: 1,
      exp: 2,
    });

    expect(result.roles).toEqual(['manager', 'approver']);
  });

  it('rejects tokens whose user is inactive', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'user-3',
      email: 'inactive@example.com',
      tenantId: 'tenant-1',
      role: 'user',
      roles: ['user'],
      status: 'inactive',
    } as User);

    await expect(
      strategy.validate({
        sub: 'user-3',
        email: 'inactive@example.com',
        tenantId: 'tenant-1',
        role: 'user',
        iat: 1,
        exp: 2,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
