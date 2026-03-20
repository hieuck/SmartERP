import api from './api';
import {
  SettingCategory,
  SettingDataType,
  type CreateSettingDto,
  type Setting,
} from './settingsService';

interface ApiEnvelope<T> {
  data?: T;
  message?: string;
  success?: boolean;
}

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

const COMPANY_DEFAULTS: CompanyInfo = {
  name: '',
  address: '',
  phone: '',
  email: '',
  taxCode: '',
  logo: '',
};

const CODE_DEFAULTS: CodeFormats = {
  productPrefix: 'SP',
  customerPrefix: 'KH',
  supplierPrefix: 'NCC',
  salesOrderPrefix: 'SO',
  purchaseOrderPrefix: 'PO',
  receiptPrefix: 'PN',
  issuePrefix: 'PX',
};

const GENERAL_DEFAULTS: GeneralConfig = {
  defaultTaxRate: 10,
  currency: 'VND',
  timezone: 'Asia/Ho_Chi_Minh',
  language: 'vi',
  dateFormat: 'DD/MM/YYYY',
};

const EMAIL_DEFAULTS: EmailConfig = {
  host: '',
  port: 587,
  secure: false,
  user: '',
  password: '',
  from: '',
};

const BACKUP_DEFAULTS: BackupConfig = {
  enabled: false,
  frequency: 'daily',
  time: '00:00',
  retention: 30,
};

const unwrapApiData = <T>(payload: T | ApiEnvelope<T>): T => {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    ('success' in payload || 'message' in payload)
  ) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
};

const fetchSettings = async (category?: SettingCategory): Promise<Setting[]> => {
  const response = await api.get('/settings', {
    params: category ? { category } : undefined,
  });

  return unwrapApiData<Setting[]>(response.data);
};

const toSettingMap = (settings: Setting[]): Map<string, Setting> =>
  new Map(settings.map((setting) => [setting.key, setting]));

const readString = (map: Map<string, Setting>, key: string, fallback = ''): string =>
  map.get(key)?.value ?? fallback;

const readNumber = (map: Map<string, Setting>, key: string, fallback: number): number => {
  const value = Number(map.get(key)?.value);
  return Number.isFinite(value) ? value : fallback;
};

const readBoolean = (map: Map<string, Setting>, key: string, fallback: boolean): boolean => {
  const value = map.get(key)?.value;
  if (value === undefined) {
    return fallback;
  }

  return value === 'true';
};

const buildSettingsPayload = (
  category: SettingCategory,
  entries: Array<{
    key: string;
    value: string;
    dataType?: SettingDataType;
    description?: string;
    isPublic?: boolean;
  }>,
): CreateSettingDto[] =>
  entries.map((entry) => ({
    key: entry.key,
    value: entry.value,
    category,
    dataType: entry.dataType ?? SettingDataType.STRING,
    description: entry.description,
    isPublic: entry.isPublic,
  }));

const mapAllConfigs = (settings: Setting[]): AllConfigs => {
  const map = toSettingMap(settings);

  return {
    company: {
      name: readString(map, 'company.name', COMPANY_DEFAULTS.name),
      address: readString(map, 'company.address', COMPANY_DEFAULTS.address),
      phone: readString(map, 'company.phone', COMPANY_DEFAULTS.phone),
      email: readString(map, 'company.email', COMPANY_DEFAULTS.email),
      taxCode: readString(map, 'company.taxCode', COMPANY_DEFAULTS.taxCode),
      logo: readString(map, 'company.logo', COMPANY_DEFAULTS.logo),
    },
    codeFormats: {
      productPrefix: readString(map, 'codes.productPrefix', CODE_DEFAULTS.productPrefix),
      customerPrefix: readString(map, 'codes.customerPrefix', CODE_DEFAULTS.customerPrefix),
      supplierPrefix: readString(map, 'codes.supplierPrefix', CODE_DEFAULTS.supplierPrefix),
      salesOrderPrefix: readString(map, 'codes.salesOrderPrefix', CODE_DEFAULTS.salesOrderPrefix),
      purchaseOrderPrefix: readString(
        map,
        'codes.purchaseOrderPrefix',
        CODE_DEFAULTS.purchaseOrderPrefix,
      ),
      receiptPrefix: readString(map, 'codes.receiptPrefix', CODE_DEFAULTS.receiptPrefix),
      issuePrefix: readString(map, 'codes.issuePrefix', CODE_DEFAULTS.issuePrefix),
    },
    general: {
      defaultTaxRate: readNumber(
        map,
        'general.defaultTaxRate',
        GENERAL_DEFAULTS.defaultTaxRate,
      ),
      currency: readString(map, 'general.currency', GENERAL_DEFAULTS.currency),
      timezone: readString(map, 'general.timezone', GENERAL_DEFAULTS.timezone),
      language: readString(map, 'general.language', GENERAL_DEFAULTS.language),
      dateFormat: readString(map, 'general.dateFormat', GENERAL_DEFAULTS.dateFormat),
    },
    email: {
      host: readString(map, 'email.host', EMAIL_DEFAULTS.host),
      port: readNumber(map, 'email.port', EMAIL_DEFAULTS.port),
      secure: readBoolean(map, 'email.secure', EMAIL_DEFAULTS.secure),
      user: readString(map, 'email.user', EMAIL_DEFAULTS.user),
      password: readString(map, 'email.password', EMAIL_DEFAULTS.password),
      from: readString(map, 'email.from', EMAIL_DEFAULTS.from),
    },
    backup: {
      enabled: readBoolean(map, 'backup.enabled', BACKUP_DEFAULTS.enabled),
      frequency: (readString(
        map,
        'backup.frequency',
        BACKUP_DEFAULTS.frequency,
      ) as BackupConfig['frequency']) || BACKUP_DEFAULTS.frequency,
      time: readString(map, 'backup.time', BACKUP_DEFAULTS.time),
      retention: readNumber(map, 'backup.retention', BACKUP_DEFAULTS.retention),
    },
  };
};

