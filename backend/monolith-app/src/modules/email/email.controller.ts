import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { EmailTemplate } from './entities/email-template.entity';
import { EmailLog } from './entities/email-log.entity';

@Controller('email')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // Template Endpoints
  @Get('templates')
  async findAllTemplates(@TenantId() tenantId: string): Promise<EmailTemplate[]> {
    return this.emailService.findAllTemplates(tenantId);
  }

  @Get('templates/:id')
  async findTemplateById(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<EmailTemplate> {
    return this.emailService.findTemplateById(tenantId, id);
  }

  @Post('templates')
  async createTemplate(
    @TenantId() tenantId: string,
    @Body() data: Partial<EmailTemplate>,
  ): Promise<EmailTemplate> {
    return this.emailService.createTemplate(tenantId, data);
  }

  @Put('templates/:id')
  async updateTemplate(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() data: Partial<EmailTemplate>,
  ): Promise<EmailTemplate> {
    return this.emailService.updateTemplate(tenantId, id, data);
  }

  @Delete('templates/:id')
  async deleteTemplate(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.emailService.deleteTemplate(tenantId, id);
  }

  // Email Sending Endpoints
  @Post('send')
  async sendEmail(
    @TenantId() tenantId: string,
    @Body('to') to: string,
    @Body('subject') subject: string,
    @Body('body') body: string,
    @Body('cc') cc?: string,
    @Body('bcc') bcc?: string,
  ): Promise<EmailLog> {
    return this.emailService.sendEmail(tenantId, to, subject, body, cc, bcc);
  }

  @Post('send-template')
  async sendTemplateEmail(
    @TenantId() tenantId: string,
    @Body('to') to: string,
    @Body('templateId') templateId: string,
    @Body('variables') variables: Record<string, string>,
  ): Promise<EmailLog> {
    return this.emailService.sendTemplateEmail(tenantId, to, templateId, variables);
  }

  // Email Logs Endpoints
  @Get('logs')
  async findAllLogs(@TenantId() tenantId: string): Promise<EmailLog[]> {
    return this.emailService.findAllLogs(tenantId);
  }

  @Get('logs/:id')
  async findLogById(@TenantId() tenantId: string, @Param('id') id: string): Promise<EmailLog> {
    return this.emailService.findLogById(tenantId, id);
  }
}
