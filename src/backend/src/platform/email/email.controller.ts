import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { EmailTemplate } from './entities/email-template.entity';
import { EmailLog } from './entities/email-log.entity';
import { User } from '@/common/security/permission.service';
@Controller('email')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // Template Endpoints
  @Get('templates')
  async findAllTemplates(@CurrentUser() user: User): Promise<EmailTemplate[]> {
    return this.emailService.findAllTemplates(user);
  }

  @Get('templates/:id')
  async findTemplateById(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<EmailTemplate> {
    return this.emailService.findTemplateById(user, id);
  }

  @Post('templates')
  async createTemplate(
    @CurrentUser() user: User,
    @Body() data: Partial<EmailTemplate>,
  ): Promise<EmailTemplate> {
    return this.emailService.createTemplate(user, data);
  }

  @Put('templates/:id')
  async updateTemplate(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() data: Partial<EmailTemplate>,
  ): Promise<EmailTemplate> {
    return this.emailService.updateTemplate(user, id, data);
  }

  @Delete('templates/:id')
  async deleteTemplate(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    return this.emailService.deleteTemplate(user, id);
  }

  // Email Sending Endpoints
  @Post('send')
  async sendEmail(
    @CurrentUser() user: User,
    @Body('to') to: string,
    @Body('subject') subject: string,
    @Body('body') body: string,
    @Body('cc') cc?: string,
    @Body('bcc') bcc?: string,
  ): Promise<EmailLog> {
    return this.emailService.sendEmail(user, to, subject, body, cc, bcc);
  }

  @Post('send-template')
  async sendTemplateEmail(
    @CurrentUser() user: User,
    @Body('to') to: string,
    @Body('templateId') templateId: string,
    @Body('variables') variables: Record<string, string>,
  ): Promise<EmailLog> {
    return this.emailService.sendTemplateEmail(user, to, templateId, variables);
  }

  // Email Logs Endpoints
  @Get('logs')
  async findAllLogs(@CurrentUser() user: User): Promise<EmailLog[]> {
    return this.emailService.findAllLogs(user);
  }

  @Get('logs/:id')
  async findLogById(@CurrentUser() user: User, @Param('id') id: string): Promise<EmailLog> {
    return this.emailService.findLogById(user, id);
  }
}
