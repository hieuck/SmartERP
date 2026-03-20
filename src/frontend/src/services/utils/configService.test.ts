import configService from './configService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);

const generalSettings = [
  {
    id: '1',
    key: 'company.name',
    value: 'SmartERP',
    category: 'GENERAL',
    dataType: 'STRING',
    isPublic: false,
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z',
  },
  {
    id: '2',
    key: 'company.address',
    value: 'HCM',
    category: 'GENERAL',
    dataType: 'STRING',
    isPublic: false,
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z',
  },
  {
    id: '3',
    key: 'company.phone',
    value: '0900',
    category: 'GENERAL',
    dataType: 'STRING',
    isPublic: false,
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z',
  },
  {
    id: '4',
    key: 'company.email',
    value: 'hi@smarterp.vn',
    category: 'GENERAL',
    dataType: 'STRING',
    isPublic: false,
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z',
  },
  {
    id: '5',
    key: 'codes.productPrefix',
    value: 'SP',
    category: 'GENERAL',
    dataType: 'STRING',
    isPublic: false,
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z',
  },
  {
    id: '6',
    key: 'general.defaultTaxRate',
    value: '8',
    category: 'GENERAL',
    dataType: 'NUMBER',
    isPublic: false,
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z',
  },
];

describe('configService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps the settings envelope into grouped config sections', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          ...generalSettings,
          {
            id: '7',
            key: 'email.host',
            value: 'smtp.example.com',
            category: 'EMAIL',
            dataType: 'STRING',
            isPublic: false,
            createdAt: '2026-03-20T00:00:00.000Z',
            updatedAt: '2026-03-20T00:00:00.000Z',
          },
          {
            id: '8',
            key: 'backup.enabled',
            value: 'true',
            category: 'INTEGRATION',
            dataType: 'BOOLEAN',
            isPublic: false,
            createdAt: '2026-03-20T00:00:00.000Z',
            updatedAt: '2026-03-20T00:00:00.000Z',
          },
        ],
      },
    });

    const result = await configService.getAllConfigs();

    expect(api.get).toHaveBeenCalledWith('/settings', { params: undefined });
    expect(result.company).toMatchObject({
      name: 'SmartERP',
      address: 'HCM',
      phone: '0900',
      email: 'hi@smarterp.vn',
    });
    expect(result.codeFormats.productPrefix).toBe('SP');
    expect(result.general.defaultTaxRate).toBe(8);
    expect(result.email.host).toBe('smtp.example.com');
    expect(result.backup.enabled).toBe(true);
  });

  it('saves company, code, general, email, and backup settings through bulk upsert', async () => {
    mockApiPost.mockResolvedValue({ data: { success: true, data: [] } });

    await configService.updateCompanyInfo({
      name: 'SmartERP',
      address: 'HCM',
      phone: '0900',
      email: 'hi@smarterp.vn',
      taxCode: '123',
      logo: '{"src":"logo"}',
    });
    await configService.updateCodeFormats({
      productPrefix: 'SP',
      customerPrefix: 'KH',
      supplierPrefix: 'NCC',
      salesOrderPrefix: 'SO',
      purchaseOrderPrefix: 'PO',
      receiptPrefix: 'PN',
      issuePrefix: 'PX',
    });
    await configService.updateGeneralConfig({
      defaultTaxRate: 10,
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
      language: 'vi',
      dateFormat: 'DD/MM/YYYY',
    });
    await configService.updateEmailConfig({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      user: 'mailer',
      password: 'secret',
      from: 'noreply@example.com',
    });
    await configService.updateBackupConfig({
      enabled: true,
      frequency: 'weekly',
      time: '23:00',
      retention: 12,
    });

    expect(api.post).toHaveBeenNthCalledWith(
      1,
      '/settings/bulk',
      expect.objectContaining({
        settings: expect.arrayContaining([
          expect.objectContaining({ key: 'company.name', value: 'SmartERP', category: 'GENERAL' }),
          expect.objectContaining({ key: 'company.logo', dataType: 'JSON' }),
        ]),
      }),
    );
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      '/settings/bulk',
      expect.objectContaining({
        settings: expect.arrayContaining([
          expect.objectContaining({ key: 'codes.productPrefix', value: 'SP' }),
          expect.objectContaining({ key: 'codes.issuePrefix', value: 'PX' }),
        ]),
      }),
    );
    expect(api.post).toHaveBeenNthCalledWith(
      3,
      '/settings/bulk',
      expect.objectContaining({
        settings: expect.arrayContaining([
          expect.objectContaining({
            key: 'general.defaultTaxRate',
            value: '10',
            dataType: 'NUMBER',
          }),
        ]),
      }),
    );
    expect(api.post).toHaveBeenNthCalledWith(
      4,
      '/settings/bulk',
      expect.objectContaining({
        settings: expect.arrayContaining([
          expect.objectContaining({ key: 'email.port', value: '587', dataType: 'NUMBER' }),
          expect.objectContaining({ key: 'email.secure', value: 'false', dataType: 'BOOLEAN' }),
        ]),
      }),
    );
    expect(api.post).toHaveBeenNthCalledWith(
      5,
      '/settings/bulk',
      expect.objectContaining({
        settings: expect.arrayContaining([
          expect.objectContaining({ key: 'backup.enabled', value: 'true', dataType: 'BOOLEAN' }),
          expect.objectContaining({ key: 'backup.retention', value: '12', dataType: 'NUMBER' }),
        ]),
      }),
    );
  });

  it('builds config history from current settings and seeds defaults via bulk upsert', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { success: true, data: generalSettings } });
    mockApiPost.mockResolvedValueOnce({ data: { success: true, data: [] } });

    const history = await configService.getConfigHistory('company.name');
    await configService.initializeDefaults();

    expect(history).toEqual([
      {
        key: 'company.name',
        value: 'SmartERP',
        timestamp: '2026-03-20T00:00:00.000Z',
      },
    ]);
    expect(api.post).toHaveBeenCalledWith(
      '/settings/bulk',
      expect.objectContaining({
        settings: expect.arrayContaining([
          expect.objectContaining({ key: 'codes.productPrefix', value: 'SP' }),
          expect.objectContaining({ key: 'backup.frequency', value: 'daily' }),
        ]),
      }),
    );
  });

  it('uses the live email module endpoints for reachability and test sends', async () => {
    mockApiGet.mockResolvedValueOnce({ data: { success: true, data: [] } });
    mockApiPost.mockResolvedValueOnce({ data: { success: true, data: { id: 'log-1' } } });

    const testResult = await configService.testEmailConnection();
    const sendResult = await configService.sendTestEmail(
      {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        user: 'mailer',
        password: 'secret',
        from: 'noreply@example.com',
      },
      'test@example.com',
    );

    expect(api.get).toHaveBeenCalledWith('/email/logs');
    expect(api.post).toHaveBeenCalledWith('/email/send', {
      to: 'test@example.com',
      subject: 'SmartERP test email',
      body: 'This is a test email from SmartERP settings.',
    });
    expect(testResult.success).toBe(true);
    expect(testResult.message).toContain('reachable');
    expect(sendResult).toEqual({
      success: true,
      message: 'Test email sent successfully.',
    });
  });
});
