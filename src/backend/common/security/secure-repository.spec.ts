import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { SecureRepository } from './secure-repository';
import { PermissionService, User } from './permission.service';

class TestEntity {
  id: string;
  tenantId: string;
  createdBy: string;
  name: string;
}

describe('SecureRepository', () => {
  let secureRepo: SecureRepository<TestEntity>;
  let mockRepository: jest.Mocked<Repository<TestEntity>>;
  let mockPermissionService: jest.Mocked<PermissionService>;
  let user: User;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    } as any;

    mockPermissionService = {
      canRead: jest.fn(),
      canWrite: jest.fn(),
      canDelete: jest.fn(),
      buildSecureQuery: jest.fn(),
    } as any;

    user = { id: 'user1', tenantId: 'tenant1', roles: ['user'] };

    secureRepo = new SecureRepository(
      mockRepository,
      mockPermissionService,
      'TestEntity',
    );
  });

  describe('findOne', () => {
    it('should return record if user has read permission', async () => {
      const record = {
        id: 'record1',
        tenantId: 'tenant1',
        createdBy: 'user1',
        name: 'Test',
      };

      mockRepository.findOne.mockResolvedValue(record);
      mockPermissionService.canRead.mockReturnValue(true);

      const result = await secureRepo.findOne(user, { where: { id: 'record1' } });

      expect(result).toEqual(record);
    });

    it('should throw if user lacks read permission', async () => {
      const record = {
        id: 'record1',
        tenantId: 'tenant2',
        createdBy: 'user2',
        name: 'Test',
      };

      mockRepository.findOne.mockResolvedValue(record);
      mockPermissionService.canRead.mockReturnValue(false);

      await expect(
        secureRepo.findOne(user, { where: { id: 'record1' } }),
      ).rejects.toThrow();
    });
  });

  describe('find', () => {
    it('should apply secure query filters', async () => {
      const baseWhere = { status: 'active' };
      const secureWhere = { status: 'active', tenantId: 'tenant1' };

      mockPermissionService.buildSecureQuery.mockReturnValue(secureWhere);
      mockRepository.find.mockResolvedValue([]);

      await secureRepo.find(user, { where: baseWhere });

      expect(mockPermissionService.buildSecureQuery).toHaveBeenCalled();
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: secureWhere,
      });
    });
  });

  describe('save', () => {
    it('should save new record with user context', async () => {
      const newRecord = { name: 'Test' } as TestEntity;
      const savedRecord = {
        id: 'record1',
        tenantId: 'tenant1',
        createdBy: 'user1',
        name: 'Test',
      };

      mockRepository.save.mockResolvedValue(savedRecord);

      const result = await secureRepo.save(user, newRecord);

      expect(result.tenantId).toBe('tenant1');
      expect(result.createdBy).toBe('user1');
    });

    it('should check write permission for existing record', async () => {
      const existingRecord = {
        id: 'record1',
        tenantId: 'tenant1',
        createdBy: 'user2',
        name: 'Test',
      };

      mockRepository.findOne.mockResolvedValue(existingRecord);
      mockPermissionService.canWrite.mockReturnValue(false);

      await expect(secureRepo.save(user, existingRecord)).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should remove record if user has delete permission', async () => {
      const record = {
        id: 'record1',
        tenantId: 'tenant1',
        createdBy: 'user1',
        name: 'Test',
      };

      mockRepository.findOne.mockResolvedValue(record);
      mockPermissionService.canDelete.mockReturnValue(true);
      mockRepository.remove.mockResolvedValue(record);

      const result = await secureRepo.remove(user, record);

      expect(mockRepository.remove).toHaveBeenCalled();
    });

    it('should throw if user lacks delete permission', async () => {
      const record = {
        id: 'record1',
        tenantId: 'tenant1',
        createdBy: 'user2',
        name: 'Test',
      };

      mockRepository.findOne.mockResolvedValue(record);
      mockPermissionService.canDelete.mockReturnValue(false);

      await expect(secureRepo.remove(user, record)).rejects.toThrow();
    });
  });
});
