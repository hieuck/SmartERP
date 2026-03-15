import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AccountOfflineService,
  JournalEntryOfflineService,
  TaxRateOfflineService,
} from './accounting-offline.service';
import { db, SyncStatus } from '@/lib/offline/db';

vi.mock('@/lib/offline/sync-manager', () => ({
  syncManager: {
    queueOperation: vi.fn(),
  },
}));

describe('Accounting Offline Services', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.clearAllMocks();
  });

  describe('AccountOfflineService', () => {
    let service: AccountOfflineService;

    beforeEach(() => {
      service = new AccountOfflineService();
    });

    it('should create account', async () => {
      const account = await service.create({
        tenantId: 'tenant1',
        accountNumber: 'ACC001',
        accountName: 'Cash',
        accountType: 'asset',
        currency: 'USD',
        balance: 1000,
        isActive: true,
      } as any);

      expect(account.id).toBeDefined();
      expect(account.accountName).toBe('Cash');
      expect(account.syncStatus).toBe(SyncStatus.PENDING);
    });

    it('should get account by account number', async () => {
      await service.create({
        tenantId: 'tenant1',
        accountNumber: 'ACC001',
        accountName: 'Cash',
        accountType: 'asset',
        currency: 'USD',
        balance: 1000,
        isActive: true,
      } as any);

      const found = await service.getByAccountNumber('ACC001');
      expect(found).toBeDefined();
      expect(found?.accountName).toBe('Cash');
    });

    it('should get accounts by type', async () => {
      await service.create({
        tenantId: 'tenant1',
        accountNumber: 'ACC001',
        accountName: 'Cash',
        accountType: 'asset',
        currency: 'USD',
        balance: 1000,
        isActive: true,
      } as any);

      const assets = await service.getByType('asset');
      expect(assets.length).toBeGreaterThan(0);
      expect(assets.every(a => a.accountType === 'asset')).toBe(true);
    });
  });

  describe('JournalEntryOfflineService', () => {
    let service: JournalEntryOfflineService;

    beforeEach(() => {
      service = new JournalEntryOfflineService();
    });

    it('should create journal entry', async () => {
      const entry = await service.create({
        tenantId: 'tenant1',
        entryNumber: 'JE001',
        entryDate: new Date(),
        totalDebit: 1000,
        totalCredit: 1000,
        status: 'draft',
        lines: [],
      } as any);

      expect(entry.id).toBeDefined();
      expect(entry.entryNumber).toBe('JE001');
      expect(entry.syncStatus).toBe(SyncStatus.PENDING);
    });

    it('should get journal entries by status', async () => {
      await service.create({
        tenantId: 'tenant1',
        entryNumber: 'JE001',
        entryDate: new Date(),
        totalDebit: 1000,
        totalCredit: 1000,
        status: 'posted',
        lines: [],
      } as any);

      const posted = await service.getByStatus('posted');
      expect(posted.length).toBeGreaterThan(0);
      expect(posted.every(e => e.status === 'posted')).toBe(true);
    });
  });

  describe('TaxRateOfflineService', () => {
    let service: TaxRateOfflineService;

    beforeEach(() => {
      service = new TaxRateOfflineService();
    });

    it('should create tax rate', async () => {
      const taxRate = await service.create({
        tenantId: 'tenant1',
        taxName: 'VAT',
        taxCode: 'VAT10',
        rate: 10,
        taxType: 'sales',
        isActive: true,
      } as any);

      expect(taxRate.id).toBeDefined();
      expect(taxRate.taxName).toBe('VAT');
      expect(taxRate.rate).toBe(10);
    });

    it('should get active tax rates', async () => {
      await service.create({
        tenantId: 'tenant1',
        taxName: 'VAT',
        taxCode: 'VAT10',
        rate: 10,
        taxType: 'sales',
        isActive: true,
      } as any);

      const active = await service.getActive();
      expect(active.length).toBeGreaterThan(0);
    });
  });
});
