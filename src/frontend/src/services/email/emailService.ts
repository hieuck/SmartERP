import api from '../api/apiService';

// Enums
export enum TemplateType {
  WELCOME = 'welcome',
  ORDER_CONFIRMATION = 'order_confirmation',
  INVOICE = 'invoice',
  PASSWORD_RESET = 'password_reset',
  NOTIFICATION = 'notification',
  CUSTOM = 'custom',
}

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  BOUNCED = 'bounced',
}

// Interfaces
export interface EmailTemplate {
  id: string;
  tenantId: string;
  name: string;
  type: TemplateType;
  subject: string;
  body: string;
  variables?: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface EmailLog {
  id: string;
  tenantId: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  status: EmailStatus;
  error?: string;
  templateId?: string;
  sentAt?: Date;
  createdAt: Date;
}

export interface SendEmailDto {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export interface SendTemplateEmailDto {
  to: string;
  templateId: string;
  variables: Record<string, string>;
}

export interface CreateEmailTemplateDto {
  name: string;
  type: TemplateType;
  subject: string;
  body: string;
  variables?: Record<string, string>;
  isActive?: boolean;
}

export interface UpdateEmailTemplateDto {
  name?: string;
  type?: TemplateType;
  subject?: string;
  body?: string;
  variables?: Record<string, string>;
  isActive?: boolean;
}

// Email Service
const emailService = {
  // Template Management
  async getAllTemplates(): Promise<EmailTemplate[]> {
    const response = await api.get('/email/templates');
    return response.data;
  },

  async getTemplateById(id: string): Promise<EmailTemplate> {
    const response = await api.get(`/email/templates/${id}`);
    return response.data;
  },

  async createTemplate(data: CreateEmailTemplateDto): Promise<EmailTemplate> {
    const response = await api.post('/email/templates', data);
    return response.data;
  },

  async updateTemplate(id: string, data: UpdateEmailTemplateDto): Promise<EmailTemplate> {
    const response = await api.put(`/email/templates/${id}`, data);
    return response.data;
  },

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/email/templates/${id}`);
  },

  // Email Sending
  async sendEmail(data: SendEmailDto): Promise<EmailLog> {
    const response = await api.post('/email/send', data);
    return response.data;
  },

  async sendTemplateEmail(data: SendTemplateEmailDto): Promise<EmailLog> {
    const response = await api.post('/email/send-template', data);
    return response.data;
  },

  // Email Logs
  async getAllLogs(): Promise<EmailLog[]> {
    const response = await api.get('/email/logs');
    return response.data;
  },

  async getLogById(id: string): Promise<EmailLog> {
    const response = await api.get(`/email/logs/${id}`);
    return response.data;
  },
};

export default emailService;
