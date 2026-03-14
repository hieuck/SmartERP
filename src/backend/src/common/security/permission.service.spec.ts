/**
 * PermissionService Unit Tests
 * Coverage target: 95%
 * 
 * Test cases:
 * 1. canRead - Admin, Manager, Owner, Different tenant
 * 2. canWrite - Admin, Manager, Owner, Different tenant
 * 3. canDelete - Admin only, Manager denied, Owner denied
 * 4. buildSecureQuery - Admin, Manager, Regular user
 */

import { PermissionService, User, BaseRecord } from './permission.service';

describe('PermissionService', () => {
  let service: PermissionService;

  const adminUser: User = {
    id: 'admin-123',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const managerUser: User = {
    id: 'manager-123',
    tenantId: 'tenant-123',
    roles: ['manager'],
  };

  const regularUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['user'],
  };

  const otherTenantUser: User = {
    id: 'user-456',
    tenantId: 'tenant-456',
    roles: ['user'],
  };

  const ownedRecord: BaseRecord = {
    id: 'record-123',
    tenantId: 'tenant-123',
    createdBy: 'user-123',
  };

  const otherUserRecord: BaseRecord = {
    id: 'record-456',
    tenantId: 'tenant-123',
    createdBy: 'other-user-123',
  };

  const otherTenantRecord: BaseRecord = {
    id: 'record-789',
    tenantId: 'tenant-456',
    createdBy: 'user-456',
  };

  beforeEach(() => {
    service = new PermissionService();
  });

  describe('canRead', () => {
    it('should allow admin to read any record in same tenant', () => {
      expect(service.canRead(adminUser, ownedRecord, 'Product')).toBe(true);
      expect(service.canRead(adminUser, otherUserRecord, 'Product')).toBe(true);
    });

    it('should allow manager to read any record in same tenant', () => {
      expect(service.canRead(managerUser, ownedRecord, 'Product')).toBe(true);
      expect(service.canRead(managerUser, otherUserRecord, 'Product')).toBe(true);
    });

    it('should allow regular user to read own records', () => {
      expect(service.canRead(regularUser, ownedRecord, 'Product')).toBe(true);
    });

    it('should deny regular user to read other user records', () => {
      expect(service.canRead(regularUser, otherUserRecord, 'Product')).toBe(false);
    });

    it('should deny access to records from different tenant', () => {
      expect(service.canRead(adminUser, otherTenantRecord, 'Product')).toBe(false);
      expect(service.canRead(managerUser, otherTenantRecord, 'Product')).toBe(false);
      expect(service.canRead(regularUser, otherTenantRecord, 'Product')).toBe(false);
    });

    it('should handle user without roles', () => {
      const userWithoutRoles: User = {
        id: 'user-no-roles',
        tenantId: 'tenant-123',
        roles: [],
      };
      expect(service.canRead(userWithoutRoles, ownedRecord, 'Product')).toBe(false);
    });

    it('should handle record without createdBy', () => {
      const recordWithoutCreator: BaseRecord = {
        id: 'record-no-creator',
        tenantId: 'tenant-123',
      };
      expect(service.canRead(regularUser, recordWithoutCreator, 'Product')).toBe(false);
      expect(service.canRead(adminUser, recordWithoutCreator, 'Product')).toBe(true);
    });
  });

  describe('canWrite', () => {
    it('should allow admin to write any record in same tenant', () => {
      expect(service.canWrite(adminUser, ownedRecord, 'Product')).toBe(true);
      expect(service.canWrite(adminUser, otherUserRecord, 'Product')).toBe(true);
    });

    it('should allow manager to write any record in same tenant', () => {
      expect(service.canWrite(managerUser, ownedRecord, 'Product')).toBe(true);
      expect(service.canWrite(managerUser, otherUserRecord, 'Product')).toBe(true);
    });

    it('should allow regular user to write own records', () => {
      expect(service.canWrite(regularUser, ownedRecord, 'Product')).toBe(true);
    });

    it('should deny regular user to write other user records', () => {
      expect(service.canWrite(regularUser, otherUserRecord, 'Product')).toBe(false);
    });

    it('should deny access to records from different tenant', () => {
      expect(service.canWrite(adminUser, otherTenantRecord, 'Product')).toBe(false);
      expect(service.canWrite(managerUser, otherTenantRecord, 'Product')).toBe(false);
      expect(service.canWrite(regularUser, otherTenantRecord, 'Product')).toBe(false);
    });

    it('should handle user without roles', () => {
      const userWithoutRoles: User = {
        id: 'user-no-roles',
        tenantId: 'tenant-123',
        roles: [],
      };
      expect(service.canWrite(userWithoutRoles, ownedRecord, 'Product')).toBe(false);
    });

    it('should handle record without createdBy', () => {
      const recordWithoutCreator: BaseRecord = {
        id: 'record-no-creator',
        tenantId: 'tenant-123',
      };
      expect(service.canWrite(regularUser, recordWithoutCreator, 'Product')).toBe(false);
      expect(service.canWrite(adminUser, recordWithoutCreator, 'Product')).toBe(true);
    });
  });

  describe('canDelete', () => {
    it('should allow admin to delete any record in same tenant', () => {
      expect(service.canDelete(adminUser, ownedRecord, 'Product')).toBe(true);
      expect(service.canDelete(adminUser, otherUserRecord, 'Product')).toBe(true);
    });

    it('should deny manager to delete records', () => {
      expect(service.canDelete(managerUser, ownedRecord, 'Product')).toBe(false);
      expect(service.canDelete(managerUser, otherUserRecord, 'Product')).toBe(false);
    });

    it('should deny regular user to delete own records', () => {
      expect(service.canDelete(regularUser, ownedRecord, 'Product')).toBe(false);
    });

    it('should deny regular user to delete other user records', () => {
      expect(service.canDelete(regularUser, otherUserRecord, 'Product')).toBe(false);
    });

    it('should deny access to records from different tenant', () => {
      expect(service.canDelete(adminUser, otherTenantRecord, 'Product')).toBe(false);
      expect(service.canDelete(managerUser, otherTenantRecord, 'Product')).toBe(false);
      expect(service.canDelete(regularUser, otherTenantRecord, 'Product')).toBe(false);
    });

    it('should handle user without roles', () => {
      const userWithoutRoles: User = {
        id: 'user-no-roles',
        tenantId: 'tenant-123',
        roles: [],
      };
      expect(service.canDelete(userWithoutRoles, ownedRecord, 'Product')).toBe(false);
    });
  });

  describe('buildSecureQuery', () => {
    it('should add tenantId filter for all users', () => {
      const baseWhere = { status: 'active' };
      
      const adminQuery = service.buildSecureQuery(adminUser, baseWhere, 'Product');
      expect(adminQuery.tenantId).toBe('tenant-123');
      expect(adminQuery.status).toBe('active');
      expect(adminQuery.createdBy).toBeUndefined();
    });

    it('should add createdBy filter for regular users', () => {
      const baseWhere = { status: 'active' };
      
      const userQuery = service.buildSecureQuery(regularUser, baseWhere, 'Product');
      expect(userQuery.tenantId).toBe('tenant-123');
      expect(userQuery.status).toBe('active');
      expect(userQuery.createdBy).toBe('user-123');
    });

    it('should not add createdBy filter for managers', () => {
      const baseWhere = { status: 'active' };
      
      const managerQuery = service.buildSecureQuery(managerUser, baseWhere, 'Product');
      expect(managerQuery.tenantId).toBe('tenant-123');
      expect(managerQuery.status).toBe('active');
      expect(managerQuery.createdBy).toBeUndefined();
    });

    it('should not modify original baseWhere object', () => {
      const baseWhere = { status: 'active' };
      const originalWhere = { ...baseWhere };
      
      service.buildSecureQuery(regularUser, baseWhere, 'Product');
      
      expect(baseWhere).toEqual(originalWhere);
    });

    it('should handle empty baseWhere', () => {
      const baseWhere = {};
      
      const query = service.buildSecureQuery(regularUser, baseWhere, 'Product');
      expect(query.tenantId).toBe('tenant-123');
      expect(query.createdBy).toBe('user-123');
    });

    it('should override tenantId if present in baseWhere', () => {
      const baseWhere = { tenantId: 'wrong-tenant', status: 'active' };
      
      const query = service.buildSecureQuery(regularUser, baseWhere, 'Product');
      expect(query.tenantId).toBe('tenant-123');
      expect(query.status).toBe('active');
    });

    it('should handle user without roles as regular user', () => {
      const userWithoutRoles: User = {
        id: 'user-no-roles',
        tenantId: 'tenant-123',
        roles: [],
      };
      const baseWhere = { status: 'active' };
      
      const query = service.buildSecureQuery(userWithoutRoles, baseWhere, 'Product');
      expect(query.tenantId).toBe('tenant-123');
      expect(query.createdBy).toBe('user-no-roles');
    });
  });
});
