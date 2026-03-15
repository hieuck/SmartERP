import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService, User, BaseRecord } from './permission.service';

describe('PermissionService', () => {
  let service: PermissionService;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['user'],
  };

  const mockAdminUser: User = {
    id: 'admin-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockManagerUser: User = {
    id: 'manager-1',
    tenantId: 'tenant-1',
    roles: ['manager'],
  };

  const mockRecord: BaseRecord = {
    id: 'record-1',
    tenantId: 'tenant-1',
    createdBy: 'user-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionService],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  describe('canRead', () => {
    it('should allow admin to read any record', () => {
      const result = service.canRead(mockAdminUser, mockRecord, 'TestEntity');

      expect(result).toBe(true);
    });

    it('should allow manager to read any record', () => {
      const result = service.canRead(mockManagerUser, mockRecord, 'TestEntity');

      expect(result).toBe(true);
    });

    it('should allow user to read own record', () => {
      const result = service.canRead(mockUser, mockRecord, 'TestEntity');

      expect(result).toBe(true);
    });

    it('should deny user to read other user record', () => {
      const otherRecord = { ...mockRecord, createdBy: 'other-user' };

      const result = service.canRead(mockUser, otherRecord, 'TestEntity');

      expect(result).toBe(false);
    });

    it('should deny access to different tenant', () => {
      const otherTenantRecord = { ...mockRecord, tenantId: 'tenant-2' };

      const result = service.canRead(mockUser, otherTenantRecord, 'TestEntity');

      expect(result).toBe(false);
    });

    it('should deny admin from different tenant', () => {
      const otherTenantRecord = { ...mockRecord, tenantId: 'tenant-2' };

      const result = service.canRead(mockAdminUser, otherTenantRecord, 'TestEntity');

      expect(result).toBe(false);
    });

    it('should handle record without createdBy', () => {
      const recordWithoutCreator = { ...mockRecord, createdBy: undefined };

      const result = service.canRead(mockUser, recordWithoutCreator, 'TestEntity');

      expect(result).toBe(false);
    });

    it('should handle null createdBy', () => {
      const recordWithNullCreator = { ...mockRecord, createdBy: null as any };

      const result = service.canRead(mockUser, recordWithNullCreator, 'TestEntity');

      expect(result).toBe(false);
    });

    it('should handle empty createdBy', () => {
      const recordWithEmptyCreator = { ...mockRecord, createdBy: '' };

      const result = service.canRead(mockUser, recordWithEmptyCreator, 'TestEntity');

      expect(result).toBe(false);
    });
  });

  describe('canWrite', () => {
    it('should allow admin to write any record', () => {
      const result = service.canWrite(mockAdminUser, mockRecord, 'TestEntity');

      expect(result).toBe(true);
    });

    it('should allow manager to write any record', () => {
      const result = service.canWrite(mockManagerUser, mockRecord, 'TestEntity');

      expect(result).toBe(true);
    });

    it('should allow user to write own record', () => {
      const result = service.canWrite(mockUser, mockRecord, 'TestEntity');

      expect(result).toBe(true);
    });

    it('should deny user to write other user record', () => {
      const otherRecord = { ...mockRecord, createdBy: 'other-user' };

      const result = service.canWrite(mockUser, otherRecord, 'TestEntity');

      expect(result).toBe(false);
    });

    it('should deny access to different tenant', () => {
      const otherTenantRecord = { ...mockRecord, tenantId: 'tenant-2' };

      const result = service.canWrite(mockUser, otherTenantRecord, 'TestEntity');

      expect(result).toBe(false);
    });

    it('should deny admin from different tenant', () => {
      const otherTenantRecord = { ...mockRecord, tenantId: 'tenant-2' };

      const result = service.canWrite(mockAdminUser, otherTenantRecord, 'TestEntity');

      expect(result).toBe(false);
    });

    it('should handle record without createdBy', () => {
      const recordWithoutCreator = { ...mockRecord, createdBy: undefined };

      const result = service.canWrite(mockUser, recordWithoutCreator, 'TestEntity');

      expect(result).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('should allow admin to delete any record', () => {
      const result = service.canDelete(mockAdminUser, mockRecord, 'TestEntity');

      expect(result).toBe(true);
    });

    it('should deny manager to delete record', () => {
      const result = service.canDelete(mockManagerUser, mockRecord, 'TestEntity');

      expect(result).toBe(false);
    });

    it('should deny user to delete own record', () => {
      const result = service.canDelete(mockUser, mockRecord, 'TestEntity');

      expect(result).toBe(false);
    });

    it('should deny user to delete other user record', () => {
      const otherRecord = { ...mockRecord, createdBy: 'other-user' };

      const result = service.canDelete(mockUser, otherRecord, 'TestEntity');

      expect(result).toBe(false);
    });

    it('should deny access to different tenant', () => {
      const otherTenantRecord = { ...mockRecord, tenantId: 'tenant-2' };

      const result = service.canDelete(mockAdminUser, otherTenantRecord, 'TestEntity');

      expect(result).toBe(false);
    });

    it('should deny admin from different tenant', () => {
      const otherTenantRecord = { ...mockRecord, tenantId: 'tenant-2' };

      const result = service.canDelete(mockAdminUser, otherTenantRecord, 'TestEntity');

      expect(result).toBe(false);
    });
  });

  describe('buildSecureQuery', () => {
    it('should add tenantId and createdBy to query for regular users', () => {
      const baseWhere = { status: 'active' };

      const result = service.buildSecureQuery(mockUser, baseWhere, 'TestEntity');

      expect(result).toEqual({
        status: 'active',
        tenantId: 'tenant-1',
        createdBy: 'user-1',
      });
    });

    it('should add createdBy for regular users', () => {
      const baseWhere = { status: 'active' };

      const result = service.buildSecureQuery(mockUser, baseWhere, 'TestEntity');

      expect(result).toEqual({
        status: 'active',
        tenantId: 'tenant-1',
        createdBy: 'user-1',
      });
    });

    it('should not add createdBy for admin', () => {
      const baseWhere = { status: 'active' };

      const result = service.buildSecureQuery(mockAdminUser, baseWhere, 'TestEntity');

      expect(result).toEqual({
        status: 'active',
        tenantId: 'tenant-1',
      });
    });

    it('should not add createdBy for manager', () => {
      const baseWhere = { status: 'active' };

      const result = service.buildSecureQuery(mockManagerUser, baseWhere, 'TestEntity');

      expect(result).toEqual({
        status: 'active',
        tenantId: 'tenant-1',
      });
    });

    it('should handle empty baseWhere', () => {
      const result = service.buildSecureQuery(mockUser, {}, 'TestEntity');

      expect(result).toEqual({
        tenantId: 'tenant-1',
        createdBy: 'user-1',
      });
    });

    it('should handle null baseWhere', () => {
      const result = service.buildSecureQuery(mockUser, null as any, 'TestEntity');

      expect(result).toEqual({
        tenantId: 'tenant-1',
        createdBy: 'user-1',
      });
    });

    it('should handle undefined baseWhere', () => {
      const result = service.buildSecureQuery(mockUser, undefined as any, 'TestEntity');

      expect(result).toEqual({
        tenantId: 'tenant-1',
        createdBy: 'user-1',
      });
    });

    it('should preserve existing properties', () => {
      const baseWhere = { id: 'test-id', name: 'Test Name', count: 5 };

      const result = service.buildSecureQuery(mockUser, baseWhere, 'TestEntity');

      expect(result).toEqual({
        id: 'test-id',
        name: 'Test Name',
        count: 5,
        tenantId: 'tenant-1',
        createdBy: 'user-1',
      });
    });

    it('should override tenantId if already present', () => {
      const baseWhere = { tenantId: 'wrong-tenant' };

      const result = service.buildSecureQuery(mockUser, baseWhere, 'TestEntity');

      expect(result.tenantId).toBe('tenant-1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with no roles', () => {
      const userWithoutRoles = { ...mockUser, roles: [] };

      const result = service.canRead(userWithoutRoles, mockRecord, 'TestEntity');

      expect(result).toBe(true);
    });

    it('should handle user with null roles', () => {
      const userWithNullRoles = { ...mockUser, roles: null as any };

      const result = service.canRead(userWithNullRoles, mockRecord, 'TestEntity');

      // User with null roles can still read own record (mockRecord.createdBy === mockUser.id)
      expect(result).toBe(true);
    });

    it('should handle user with undefined roles', () => {
      const userWithUndefinedRoles = { ...mockUser, roles: undefined as any };

      const result = service.canRead(userWithUndefinedRoles, mockRecord, 'TestEntity');

      // User with undefined roles can still read own record (mockRecord.createdBy === mockUser.id)
      expect(result).toBe(true);
    });

    it('should handle user with multiple roles including admin', () => {
      const multiRoleUser = { ...mockUser, roles: ['user', 'admin', 'manager'] };

      const result = service.canRead(multiRoleUser, mockRecord, 'TestEntity');

      expect(result).toBe(true);
    });

    it('should handle user with multiple roles including manager', () => {
      const multiRoleUser = { ...mockUser, roles: ['user', 'manager'] };

      const result = service.canRead(multiRoleUser, mockRecord, 'TestEntity');

      expect(result).toBe(true);
    });

    it('should handle case-sensitive role names', () => {
      const userWithUppercaseRole = { ...mockUser, roles: ['ADMIN'] };

      const result = service.canDelete(userWithUppercaseRole, mockRecord, 'TestEntity');

      expect(result).toBe(false);
    });

    it('should handle empty tenantId', () => {
      const userWithEmptyTenant = { ...mockUser, tenantId: '' };
      const recordWithEmptyTenant = { ...mockRecord, tenantId: '' };

      const result = service.canRead(userWithEmptyTenant, recordWithEmptyTenant, 'TestEntity');

      expect(result).toBe(true);
    });

    it('should handle null tenantId', () => {
      const userWithNullTenant = { ...mockUser, tenantId: null as any };
      const recordWithNullTenant = { ...mockRecord, tenantId: null as any };

      const result = service.canRead(userWithNullTenant, recordWithNullTenant, 'TestEntity');

      expect(result).toBe(true);
    });

    it('should handle very long tenantId', () => {
      const longTenantId = 'a'.repeat(1000);
      const userWithLongTenant = { ...mockUser, tenantId: longTenantId };
      const recordWithLongTenant = { ...mockRecord, tenantId: longTenantId };

      const result = service.canRead(userWithLongTenant, recordWithLongTenant, 'TestEntity');

      expect(result).toBe(true);
    });

    it('should handle special characters in tenantId', () => {
      const specialTenantId = 'tenant-!@#$%^&*()';
      const userWithSpecialTenant = { ...mockUser, tenantId: specialTenantId };
      const recordWithSpecialTenant = { ...mockRecord, tenantId: specialTenantId };

      const result = service.canRead(userWithSpecialTenant, recordWithSpecialTenant, 'TestEntity');

      expect(result).toBe(true);
    });
  });
});
