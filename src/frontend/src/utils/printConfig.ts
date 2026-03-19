import { logger } from '@/lib/logger/logger.service';

export interface PrintConfig {
  company: {
    name: string;
    address: string;
    phone: string;
    taxCode: string;
    logo?: string;
  };
  templates: {
    stockReceipt: TemplateConfig;
    stockIssue: TemplateConfig;
    salesOrder: TemplateConfig;
    invoice: InvoiceConfig;
  };
  styles: {
    fontSize: string;
    fontFamily: string;
    lineHeight: string;
    padding: string;
    headerFontSize: string;
    companyFontSize: string;
  };
}

export interface TemplateConfig {
  title: string;
  showLogo: boolean;
  showCompanyInfo: boolean;
  showNotes: boolean;
  showSignatures: boolean;
  signatures: string[];
  showCustomerInfo?: boolean;
}

export interface InvoiceConfig extends TemplateConfig {
  showTax: boolean;
  taxRate: number;
  showAmountInWords: boolean;
}

let cachedConfig: PrintConfig | null = null;

export async function loadPrintConfig(): Promise<PrintConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Try user override first, but do not let corrupted browser state block other fallbacks
  const localConfig = localStorage.getItem('printConfig');
  if (localConfig) {
    try {
      const parsedConfig = JSON.parse(localConfig) as PrintConfig;
      cachedConfig = parsedConfig;
      return parsedConfig;
    } catch (error) {
      localStorage.removeItem('printConfig');
      logger.error('PrintConfig', 'Invalid local print config, falling back to bundled config', error as Error);
    }
  }

  try {
    // Fallback to JSON file
    const response = await fetch('/print-config.json');
    if (!response.ok) {
      throw new Error('Failed to load print config');
    }
    const fetchedConfig = (await response.json()) as PrintConfig;
    cachedConfig = fetchedConfig;
    return fetchedConfig;
  } catch (error) {
    logger.error('PrintConfig', 'Error loading print config, using defaults', error as Error);
    return getDefaultConfig();
  }
}

export function getDefaultConfig(): PrintConfig {
  return {
    company: {
      name: 'CÔNG TY TNHH TƯỜNG THẠCH CAO',
      address: '123 Đường ABC, Quận XYZ, TP.HCM',
      phone: '(028) 1234 5678',
      taxCode: '0123456789',
      logo: '',
    },
    templates: {
      stockReceipt: {
        title: 'PHIẾU NHẬP KHO',
        showLogo: true,
        showCompanyInfo: true,
        showNotes: true,
        showSignatures: true,
        signatures: ['Người lập phiếu', 'Thủ kho', 'Giám đốc'],
      },
      stockIssue: {
        title: 'PHIẾU XUẤT KHO',
        showLogo: true,
        showCompanyInfo: true,
        showNotes: true,
        showSignatures: true,
        signatures: ['Người lập phiếu', 'Thủ kho', 'Giám đốc'],
      },
      salesOrder: {
        title: 'ĐƠN HÀNG BÁN',
        showLogo: true,
        showCompanyInfo: true,
        showCustomerInfo: true,
        showNotes: true,
        showSignatures: true,
        signatures: ['Người lập đơn', 'Khách hàng', 'Giám đốc'],
      },
      invoice: {
        title: 'HÓA ĐƠN BÁN HÀNG',
        showLogo: true,
        showCompanyInfo: true,
        showCustomerInfo: true,
        showTax: true,
        taxRate: 0,
        showAmountInWords: true,
        showNotes: true,
        showSignatures: true,
        signatures: ['Người mua hàng', 'Người bán hàng', 'Thủ trưởng đơn vị'],
      },
    },
    styles: {
      fontSize: '12pt',
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
      padding: '20mm',
      headerFontSize: '18pt',
      companyFontSize: '16pt',
    },
  };
}

export function clearConfigCache() {
  cachedConfig = null;
}
