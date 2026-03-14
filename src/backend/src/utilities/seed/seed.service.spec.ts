import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SeedService } from './seed.service';
import { Tenant } from '@core/tenant/entities/tenant.entity';
import { User } from '@core/user/entities/user.entity';
import { TenantStatus } from '@core/tenant/enums/tenant-status.enum';

jest.mock('bcrypt');

describe('SeedService', () => {
  let service: SeedService;
  let tenantRepository: jest.Mocked<Repository<Tenant>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockTenant: Partial<Tenant> = {
    id: 'tenant-1',
    code: 'DEMO',
    name: 'Demo Company',
    domain: 'demo.smarterp.local',
    status: TenantStatus.ACTIVE,
  };

  const mockUser: Partial<User> = {
    id: 'user-1',
    email: 'admin@demo.com',
    password: 'hashed_password',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    tenantId: 'tenant-1',
    status: 'active',
  };

  beforeEach(async () => {
    const mockTenantRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockUserRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
    tenantRepository = module.get(getRepositoryToken(Tenant));
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('seedDemoData', () => {
    it('should create demo tenant and admin user when they do not exist', async () => {
      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant as Tenant);
      tenantRepository.save.mockResolvedValue(mockTenant as Tenant);

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser as User);
      userRepository.save.mockResolvedValue(mockUser as User);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const result = await service.seedDemoData();

      expect(tenantRepository.create).toHaveBeenCalledWith({
        code: 'DEMO',
        name: 'Demo Company',
        domain: 'demo.smarterp.local',
        status: TenantStatus.ACTIVE,
      });
      expect(tenantRepository.save).toHaveBeenCalled();

      expect(bcrypt.hash).toHaveBeenCalledWith('admin123', 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: 'admin@demo.com',
        password: 'hashed_password',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        tenantId: mockTenant.id,
        status: 'active',
      });
      expect(userRepository.save).toHaveBeenCalled();

      expect(result).toEqual({
        success: true,
        message: 'Demo data seeded successfully',
        credentials: {
          email: 'admin@demo.com',
          password: 'admin123',
          tenant: 'DEMO',
        },
      });
    });

    it('should use existing tenant if already exists', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser as User);
      userRepository.save.mockResolvedValue(mockUser as User);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const result = await service.seedDemoData();

      expect(tenantRepository.create).not.toHaveBeenCalled();
      expect(tenantRepository.save).not.toHaveBeenCalled();
      expect(userRepository.create).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should skip user creation if admin user already exists', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      userRepository.findOne.mockResolvedValue(mockUser as User);

      const result = await service.seedDemoData();

      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should create both tenant and user when neither exists', async () => {
      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant as Tenant);
      tenantRepository.save.mockResolvedValue(mockTenant as Tenant);

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser as User);
      userRepository.save.mockResolvedValue(mockUser as User);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const result = await service.seedDemoData();

      expect(tenantRepository.create).toHaveBeenCalled();
      expect(tenantRepository.save).toHaveBeenCalled();
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.credentials).toEqual({
        email: 'admin@demo.com',
        password: 'admin123',
        tenant: 'DEMO',
      });
    });

    it('should hash password with bcrypt salt rounds 10', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser as User);
      userRepository.save.mockResolvedValue(mockUser as User);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      await service.seedDemoData();

      expect(bcrypt.hash).toHaveBeenCalledWith('admin123', 10);
    });

    it('should return correct credentials in response', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      userRepository.findOne.mockResolvedValue(mockUser as User);

      const result = await service.seedDemoData();

      expect(result.credentials).toEqual({
        email: 'admin@demo.com',
        password: 'admin123',
        tenant: 'DEMO',
      });
    });
  });
});
