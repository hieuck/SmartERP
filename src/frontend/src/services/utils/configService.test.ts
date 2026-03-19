import configService, {
  type BackupConfig,
  type CodeFormats,
  type CompanyInfo,
  type EmailConfig,
  type GeneralConfig,
} from './configService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);

describe('configService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets all configs and company info', async () => {
    const allConfigs = {
      company: { name: 'SmartERP', address: 'HCM', phone: '0900', email: 'hi@smarterp.vn' },
      codeFormats: {
        productPrefix: 'SP',
        customerPrefix: 'KH',
        supplierPrefix: 'NCC',
        salesOrderPrefix: 'SO',
        purchaseOrderPrefix: 'PO',
        receiptPrefix: 'RC',
        issuePrefix: 'IS',
      },
      general: {
        defaultTaxRate: 10,
        currency: 'VND',
        timezone: 'Asia/Saigon',
        language: 'vi',
        dateFormat: 'DD/MM/YYYY',
      },
      email: {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        user: 'mailer',
        password: 'secret',
        from: 'noreply@example.com',
      },
      backup: {
        enabled: true,
        frequency: 'daily' as const,
        time: '01:00',
        retention: 30,
      },
    };
    const company = allConfigs.company;
    mockApiGet.mockResolvedValueOnce({ data: allConfigs });
    mockApiGet.mockResolvedValueOnce({ data: company });

    const allResult = await configService.getAllConfigs();
    const companyResult = await configService.getCompanyInfo();

    expect(api.get).toHaveBeenNthCalledWith(1, '/config');
    expect(api.get).toHaveBeenNthCalledWith(2, '/config/company/info');
    expect(allResult).toEqual(allConfigs);
    expect(companyResult).toEqual(company);
  });

  it('updates company, code formats, general, email, and backup config', async () => {
    const company: CompanyInfo = {
      name: 'SmartERP',
      address: 'HCM',
      phone: '0900',
      email: 'hi@smarterp.vn',
    };
    const codeFormats: CodeFormats = {
      productPrefix: 'SP',
      customerPrefix: 'KH',
      supplierPrefix: 'NCC',
      salesOrderPrefix: 'SO',
      purchaseOrderPrefix: 'PO',
      receiptPrefix: 'RC',
      issuePrefix: 'IS',
    };
    const general: GeneralConfig = {
      defaultTaxRate: 8,
      currency: 'VND',
      timezone: 'Asia/Saigon',
      language: 'vi',
      dateFormat: 'DD/MM/YYYY',
    };
    const email: EmailConfig = {
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      user: 'mailer',
      password: 'secret',
      from: 'noreply@example.com',
    };
    const backup: BackupConfig = {
      enabled: true,
      frequency: 'weekly',
      time: '23:00',
      retention: 12,
    };
    mockApiPut.mockResolvedValueOnce({ data: company });
    mockApiPut.mockResolvedValueOnce({ data: codeFormats });
    mockApiPut.mockResolvedValueOnce({ data: general });
    mockApiPut.mockResolvedValueOnce({ data: email });
    mockApiPut.mockResolvedValueOnce({ data: backup });

    const companyResult = await configService.updateCompanyInfo(company);
    const codeResult = await configService.updateCodeFormats(codeFormats);
    const generalResult = await configService.updateGeneralConfig(general);
    const emailResult = await configService.updateEmailConfig(email);
    const backupResult = await configService.updateBackupConfig(backup);

    expect(api.put).toHaveBeenNthCalledWith(1, '/config/company/info', company);
    expect(api.put).toHaveBeenNthCalledWith(2, '/config/code-formats', codeFormats);
    expect(api.put).toHaveBeenNthCalledWith(3, '/config/general', general);
    expect(api.put).toHaveBeenNthCalledWith(4, '/config/email', email);
    expect(api.put).toHaveBeenNthCalledWith(5, '/config/backup', backup);
    expect(companyResult).toEqual(company);
    expect(codeResult).toEqual(codeFormats);
    expect(generalResult).toEqual(general);
    expect(emailResult).toEqual(email);
    expect(backupResult).toEqual(backup);
  });

  it('gets individual config groups and config history', async () => {
    const codeFormats = { productPrefix: 'SP' };
    const general = { currency: 'VND' };
    const email = { host: 'smtp.example.com' };
    const backup = { enabled: true };
    const history = [{ key: 'general.currency', value: 'VND', timestamp: '2026-03-19T00:00:00Z' }];
    mockApiGet.mockResolvedValueOnce({ data: codeFormats });
    mockApiGet.mockResolvedValueOnce({ data: general });
    mockApiGet.mockResolvedValueOnce({ data: email });
    mockApiGet.mockResolvedValueOnce({ data: backup });
    mockApiGet.mockResolvedValueOnce({ data: history });

    const codeResult = await configService.getCodeFormats();
    const generalResult = await configService.getGeneralConfig();
    const emailResult = await configService.getEmailConfig();
    const backupResult = await configService.getBackupConfig();
    const historyResult = await configService.getConfigHistory('general.currency');

    expect(api.get).toHaveBeenNthCalledWith(1, '/config/code-formats');
    expect(api.get).toHaveBeenNthCalledWith(2, '/config/general');
    expect(api.get).toHaveBeenNthCalledWith(3, '/config/email');
    expect(api.get).toHaveBeenNthCalledWith(4, '/config/backup');
    expect(api.get).toHaveBeenNthCalledWith(5, '/config/history', {
      params: { key: 'general.currency' },
    });
    expect(codeResult).toEqual(codeFormats);
    expect(generalResult).toEqual(general);
    expect(emailResult).toEqual(email);
    expect(backupResult).toEqual(backup);
    expect(historyResult).toEqual(history);
  });

  it('tests email connection, sends test email, and initializes defaults', async () => {
    const emailConfig: EmailConfig = {
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      user: 'mailer',
      password: 'secret',
      from: 'noreply@example.com',
    };
    const testResult = { success: true, message: 'Connected' };
    const sendResult = { success: true, message: 'Email sent' };
    mockApiPost.mockResolvedValueOnce({ data: testResult });
    mockApiPost.mockResolvedValueOnce({ data: sendResult });
    mockApiPost.mockResolvedValueOnce({ data: undefined });

    const connectionResult = await configService.testEmailConnection(emailConfig);
    const sendEmailResult = await configService.sendTestEmail(emailConfig, 'test@example.com');
    await configService.initializeDefaults();

    expect(api.post).toHaveBeenNthCalledWith(1, '/config/email/test-connection', emailConfig);
    expect(api.post).toHaveBeenNthCalledWith(2, '/config/email/send-test', {
      ...emailConfig,
      to: 'test@example.com',
    });
    expect(api.post).toHaveBeenNthCalledWith(3, '/config/initialize');
    expect(connectionResult).toEqual(testResult);
    expect(sendEmailResult).toEqual(sendResult);
  });
});
