import { db, Account, JournalEntry, Ledger, TaxRate } from '@/lib/offline/db';
import { BaseOfflineService } from './base-offline.service';

/**
 * Account offline service
 */
export class AccountOfflineService extends BaseOfflineService<Account> {
  constructor() {
    super(db.accounts, 'accounts');
  }

  async getByAccountNumber(accountNumber: string): Promise<Account | undefined> {
    return db.accounts.where('accountNumber').equals(accountNumber).first();
  }

  async getByType(accountType: string): Promise<Account[]> {
    return db.accounts.where('accountType').equals(accountType).toArray();
  }

  async getActive(): Promise<Account[]> {
    const all = await db.accounts.toArray();
    return all.filter((account) => account.isActive);
  }
}

/**
 * Journal Entry offline service
 */
export class JournalEntryOfflineService extends BaseOfflineService<JournalEntry> {
  constructor() {
    super(db.journalEntries, 'journalEntries');
  }

  async getByEntryNumber(entryNumber: string): Promise<JournalEntry | undefined> {
    return db.journalEntries.where('entryNumber').equals(entryNumber).first();
  }

  async getByStatus(status: string): Promise<JournalEntry[]> {
    return db.journalEntries.where('status').equals(status).toArray();
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<JournalEntry[]> {
    return db.journalEntries
      .where('entryDate')
      .between(startDate, endDate, true, true)
      .toArray();
  }
}

/**
 * Ledger offline service
 */
export class LedgerOfflineService extends BaseOfflineService<Ledger> {
  constructor() {
    super(db.ledgers, 'ledgers');
  }

  async getByAccount(accountId: string): Promise<Ledger[]> {
    return db.ledgers.where('accountId').equals(accountId).toArray();
  }

  async getByJournalEntry(journalEntryId: string): Promise<Ledger[]> {
    return db.ledgers.where('journalEntryId').equals(journalEntryId).toArray();
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<Ledger[]> {
    return db.ledgers
      .where('transactionDate')
      .between(startDate, endDate, true, true)
      .toArray();
  }
}

/**
 * Tax Rate offline service
 */
export class TaxRateOfflineService extends BaseOfflineService<TaxRate> {
  constructor() {
    super(db.taxRates, 'taxRates');
  }

  async getByTaxCode(taxCode: string): Promise<TaxRate | undefined> {
    return db.taxRates.where('taxCode').equals(taxCode).first();
  }

  async getActive(): Promise<TaxRate[]> {
    const all = await db.taxRates.toArray();
    return all.filter((taxRate) => taxRate.isActive);
  }

  async getByType(taxType: string): Promise<TaxRate[]> {
    const all = await db.taxRates.toArray();
    return all.filter(tax => tax.taxType === taxType && tax.isActive);
  }
}

// Export singleton instances
export const accountOfflineService = new AccountOfflineService();
export const journalEntryOfflineService = new JournalEntryOfflineService();
export const ledgerOfflineService = new LedgerOfflineService();
export const taxRateOfflineService = new TaxRateOfflineService();
