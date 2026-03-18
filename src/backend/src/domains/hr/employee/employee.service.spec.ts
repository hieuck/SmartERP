import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { Employee } from './entities/employee.entity';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';

const mockUser = { id: 'user-1', tenantId: 'tenant-1', role: 'admin' };

const mockEmployee = {
  id: 'emp-1',
  tenantId: 'tenant-1',
  employeeCode: 'EMP-001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  status: 'active',
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
};

const mockCacheService = {
  getOrSet: jest.fn((key, fn) => fn()),
  del: jest.fn(),
};

const mockPermissionService = {
  checkPermission: jest.fn().mockResolvedValue(true),
  filterByTenant: jest.fn((user, query) => query),
};

describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: getRepositoryToken(Employee), useValue: mockRepository },
        { provide: CacheService, useValue: mockCacheService },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated employees', async () => {
      mockRepository.find.mockResolvedValue([mockEmployee]);
      const result = await service.findAll(mockUser as any, 1, 20);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should return empty when no employees', async () => {
      mockRepository.find.mockResolvedValue([]);
      const result = await service.findAll(mockUser as any, 1, 20);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return employee by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockEmployee);
      const result = await service.findOne(mockUser as any, 'emp-1');
      expect(result).toEqual(mockEmployee);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(mockUser as any, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      employeeCode: 'EMP-002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
    };

    it('should create an employee', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue({ ...mockEmployee, ...createDto });
      const result = await service.create(mockUser as any, createDto as any);
      expect(result.employeeCode).toBe('EMP-002');
    });

    it('should throw ConflictException for duplicate email', async () => {
      mockRepository.findOne.mockResolvedValue(mockEmployee);
      await expect(service.create(mockUser as any, createDto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update an employee', async () => {
      mockRepository.findOne.mockResolvedValue(mockEmployee);
      mockRepository.save.mockResolvedValue({ ...mockEmployee, firstName: 'Updated' });
      const result = await service.update(mockUser as any, 'emp-1', { firstName: 'Updated' } as any);
      expect(result.firstName).toBe('Updated');
    });

    it('should throw NotFoundException for nonexistent employee', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.update(mockUser as any, 'nonexistent', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an employee', async () => {
      mockRepository.findOne.mockResolvedValue(mockEmployee);
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });
      await expect(service.remove(mockUser as any, 'emp-1')).resolves.not.toThrow();
    });
  });

  describe('search', () => {
    it('should search employees by name or email', async () => {
      mockRepository.find.mockResolvedValue([mockEmployee]);
      const result = await service.search(mockUser as any, 'john');
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no match', async () => {
      mockRepository.find.mockResolvedValue([mockEmployee]);
      const result = await service.search(mockUser as any, 'xyz-no-match');
      expect(result).toHaveLength(0);
    });
  });

  describe('getStatistics', () => {
    it('should return employee statistics', async () => {
      mockRepository.find.mockResolvedValue([
        mockEmployee,
        { ...mockEmployee, id: 'emp-2', status: 'inactive' },
      ]);
      const result = await service.getStatistics(mockUser as any);
      expect(result.totalEmployees).toBe(2);
      expect(result.activeEmployees).toBe(1);
    });
  });
});
