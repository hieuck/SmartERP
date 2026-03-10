import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { EmailLog, EmailStatus } from './entities/email-log.entity';
import { EmailTemplate, TemplateType } from './entities/email-template.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly secureTemplateRepo: SecureRepository<EmailTemplate>;
  private readonly secureLogRepo: SecureRepository<EmailLog>;

  constructor(
    @InjectRepository(EmailTemplate)
    private templateRepository: Repository<EmailTemplate>,
    @InjectRepository(EmailLog)
    private logRepository: Repository<EmailLog>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly permissionService: PermissionService,
  ) {
    this.secureTemplateRepo = new SecureRepository(
      templateRepository,
      permissionService,
      'EmailTemplate',
    );
    this.secureLogRepo = new SecureRepository(logRepository, permissionService, 'EmailLog');
  }

  // Template Management
  async findAllTemplates(user: User): Promise<EmailTemplate[]> {
    const cacheKey = `email-template:all:${user.tenantId}`;

    // Try cache first
    const cached = await this.cacheManager.get<EmailTemplate[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database with SecureRepository
    const templates = await this.secureTemplateRepo.find(user, {
      order: { createdAt: 'DESC' },
    });

    // Store in cache (5 minutes - templates rarely change)
    await this.cacheManager.set(cacheKey, templates, 300000);

    return templates;
  }

  async findTemplateById(user: User, id: string): Promise<EmailTemplate> {
    const cacheKey = `email-template:${user.tenantId}:${id}`;

    // Try cache first
    const cached = await this.cacheManager.get<EmailTemplate>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database with SecureRepository
    const template = await this.secureTemplateRepo.findOne(user, {
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    // Store in cache (5 minutes)
    await this.cacheManager.set(cacheKey, template, 300000);

    return template;
  }

  async findTemplateByType(user: User, type: TemplateType): Promise<EmailTemplate> {
    const cacheKey = `email-template:${user.tenantId}:type:${type}`;

    // Try cache first
    const cached = await this.cacheManager.get<EmailTemplate>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database with SecureRepository
    const template = await this.secureTemplateRepo.findOne(user, {
      where: { type, isActive: true },
    });

    if (!template) {
      throw new NotFoundException(`Template with type ${type} not found`);
    }

    // Store in cache (5 minutes)
    await this.cacheManager.set(cacheKey, template, 300000);

    return template;
  }

  async createTemplate(user: User, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const template = this.templateRepository.create({
      ...data,
      tenantId: user.tenantId,
    });
    return this.secureTemplateRepo.save(user, template);
  }

  async updateTemplate(
    user: User,
    id: string,
    data: Partial<EmailTemplate>,
  ): Promise<EmailTemplate> {
    const template = await this.findTemplateById(user, id);

    Object.assign(template, data);

    await this.secureTemplateRepo.save(user, template);

    // Invalidate caches
    await this.cacheManager.del(`email-template:${user.tenantId}:${id}`);
    await this.cacheManager.del(`email-template:all:${user.tenantId}`);

    return this.findTemplateById(user, id);
  }

  async deleteTemplate(user: User, id: string): Promise<void> {
    const template = await this.findTemplateById(user, id);

    // Soft delete using raw repository (SecureRepository doesn't support softDelete yet)
    // Permission already checked in findTemplateById
    await this.templateRepository.softDelete({ tenantId: user.tenantId, id });

    // Invalidate caches
    await this.cacheManager.del(`email-template:${user.tenantId}:${id}`);
    await this.cacheManager.del(`email-template:all:${user.tenantId}`);
    if (template.type) {
      await this.cacheManager.del(`email-template:${user.tenantId}:type:${template.type}`);
    }
  }

  // Email Sending
  async sendEmail(
    user: User,
    to: string,
    subject: string,
    body: string,
    cc?: string,
    bcc?: string,
  ): Promise<EmailLog> {
    const log = this.logRepository.create({
      tenantId: user.tenantId,
      to,
      cc,
      bcc,
      subject,
      body,
      status: EmailStatus.PENDING,
    });

    const savedLog = await this.secureLogRepo.save(user, log);

    // Simulate email sending (replace with actual SMTP integration)
    try {
      // TODO: Integrate with SMTP service (nodemailer, SendGrid, etc.)
      this.logger.log(`Sending email to ${to}: ${subject}`);

      savedLog.status = EmailStatus.SENT;
      savedLog.sentAt = new Date();

      await this.secureLogRepo.save(user, savedLog);
    } catch (error) {
      savedLog.status = EmailStatus.FAILED;
      savedLog.error = error.message;

      await this.secureLogRepo.save(user, savedLog);
    }

    return this.secureLogRepo.findOne(user, { where: { id: savedLog.id } });
  }

  async sendTemplateEmail(
    user: User,
    to: string,
    templateId: string,
    variables: Record<string, string>,
  ): Promise<EmailLog> {
    const template = await this.findTemplateById(user, templateId);

    let subject = template.subject;
    let body = template.body;

    // Replace variables in subject and body
    Object.keys(variables).forEach((key) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), variables[key]);
      body = body.replace(new RegExp(placeholder, 'g'), variables[key]);
    });

    const log = await this.sendEmail(user, to, subject, body);
    log.templateId = templateId;

    await this.secureLogRepo.save(user, log);

    return this.secureLogRepo.findOne(user, { where: { id: log.id } });
  }

  // Email Logs
  async findAllLogs(user: User): Promise<EmailLog[]> {
    return this.secureLogRepo.find(user, {
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findLogById(user: User, id: string): Promise<EmailLog> {
    const log = await this.secureLogRepo.findOne(user, {
      where: { id },
    });
    if (!log) {
      throw new NotFoundException(`Email log with ID ${id} not found`);
    }
    return log;
  }
}
