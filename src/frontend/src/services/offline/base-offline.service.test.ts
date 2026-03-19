import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseOfflineService } from './base-offline.service';
import { db, SyncStatus, BaseEntity } from '@/lib/offline/db';
import { syncManager } from '@/lib/offline/sync-manager';
import type { Table } from 'dexie';

// Mock sync manager
vi.mock('@/lib/offline/sync-manager', () => ({
  syncManager: {
    queueOperation: vi.fn(),
  },
}));

interface TestEntity extends BaseEntity {
  name: string;
  code: string;
}

type TestEntityCreate = Omit<TestEntity, 'id' | 'version' | 'syncStatus' | 'createdAt' | 'updatedAt'>;
type TestEntityUpdate = Partial<TestEntity>;

describe('BaseOfflineService', () => {
  let service: BaseOfflineService<TestEntity>;

  beforeEach(async () => {
    // Clear database before each test
    await db.delete();
    await db.open();
    
    // Create test service using products table
    service = new BaseOfflineService(db.products as unknown as Table<TestEntity, string>, 'testEntity');
    
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all records', async () => {
      const records = await service.getAll();
      expect(Array.isArray(records)).toBe(true);
    });
  });

  describe('create', () => {
    it('should create new record with pending sync status', async () => {
      const data: TestEntityCreate = {
        tenantId: 'tenant1',
        name: 'Test Product',
        code: 'TEST001',
      };

      const result = await service.create(data);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Product');
      expect(result.syncStatus).toBe(SyncStatus.PENDING);
      expect(result.version).toBe(1);
      expect(syncManager.queueOperation).toHaveBeenCalledWith(
        'testEntity',
        'create',
        expect.objectContaining({ name: 'Test Product' }),
        1,
        result.id
      );
    });
  });

  describe('getById', () => {
    it('should return record by id', async () => {
      const created = await service.create({
        tenantId: 'tenant1',
        name: 'Test Product',
        code: 'TEST001',
      });

      const found = await service.getById(created.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Product');
    });

    it('should return undefined for non-existent id', async () => {
      const found = await service.getById('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update existing record', async () => {
      const created = await service.create({
        tenantId: 'tenant1',
        name: 'Test Product',
        code: 'TEST001',
      });

      const updated = await service.update(created.id, { name: 'Updated Product' } satisfies TestEntityUpdate);

      expect(updated.name).toBe('Updated Product');
      expect(updated.version).toBe(2);
      expect(updated.syncStatus).toBe(SyncStatus.PENDING);
      expect(syncManager.queueOperation).toHaveBeenCalledWith(
        'testEntity',
        'update',
        expect.objectContaining({ name: 'Updated Product' }),
        2,
        created.id
      );
    });

    it('should throw error for non-existent record', async () => {
      await expect(service.update('non-existent', { name: 'Updated' } satisfies TestEntityUpdate))
        .rejects.toThrow('testEntity not found');
    });
  });

  describe('delete', () => {
    it('should soft delete record', async () => {
      const created = await service.create({
        tenantId: 'tenant1',
        name: 'Test Product',
        code: 'TEST001',
      });

      await service.delete(created.id);

      const found = await service.getById(created.id);
      expect(found?.deletedAt).toBeDefined();
      expect(found?.syncStatus).toBe(SyncStatus.PENDING);
      expect(syncManager.queueOperation).toHaveBeenCalledWith(
        'testEntity',
        'delete',
        expect.objectContaining({ deletedAt: expect.any(Date) }),
        expect.any(Number),
        created.id
      );
    });

    it('should throw error for non-existent record', async () => {
      await expect(service.delete('non-existent'))
        .rejects.toThrow('testEntity not found');
    });
  });

  describe('getPending', () => {
    it('should return only pending records', async () => {
      await service.create({
        tenantId: 'tenant1',
        name: 'Pending Product',
        code: 'PEND001',
      });

      const pending = await service.getPending();
      expect(pending.length).toBeGreaterThan(0);
      expect(pending.every(r => r.syncStatus === SyncStatus.PENDING)).toBe(true);
    });
  });

  describe('count', () => {
    it('should return correct count', async () => {
      await service.create({
        tenantId: 'tenant1',
        name: 'Product 1',
        code: 'PROD001',
      });

      await service.create({
        tenantId: 'tenant1',
        name: 'Product 2',
        code: 'PROD002',
      });

      const count = await service.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });
});
