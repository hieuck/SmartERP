import api from './api';

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxCode?: string;
  logo?: string;
}

export interface CodeFormats {
  productPrefix: string;
  customerPrefix: string;
  supplierPrefix: string;
  salesOrderPrefix: string;
  purchaseOrderPrefix: string;
  receiptPrefix: string;
  issuePrefix: string;
}

export interface GeneralConfig {
  defaultTaxRate: number;
  currency: string;
  timezone: string;
  language: string;
  dateFormat: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

export interface BackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  retention: number;
}

export interface AllConfigs {
  company: CompanyInfo;
  codeFormats: CodeFormats;
  general: GeneralConfig;
  email: EmailConfig;
  backup: BackupConfig;
}

export interface ConfigHistoryEntry {
  key: string;
  value: unknown;
  timestamp: string;
  changedBy?: string;
}

export interface EmailTestResult {
  success: boolean;
  message: string;
}

const configService = {
  // Get all configurations
  getAllConfigs: async (): Promise<AllConfigs> => {
    const response = await api.get('/config');
    return response.data;
  },

  // Company Information
  getCompanyInfo: async (): Promise<CompanyInfo> => {
    const response = await api.get('/config/company/info');
    return response.data;
  },

  updateCompanyInfo: async (data: CompanyInfo): Promise<CompanyInfo> => {
    const response = await api.put('/config/company/info', data);
    return response.data;
  },

  // Code Formats
  getCodeFormats: async (): Promise<CodeFormats> => {
    const response = await api.get('/config/code-formats');
    return response.data;
  },

  updateCodeFormats: async (data: CodeFormats): Promise<CodeFormats> => {
    const response = await api.put('/config/code-formats', data);
    return response.data;
  },

  // General Configuration
  getGeneralConfig: async (): Promise<GeneralConfig> => {
    const response = await api.get('/config/general');
    return response.data;
  },

  updateGeneralConfig: async (data: GeneralConfig): Promise<GeneralConfig> => {
    const response = await api.put('/config/general', data);
    return response.data;
  },

  // Email Configuration
  getEmailConfig: async (): Promise<EmailConfig> => {
    const response = await api.get('/config/email');
    return response.data;
  },

  updateEmailConfig: async (data: EmailConfig): Promise<EmailConfig> => {
    const response = await api.put('/config/email', data);
    return response.data;
  },

  testEmailConnection: async (config: EmailConfig): Promise<EmailTestResult> => {
    const response = await api.post('/config/email/test-connection', config);
    return response.data;
  },

  sendTestEmail: async (config: EmailConfig, to: string): Promise<EmailTestResult> => {
    const response = await api.post('/config/email/send-test', { ...config, to });
    return response.data;
  },

  // Backup Configuration
  getBackupConfig: async (): Promise<BackupConfig> => {
    const response = await api.get('/config/backup');
    return response.data;
  },

  updateBackupConfig: async (data: BackupConfig): Promise<BackupConfig> => {
    const response = await api.put('/config/backup', data);
    return response.data;
  },

  // Configuration History
  getConfigHistory: async (key?: string): Promise<ConfigHistoryEntry[]> => {
    const response = await api.get('/config/history', { params: { key } });
    return response.data;
  },

  // Initialize defaults
  initializeDefaults: async (): Promise<void> => {
    await api.post('/config/initialize');
  },
};

export default configService;
