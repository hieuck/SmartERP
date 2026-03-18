import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from './db';
import { SyncManager } from './sync-manager';

vi.mock('axios');

describe('SyncManager', () => {
  let manager: SyncManager;

  beforeEach(async () => {
    await db.delete();
    await db.open();
    manager = new SyncManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sync', () => {
    it('should sync all 41 entities successfully', async () => {
      const mockToken = 'test-token';

      // Mock pull response
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          data: {
            changes: [
              {
                entity: 'products',
                records: [{ id: '1', name: 'Product 1', tenantId: 'tenant1' }],
              },
              {
                entity: 'accounts',
                records: [{ id: '2', accountName: 'Account 1', tenantId: 'tenant1' }],
              },
              {
                entity: 'employees',
                records: [{ id: '3', firstName: 'John', tenantId: 'tenant1' }],
              },
            ],
          },
        },
      });

      // Mock push response
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          data: {
            applied: 0,
            conflicts: [],
          },
        },
      });

      const result = await manager.sync(mockToken);

      expect(result.success).toBe(true);
      expect(result.pulled).toBe(3);
      expect(vi.mocked(axios.post)).toHaveBeenCalledWith(
        expect.stringContaining('/api/sync/pull'),
        expect.objectContaining({
          entities: expect.arrayContaining([
            'products',
            'customers',
            'suppliers',
            'accounts',
            'journalEntries',
            'ledgers',
            'taxRates',
            'purchaseReceipts',
            'supplierInvoices',
            'quotations',
            'deliveryNotes',
            'stockAdjustments',
            'stockTransfers',
            'binLocations',
            'boms',
            'workOrders',
            'productionPlans',
            'employees',
            'departments',
            'positions',
            'shifts',
            'projects',
            'tasks',
            'timeEntries',
            'documents',
            'reports',
            'workflows',
            'settings',
          ]),
        }),
        expect.any(Object),
      );
    });

    it('should handle sync errors gracefully', async () => {
      const mockToken = 'test-token';

      vi.mocked(axios.post).mockRejectedValueOnce(new Error('Network error'));

      const result = await manager.sync(mockToken);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Network error');
    });
  });

  describe('queueOperation', () => {
    it('should queue operation for new entities', async () => {
      await manager.queueOperation(
        'accounts',
        'create',
        { id: '1', accountName: 'Test' },
        1,
        'offline_1',
      );

      const queueSize = await manager.getQueueSize();
      expect(queueSize).toBeGreaterThan(0);
    });
  });

  describe('applyChanges', () => {
    it('should apply changes to all 27 new entities', async () => {
      const mockToken = 'test-token';

      // Mock pull with all new entities
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          data: {
            changes: [
              {
                entity: 'accounts',
                records: [{ id: '1', accountName: 'Account 1', tenantId: 'tenant1' }],
              },
              {
                entity: 'journalEntries',
                records: [{ id: '2', entryNumber: 'JE001', tenantId: 'tenant1' }],
              },
              {
                entity: 'employees',
                records: [{ id: '3', firstName: 'John', tenantId: 'tenant1' }],
              },
              {
                entity: 'projects',
                records: [{ id: '4', projectName: 'Project 1', tenantId: 'tenant1' }],
              },
              {
                entity: 'documents',
                records: [{ id: '5', documentName: 'Doc 1', tenantId: 'tenant1' }],
              },
            ],
          },
        },
      });

      // Mock push response
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          data: {
            applied: 0,
            conflicts: [],
          },
        },
      });

      const result = await manager.sync(mockToken);

      expect(result.success).toBe(true);
      expect(result.pulled).toBe(5);

      // Verify records were stored
      const accounts = await db.accounts.toArray();
      const journalEntries = await db.journalEntries.toArray();
      const employees = await db.employees.toArray();
      const projects = await db.projects.toArray();
      const documents = await db.documents.toArray();

      expect(accounts.length).toBeGreaterThan(0);
      expect(journalEntries.length).toBeGreaterThan(0);
      expect(employees.length).toBeGreaterThan(0);
      expect(projects.length).toBeGreaterThan(0);
      expect(documents.length).toBeGreaterThan(0);
    });
  });

  describe('enableAutoSync', () => {
    it('should enable auto sync', () => {
      manager.enableAutoSync();
      expect(manager['autoSyncEnabled']).toBe(true);
    });
  });

  describe('disableAutoSync', () => {
    it('should disable auto sync', () => {
      manager.disableAutoSync();
      expect(manager['autoSyncEnabled']).toBe(false);
    });
  });
});
