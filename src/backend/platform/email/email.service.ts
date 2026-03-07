import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EmailTemplate, TemplateType } from './entities/email-template.entity';
import { EmailLog, EmailStatus } from './entities/email-log.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectRepository(EmailTemplate)
    private templateRepository: Repository<EmailTemplate>,
    @InjectRepository(EmailLog)
    private logRepository: Repository<EmailLog>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  // Template Management
  async findAllTemplates(tenantId: string): Promise<EmailTemplate[]> {
    const cacheKey = `email-template:all:${tenantId}`;

    // Try cache first
    const cached = await this.cacheManager.get<EmailTemplate[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const templates = await this.templateRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    // Store in cache (5 minutes - templates rarely change)
    await this.cacheManager.set(cacheKey, templates, 300000);

    return templates;
  }

  async findTemplateById(tenantId: string, id: string): Promise<EmailTemplate> {
    const cacheKey = `email-template:${tenantId}:${id}`;

    // Try cache first
    const cached = await this.cacheManager.get<EmailTemplate>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const template = await this.templateRepository.findOne({
      where: { tenantId, id },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    // Store in cache (5 minutes)
    await this.cacheManager.set(cacheKey, template, 300000);

    return template;
  }

  async findTemplateByType(tenantId: string, type: TemplateType): Promise<EmailTemplate> {
    const cacheKey = `email-template:${tenantId}:type:${type}`;

    // Try cache first
    const cached = await this.cacheManager.get<EmailTemplate>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const template = await this.templateRepository.findOne({
      where: { tenantId, type, isActive: true },
    });

    if (!template) {
      throw new NotFoundException(`Template with type ${type} not found`);
    }

    // Store in cache (5 minutes)
    await this.cacheManager.set(cacheKey, template, 300000);

    return template;
  }

  async createTemplate(tenantId: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const template = this.templateRepository.create({
      ...data,
      tenantId,
    });
    return this.templateRepository.save(template);
  }

  async updateTemplate(
    tenantId: string,
    id: string,
    data: Partial<EmailTemplate>,
  ): Promise<EmailTemplate> {
    await this.findTemplateById(tenantId, id);
    await this.templateRepository.update({ tenantId, id }, data);

    // Invalidate caches
    await this.cacheManager.del(`email-template:${tenantId}:${id}`);
    await this.cacheManager.del(`email-template:all:${tenantId}`);

    return this.findTemplateById(tenantId, id);
  }

  async deleteTemplate(tenantId: string, id: string): Promise<void> {
    const template = await this.findTemplateById(tenantId, id);
    await this.templateRepository.softDelete({ tenantId, id });

    // Invalidate caches
    await this.cacheManager.del(`email-template:${tenantId}:${id}`);
    await this.cacheManager.del(`email-template:all:${tenantId}`);
    if (template.type) {
      await this.cacheManager.del(`email-template:${tenantId}:type:${template.type}`);
    }
  }

  // Email Sending
  async sendEmail(
    tenantId: string,
    to: string,
    subject: string,
    body: string,
    cc?: string,
    bcc?: string,
  ): Promise<EmailLog> {
    const log = this.logRepository.create({
      tenantId,
      to,
      cc,
      bcc,
      subject,
      body,
      status: EmailStatus.PENDING,
    });

    const savedLog = await this.logRepository.save(log);

    // Simulate email sending (replace with actual SMTP integration)
    try {
      // TODO: Integrate with SMTP service (nodemailer, SendGrid, etc.)
      this.logger.log(`Sending email to ${to}: ${subject}`);

      await this.logRepository.update(
        { id: savedLog.id, tenantId },
        {
          status: EmailStatus.SENT,
          sentAt: new Date(),
        },
      );
    } catch (error) {
      await this.logRepository.update(
        { id: savedLog.id, tenantId },
        {
          status: EmailStatus.FAILED,
          error: error.message,
        },
      );
    }

    return this.logRepository.findOne({ where: { id: savedLog.id, tenantId } });
  }

  async sendTemplateEmail(
    tenantId: string,
    to: string,
    templateId: string,
    variables: Record<string, string>,
  ): Promise<EmailLog> {
    const template = await this.findTemplateById(tenantId, templateId);

    let subject = template.subject;
    let body = template.body;

    // Replace variables in subject and body
    Object.keys(variables).forEach((key) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), variables[key]);
      body = body.replace(new RegExp(placeholder, 'g'), variables[key]);
    });

    const log = await this.sendEmail(tenantId, to, subject, body);
    await this.logRepository.update({ id: log.id, tenantId }, { templateId });

    return this.logRepository.findOne({ where: { id: log.id, tenantId } });
  }

  // Email Logs
  async findAllLogs(tenantId: string): Promise<EmailLog[]> {
    return this.logRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findLogById(tenantId: string, id: string): Promise<EmailLog> {
    const log = await this.logRepository.findOne({
      where: { tenantId, id },
    });
    if (!log) {
      throw new NotFoundException(`Email log with ID ${id} not found`);
    }
    return log;
  }
}
