import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  let service: PermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionService],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  describe('canRead', () => {
    it('should allow read for owner', () => {
      const user = { id: 'user1', tenantId: 'tenant1', roles: ['user'] };
      const record = { id: 'record1', tenantId: 'tenant1', createdBy: 'user1' };

      const result = service.canRead(user, record, 'Order');

      expect(result).toBe(true);
    });

    it('should deny read for different tenant', () => {
      const user = { id: 'user1', tenantId: 'tenant1', roles: ['user'] };
      const record = { id: 'record1', tenantId: 'tenant2', createdBy: 'user2' };

      const result = service.canRead(user, record, 'Order');

      expect(result).toBe(false);
    });

    it('should allow read for admin role', () => {
      const user = { id: 'user1', tenantId: 'tenant1', roles: ['admin'] };
      const record = { id: 'record1', tenantId: 'tenant1', createdBy: 'user2' };

      const result = service.canRead(user, record, 'Order');

      expect(result).toBe(true);
    });
  });

  describe('canWrite', () => {
    it('should allow write for owner', () => {
      const user = { id: 'user1', tenantId: 'tenant1', roles: ['user'] };
      const record = { id: 'record1', tenantId: 'tenant1', createdBy: 'user1' };

      const result = service.canWrite(user, record, 'Order');

      expect(result).toBe(true);
    });

    it('should deny write for non-owner without permission', () => {
      const user = { id: 'user1', tenantId: 'tenant1', roles: ['user'] };
      const record = { id: 'record1', tenantId: 'tenant1', createdBy: 'user2' };

      const result = service.canWrite(user, record, 'Order');

      expect(result).toBe(false);
    });

    it('should allow write for manager role', () => {
      const user = { id: 'user1', tenantId: 'tenant1', roles: ['manager'] };
      const record = { id: 'record1', tenantId: 'tenant1', createdBy: 'user2' };

      const result = service.canWrite(user, record, 'Order');

      expect(result).toBe(true);
    });
  });

  describe('canDelete', () => {
    it('should deny delete for regular user', () => {
      const user = { id: 'user1', tenantId: 'tenant1', roles: ['user'] };
      const record = { id: 'record1', tenantId: 'tenant1', createdBy: 'user1' };

      const result = service.canDelete(user, record, 'Order');

      expect(result).toBe(false);
    });

    it('should allow delete for admin', () => {
      const user = { id: 'user1', tenantId: 'tenant1', roles: ['admin'] };
      const record = { id: 'record1', tenantId: 'tenant1', createdBy: 'user2' };

      const result = service.canDelete(user, record, 'Order');

      expect(result).toBe(true);
    });
  });

  describe('buildSecureQuery', () => {
    it('should add tenantId and createdBy filter for non-admin', () => {
      const user = { id: 'user1', tenantId: 'tenant1', roles: ['user'] };
      const baseWhere = { status: 'active' };

      const result = service.buildSecureQuery(user, baseWhere, 'Order');

      expect(result).toEqual({
        status: 'active',
        tenantId: 'tenant1',
        createdBy: 'user1', // Non-admin users can only see their own records
      });
    });

    it('should add owner filter for non-admin', () => {
      const user = { id: 'user1', tenantId: 'tenant1', roles: ['user'] };
      const baseWhere = {};

      const result = service.buildSecureQuery(user, baseWhere, 'Order');

      expect(result).toEqual({
        tenantId: 'tenant1',
        createdBy: 'user1',
      });
    });

    it('should not add owner filter for admin', () => {
      const user = { id: 'user1', tenantId: 'tenant1', roles: ['admin'] };
      const baseWhere = {};

      const result = service.buildSecureQuery(user, baseWhere, 'Order');

      expect(result).toEqual({
        tenantId: 'tenant1',
      });
    });
  });
});