const toErrorMessage = (error: unknown, fallback: string): string => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
  ) {
    return error.response.data.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const configService = {
  getAllConfigs: async (): Promise<AllConfigs> => {
    const settings = await fetchSettings();
    return mapAllConfigs(settings);
  },

  getCompanyInfo: async (): Promise<CompanyInfo> => (await configService.getAllConfigs()).company,

  updateCompanyInfo: async (data: CompanyInfo): Promise<CompanyInfo> => {
    await api.post('/settings/bulk', {
      settings: buildSettingsPayload(SettingCategory.GENERAL, [
        { key: 'company.name', value: data.name },
        { key: 'company.address', value: data.address },
        { key: 'company.phone', value: data.phone },
        { key: 'company.email', value: data.email },
        { key: 'company.taxCode', value: data.taxCode ?? '' },
        { key: 'company.logo', value: data.logo ?? '', dataType: SettingDataType.JSON },
      ]),
    });

    return data;
  },

  getCodeFormats: async (): Promise<CodeFormats> => (await configService.getAllConfigs()).codeFormats,

  updateCodeFormats: async (data: CodeFormats): Promise<CodeFormats> => {
    await api.post('/settings/bulk', {
      settings: buildSettingsPayload(SettingCategory.GENERAL, [
        { key: 'codes.productPrefix', value: data.productPrefix },
        { key: 'codes.customerPrefix', value: data.customerPrefix },
        { key: 'codes.supplierPrefix', value: data.supplierPrefix },
        { key: 'codes.salesOrderPrefix', value: data.salesOrderPrefix },
        { key: 'codes.purchaseOrderPrefix', value: data.purchaseOrderPrefix },
        { key: 'codes.receiptPrefix', value: data.receiptPrefix },
        { key: 'codes.issuePrefix', value: data.issuePrefix },
      ]),
    });

    return data;
  },

  getGeneralConfig: async (): Promise<GeneralConfig> => (await configService.getAllConfigs()).general,

  updateGeneralConfig: async (data: GeneralConfig): Promise<GeneralConfig> => {
    await api.post('/settings/bulk', {
      settings: buildSettingsPayload(SettingCategory.GENERAL, [
        {
          key: 'general.defaultTaxRate',
          value: String(data.defaultTaxRate),
          dataType: SettingDataType.NUMBER,
        },
        { key: 'general.currency', value: data.currency },
        { key: 'general.timezone', value: data.timezone },
        { key: 'general.language', value: data.language },
        { key: 'general.dateFormat', value: data.dateFormat },
      ]),
    });

    return data;
  },

  getEmailConfig: async (): Promise<EmailConfig> => (await configService.getAllConfigs()).email,

  updateEmailConfig: async (data: EmailConfig): Promise<EmailConfig> => {
    await api.post('/settings/bulk', {
      settings: buildSettingsPayload(SettingCategory.EMAIL, [
        { key: 'email.host', value: data.host },
        { key: 'email.port', value: String(data.port), dataType: SettingDataType.NUMBER },
        { key: 'email.secure', value: String(data.secure), dataType: SettingDataType.BOOLEAN },
        { key: 'email.user', value: data.user },
        { key: 'email.password', value: data.password },
        { key: 'email.from', value: data.from },
      ]),
    });

    return data;
  },

  testEmailConnection: async (): Promise<EmailTestResult> => {
    try {
      await api.get('/email/logs');

      return {
        success: true,
        message: 'Email module is reachable. SMTP validation is not implemented on this backend.',
      };
    } catch (error) {
      return {
        success: false,
        message: toErrorMessage(error, 'Email module is not reachable.'),
      };
    }
  },

  sendTestEmail: async (_config: EmailConfig, to: string): Promise<EmailTestResult> => {
    try {
      await api.post('/email/send', {
        to,
        subject: 'SmartERP test email',
        body: 'This is a test email from SmartERP settings.',
      });

      return {
        success: true,
        message: 'Test email sent successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: toErrorMessage(error, 'Failed to send test email.'),
      };
    }
  },

  getBackupConfig: async (): Promise<BackupConfig> => (await configService.getAllConfigs()).backup,

  updateBackupConfig: async (data: BackupConfig): Promise<BackupConfig> => {
    await api.post('/settings/bulk', {
      settings: buildSettingsPayload(SettingCategory.INTEGRATION, [
        {
          key: 'backup.enabled',
          value: String(data.enabled),
          dataType: SettingDataType.BOOLEAN,
        },
        { key: 'backup.frequency', value: data.frequency },
        { key: 'backup.time', value: data.time },
        {
          key: 'backup.retention',
          value: String(data.retention),
          dataType: SettingDataType.NUMBER,
        },
      ]),
    });

    return data;
  },

  getConfigHistory: async (key?: string): Promise<ConfigHistoryEntry[]> => {
    const settings = await fetchSettings();
    return settings
      .filter((setting) => !key || setting.key === key)
      .map((setting) => ({
        key: setting.key,
        value: setting.value,
        timestamp: setting.updatedAt,
      }));
  },

  initializeDefaults: async (): Promise<void> => {
    const defaults = mapAllConfigs([]);

    await api.post('/settings/bulk', {
      settings: [
        ...buildSettingsPayload(SettingCategory.GENERAL, [
          { key: 'company.name', value: defaults.company.name },
          { key: 'company.address', value: defaults.company.address },
          { key: 'company.phone', value: defaults.company.phone },
          { key: 'company.email', value: defaults.company.email },
          { key: 'company.taxCode', value: defaults.company.taxCode ?? '' },
          { key: 'company.logo', value: defaults.company.logo ?? '', dataType: SettingDataType.JSON },
          { key: 'codes.productPrefix', value: defaults.codeFormats.productPrefix },
          { key: 'codes.customerPrefix', value: defaults.codeFormats.customerPrefix },
          { key: 'codes.supplierPrefix', value: defaults.codeFormats.supplierPrefix },
          { key: 'codes.salesOrderPrefix', value: defaults.codeFormats.salesOrderPrefix },
          { key: 'codes.purchaseOrderPrefix', value: defaults.codeFormats.purchaseOrderPrefix },
          { key: 'codes.receiptPrefix', value: defaults.codeFormats.receiptPrefix },
          { key: 'codes.issuePrefix', value: defaults.codeFormats.issuePrefix },
          {
            key: 'general.defaultTaxRate',
            value: String(defaults.general.defaultTaxRate),
            dataType: SettingDataType.NUMBER,
          },
          { key: 'general.currency', value: defaults.general.currency },
          { key: 'general.timezone', value: defaults.general.timezone },
          { key: 'general.language', value: defaults.general.language },
          { key: 'general.dateFormat', value: defaults.general.dateFormat },
        ]),
        ...buildSettingsPayload(SettingCategory.EMAIL, [
          { key: 'email.host', value: defaults.email.host },
          { key: 'email.port', value: String(defaults.email.port), dataType: SettingDataType.NUMBER },
          {
            key: 'email.secure',
            value: String(defaults.email.secure),
            dataType: SettingDataType.BOOLEAN,
          },
          { key: 'email.user', value: defaults.email.user },
          { key: 'email.password', value: defaults.email.password },
          { key: 'email.from', value: defaults.email.from },
        ]),
        ...buildSettingsPayload(SettingCategory.INTEGRATION, [
          {
            key: 'backup.enabled',
            value: String(defaults.backup.enabled),
            dataType: SettingDataType.BOOLEAN,
          },
          { key: 'backup.frequency', value: defaults.backup.frequency },
          { key: 'backup.time', value: defaults.backup.time },
          {
            key: 'backup.retention',
            value: String(defaults.backup.retention),
            dataType: SettingDataType.NUMBER,
          },
        ]),
      ],
    });
  },
};

export default configService;
