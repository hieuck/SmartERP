import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger/logger.service', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { logger } from '@/lib/logger/logger.service';
import { clearConfigCache, getDefaultConfig, loadPrintConfig, type PrintConfig } from './printConfig';

type StorageMock = {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
};

describe('printConfig', () => {
  const mockConfig: PrintConfig = {
    company: {
      name: 'Test Company',
      address: '123 Test Street',
      phone: '0123 456 789',
      taxCode: '1234567890',
      logo: '/logo.png',
    },
    templates: {
      stockReceipt: {
        title: 'Stock Receipt',
        showLogo: true,
        showCompanyInfo: true,
        showNotes: true,
        showSignatures: true,
        signatures: ['Creator'],
      },
      stockIssue: {
        title: 'Stock Issue',
        showLogo: false,
        showCompanyInfo: true,
        showNotes: false,
        showSignatures: true,
        signatures: ['Warehouse'],
      },
      salesOrder: {
        title: 'Sales Order',
        showLogo: true,
        showCompanyInfo: true,
        showCustomerInfo: true,
        showNotes: true,
        showSignatures: false,
        signatures: ['Sales'],
      },
      invoice: {
        title: 'Invoice',
        showLogo: true,
        showCompanyInfo: true,
        showCustomerInfo: true,
        showTax: true,
        taxRate: 10,
        showAmountInWords: true,
        showNotes: true,
        showSignatures: true,
        signatures: ['Seller', 'Buyer'],
      },
    },
    styles: {
      fontSize: '11pt',
      fontFamily: 'Tahoma',
      lineHeight: '1.4',
      padding: '10mm',
      headerFontSize: '16pt',
      companyFontSize: '14pt',
    },
  };

  beforeEach(() => {
    const localStorageMock = localStorage as unknown as StorageMock;
    const sessionStorageMock = sessionStorage as unknown as StorageMock;

    clearConfigCache();
    vi.clearAllMocks();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
    localStorageMock.removeItem.mockReset();
    sessionStorageMock.getItem.mockReset();
    sessionStorageMock.setItem.mockReset();
    global.fetch = vi.fn();
  });

  it('loads config from localStorage before fetching', async () => {
    const localStorageMock = localStorage as unknown as StorageMock;
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockConfig));

    const config = await loadPrintConfig();

    expect(config).toEqual(mockConfig);
    expect(localStorage.getItem).toHaveBeenCalledWith('printConfig');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('caches the loaded config across repeated calls', async () => {
    const localStorageMock = localStorage as unknown as StorageMock;
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockConfig));

    const first = await loadPrintConfig();
    const second = await loadPrintConfig();

    expect(first).toEqual(mockConfig);
    expect(second).toBe(first);
    expect(localStorage.getItem).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('falls back to fetch when localStorage has no config', async () => {
    const localStorageMock = localStorage as unknown as StorageMock;
    localStorageMock.getItem.mockReturnValue(null);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockConfig),
    });

    const config = await loadPrintConfig();

    expect(config).toEqual(mockConfig);
    expect(global.fetch).toHaveBeenCalledWith('/print-config.json');
  });

  it('ignores invalid localStorage config and falls back to fetch', async () => {
    const localStorageMock = localStorage as unknown as StorageMock;
    localStorageMock.getItem.mockReturnValue('{invalid-json');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockConfig),
    });

    const config = await loadPrintConfig();

    expect(config).toEqual(mockConfig);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('printConfig');
    expect(global.fetch).toHaveBeenCalledWith('/print-config.json');
  });

  it('returns default config and logs when fetch fails', async () => {
    const localStorageMock = localStorage as unknown as StorageMock;
    localStorageMock.getItem.mockReturnValue(null);
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    });

    const config = await loadPrintConfig();

    expect(config).toEqual(getDefaultConfig());
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('clears the cache so the next load can use newer data', async () => {
    const localStorageMock = localStorage as unknown as StorageMock;
    localStorageMock.getItem
      .mockReturnValueOnce(JSON.stringify(mockConfig))
      .mockReturnValueOnce(
        JSON.stringify({
          ...mockConfig,
          company: {
            ...mockConfig.company,
            name: 'Updated Company',
          },
        }),
      );

    const first = await loadPrintConfig();
    clearConfigCache();
    const second = await loadPrintConfig();

    expect(first.company.name).toBe('Test Company');
    expect(second.company.name).toBe('Updated Company');
    expect(localStorageMock.getItem).toHaveBeenCalledTimes(2);
  });
});
