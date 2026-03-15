/**
 * EmailController Integration Tests
 * Coverage target: 95%+
 *
 * Test cases:
 * 1. GET /email/templates - Get all templates
 * 2. GET /email/templates/:id - Get template by ID
 * 3. POST /email/templates - Create template
 * 4. PUT /email/templates/:id - Update template
 * 5. DELETE /email/templates/:id - Delete template
 * 6. POST /email/send - Send email
 * 7. POST /email/send-template - Send template email
 * 8. GET /email/logs - Get all email logs
 * 9. GET /email/logs/:id - Get email log by ID
 * 10. Authentication/Authorization tests
 * 11. Validation tests
 * 12. Edge cases and error scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { TemplateType } from './enums/template-type.enum';
import { EmailStatus } from './enums/email-status.enum';

describe('EmailController (Integration)', () => {
  let response: any;
  let app: INestApplication;
  let emailService: jest.Mocked<EmailService>;

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const mockTemplate = {
    id: 'template-123',
    name: 'Welcome Email',
    type: TemplateType.WELCOME,
    subject: 'Welcome to {{companyName}}',
    body: 'Hello {{userName}}, welcome to our platform!',
    isActive: true,
    tenantId: 'tenant-123',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  };

  const mockEmailLog = {
    id: 'log-123',
    to: 'customer@example.com',
    cc: null,
    bcc: null,
    subject: 'Welcome to SmartERP',
    body: 'Hello John, welcome to our platform!',
    status: EmailStatus.SENT,
    templateId: 'template-123',
    sentAt: new Date('2024-01-15T10:05:00Z'),
    error: null,
    tenantId: 'tenant-123',
    createdAt: new Date('2024-01-15T10:00:00Z'),
  };

  beforeAll(async () => {
    const mockEmailService = {
      findAllTemplates: jest.fn(),
      findTemplateById: jest.fn(),
      createTemplate: jest.fn(),
      updateTemplate: jest.fn(),
      deleteTemplate: jest.fn(),
      sendEmail: jest.fn(),
      sendTemplateEmail: jest.fn(),
      findAllLogs: jest.fn(),
      findLogById: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
          request.user = mockUser;
          return true;
        }

        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    emailService = moduleFixture.get(EmailService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /email/templates', () => {
    it('should return all email templates', async () => {
      const templates = [mockTemplate];
      emailService.findAllTemplates.mockResolvedValue(templates as any);

      const _response = await request(app.getHttpServer())
        .get('/email/templates')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(templates);
      expect(emailService.findAllTemplates).toHaveBeenCalledWith(mockUser);
    });

    it('should return empty array when no templates', async () => {
      emailService.findAllTemplates.mockResolvedValue([]);

      const _response = await request(app.getHttpServer())
        .get('/email/templates')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/email/templates').expect(401);
    });

    it('should handle service errors', async () => {
      emailService.findAllTemplates.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/email/templates')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });

  describe('GET /email/templates/:id', () => {
    it('should return template by ID', async () => {
      emailService.findTemplateById.mockResolvedValue(mockTemplate as any);

      const _response = await request(app.getHttpServer())
        .get('/email/templates/template-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockTemplate);
      expect(emailService.findTemplateById).toHaveBeenCalledWith(mockUser, 'template-123');
    });

    it('should return 404 when template not found', async () => {
      emailService.findTemplateById.mockRejectedValue(
        new HttpException('Template with ID template-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/email/templates/template-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/email/templates/template-123').expect(401);
    });
  });

  describe('POST /email/templates', () => {
    it('should create template successfully', async () => {
      const createDto = {
        name: 'Order Confirmation',
        type: TemplateType.ORDER_CONFIRMATION,
        subject: 'Order {{orderNumber}} Confirmed',
        body: 'Your order has been confirmed.',
        isActive: true,
      };

      emailService.createTemplate.mockResolvedValue({
        ...mockTemplate,
        ...createDto,
      } as any);

      const _response = await request(app.getHttpServer())
        .post('/email/templates')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe('Order Confirmation');
      expect(emailService.createTemplate).toHaveBeenCalledWith(mockUser, createDto);
    });

    it('should create template with variables', async () => {
      const createDto = {
        name: 'Custom Template',
        type: TemplateType.CUSTOM,
        subject: 'Hello {{firstName}} {{lastName}}',
        body: 'Dear {{firstName}}, your account {{accountId}} is ready.',
        isActive: true,
      };

      emailService.createTemplate.mockResolvedValue({
        ...mockTemplate,
        ...createDto,
      } as any);

      const _response = await request(app.getHttpServer())
        .post('/email/templates')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.subject).toContain('{{firstName}}');
      expect(response.body.body).toContain('{{accountId}}');
    });

    it('should return 409 when template name already exists', async () => {
      const createDto = {
        name: 'Welcome Email',
        type: TemplateType.WELCOME,
        subject: 'Welcome',
        body: 'Welcome message',
        isActive: true,
      };

      emailService.createTemplate.mockRejectedValue(
        new HttpException('Template with this name already exists', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .post('/email/templates')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(409);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/email/templates')
        .send({ name: 'Test', type: TemplateType.CUSTOM, subject: 'Test', body: 'Test' })
        .expect(401);
    });
  });

  describe('PUT /email/templates/:id', () => {
    it('should update template successfully', async () => {
      const updateDto = {
        subject: 'Updated Subject',
        body: 'Updated body content',
        isActive: false,
      };

      const updatedTemplate = { ...mockTemplate, ...updateDto };
      emailService.updateTemplate.mockResolvedValue(updatedTemplate as any);

      const _response = await request(app.getHttpServer())
        .put('/email/templates/template-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.subject).toBe('Updated Subject');
      expect(response.body.isActive).toBe(false);
      expect(emailService.updateTemplate).toHaveBeenCalledWith(mockUser, 'template-123', updateDto);
    });

    it('should return 404 when template not found', async () => {
      emailService.updateTemplate.mockRejectedValue(
        new HttpException('Template not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .put('/email/templates/template-999')
        .set('Authorization', 'Bearer valid-token')
        .send({ subject: 'Test' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put('/email/templates/template-123')
        .send({ subject: 'Test' })
        .expect(401);
    });
  });

  describe('DELETE /email/templates/:id', () => {
    it('should delete template successfully', async () => {
      emailService.deleteTemplate.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/email/templates/template-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(emailService.deleteTemplate).toHaveBeenCalledWith(mockUser, 'template-123');
    });

    it('should return 404 when template not found', async () => {
      emailService.deleteTemplate.mockRejectedValue(
        new HttpException('Template not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/email/templates/template-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).delete('/email/templates/template-123').expect(401);
    });
  });

  describe('POST /email/send', () => {
    it('should send email successfully', async () => {
      const sendDto = {
        to: 'customer@example.com',
        subject: 'Test Email',
        body: 'This is a test email',
      };

      emailService.sendEmail.mockResolvedValue(mockEmailLog as any);

      const _response = await request(app.getHttpServer())
        .post('/email/send')
        .set('Authorization', 'Bearer valid-token')
        .send(sendDto)
        .expect(201);

      expect(response.body.status).toBe(EmailStatus.SENT);
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        mockUser,
        'customer@example.com',
        'Test Email',
        'This is a test email',
        undefined,
        undefined,
      );
    });

    it('should send email with CC and BCC', async () => {
      const sendDto = {
        to: 'customer@example.com',
        subject: 'Test Email',
        body: 'This is a test email',
        cc: 'manager@example.com',
        bcc: 'admin@example.com',
      };

      emailService.sendEmail.mockResolvedValue(mockEmailLog as any);

      const _response = await request(app.getHttpServer())
        .post('/email/send')
        .set('Authorization', 'Bearer valid-token')
        .send(sendDto)
        .expect(201);

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        mockUser,
        'customer@example.com',
        'Test Email',
        'This is a test email',
        'manager@example.com',
        'admin@example.com',
      );
    });

    it('should handle email sending failure', async () => {
      const sendDto = {
        to: 'invalid@example.com',
        subject: 'Test',
        body: 'Test',
      };

      const failedLog = {
        ...mockEmailLog,
        status: EmailStatus.FAILED,
        error: 'SMTP connection failed',
      };

      emailService.sendEmail.mockResolvedValue(failedLog as any);

      const _response = await request(app.getHttpServer())
        .post('/email/send')
        .set('Authorization', 'Bearer valid-token')
        .send(sendDto)
        .expect(201);

      expect(response.body.status).toBe(EmailStatus.FAILED);
      expect(response.body.error).toBe('SMTP connection failed');
    });

    it('should validate email format', async () => {
      const sendDto = {
        to: 'invalid-email',
        subject: 'Test',
        body: 'Test',
      };

      emailService.sendEmail.mockRejectedValue(
        new HttpException('Invalid email format', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/email/send')
        .set('Authorization', 'Bearer valid-token')
        .send(sendDto)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/email/send')
        .send({ to: 'test@example.com', subject: 'Test', body: 'Test' })
        .expect(401);
    });
  });

  describe('POST /email/send-template', () => {
    it('should send template email successfully', async () => {
      const sendDto = {
        to: 'customer@example.com',
        templateId: 'template-123',
        variables: {
          companyName: 'SmartERP',
          userName: 'John Doe',
        },
      };

      emailService.sendTemplateEmail.mockResolvedValue(mockEmailLog as any);

      const _response = await request(app.getHttpServer())
        .post('/email/send-template')
        .set('Authorization', 'Bearer valid-token')
        .send(sendDto)
        .expect(201);

      expect(response.body.status).toBe(EmailStatus.SENT);
      expect(response.body.templateId).toBe('template-123');
      expect(emailService.sendTemplateEmail).toHaveBeenCalledWith(
        mockUser,
        'customer@example.com',
        'template-123',
        { companyName: 'SmartERP', userName: 'John Doe' },
      );
    });

    it('should handle multiple variables', async () => {
      const sendDto = {
        to: 'customer@example.com',
        templateId: 'template-123',
        variables: {
          firstName: 'John',
          lastName: 'Doe',
          orderNumber: 'ORD-001',
          totalAmount: '1000000',
          orderDate: '2024-01-15',
        },
      };

      emailService.sendTemplateEmail.mockResolvedValue(mockEmailLog as any);

      await request(app.getHttpServer())
        .post('/email/send-template')
        .set('Authorization', 'Bearer valid-token')
        .send(sendDto)
        .expect(201);

      expect(emailService.sendTemplateEmail).toHaveBeenCalledWith(
        mockUser,
        'customer@example.com',
        'template-123',
        sendDto.variables,
      );
    });

    it('should return 404 when template not found', async () => {
      const sendDto = {
        to: 'customer@example.com',
        templateId: 'template-999',
        variables: {},
      };

      emailService.sendTemplateEmail.mockRejectedValue(
        new HttpException('Template not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/email/send-template')
        .set('Authorization', 'Bearer valid-token')
        .send(sendDto)
        .expect(404);
    });

    it('should handle empty variables', async () => {
      const sendDto = {
        to: 'customer@example.com',
        templateId: 'template-123',
        variables: {},
      };

      emailService.sendTemplateEmail.mockResolvedValue(mockEmailLog as any);

      await request(app.getHttpServer())
        .post('/email/send-template')
        .set('Authorization', 'Bearer valid-token')
        .send(sendDto)
        .expect(201);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/email/send-template')
        .send({ to: 'test@example.com', templateId: 'template-123', variables: {} })
        .expect(401);
    });
  });

  describe('GET /email/logs', () => {
    it('should return all email logs', async () => {
      const logs = [mockEmailLog];
      emailService.findAllLogs.mockResolvedValue(logs as any);

      const _response = await request(app.getHttpServer())
        .get('/email/logs')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(logs);
      expect(emailService.findAllLogs).toHaveBeenCalledWith(mockUser);
    });

    it('should return empty array when no logs', async () => {
      emailService.findAllLogs.mockResolvedValue([]);

      const _response = await request(app.getHttpServer())
        .get('/email/logs')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return logs with different statuses', async () => {
      const logs = [
        { ...mockEmailLog, status: EmailStatus.SENT },
        { ...mockEmailLog, id: 'log-2', status: EmailStatus.PENDING },
        { ...mockEmailLog, id: 'log-3', status: EmailStatus.FAILED },
      ];

      emailService.findAllLogs.mockResolvedValue(logs as any);

      const _response = await request(app.getHttpServer())
        .get('/email/logs')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveLength(3);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/email/logs').expect(401);
    });
  });

  describe('GET /email/logs/:id', () => {
    it('should return email log by ID', async () => {
      emailService.findLogById.mockResolvedValue(mockEmailLog as any);

      const _response = await request(app.getHttpServer())
        .get('/email/logs/log-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockEmailLog);
      expect(emailService.findLogById).toHaveBeenCalledWith(mockUser, 'log-123');
    });

    it('should return 404 when log not found', async () => {
      emailService.findLogById.mockRejectedValue(
        new HttpException('Email log with ID log-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/email/logs/log-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/email/logs/log-123').expect(401);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent email sending', async () => {
      emailService.sendEmail.mockResolvedValue(mockEmailLog as any);

      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/email/send')
            .set('Authorization', 'Bearer valid-token')
            .send({ to: 'test@example.com', subject: 'Test', body: 'Test' }),
        );

      const responses = await Promise.all(requests);

      responses.forEach((_response) => {
        expect(response.status).toBe(201);
      });
    });

    it('should handle very long email body', async () => {
      const longBody = 'a'.repeat(100000);
      emailService.sendEmail.mockResolvedValue(mockEmailLog as any);

      await request(app.getHttpServer())
        .post('/email/send')
        .set('Authorization', 'Bearer valid-token')
        .send({ to: 'test@example.com', subject: 'Test', body: longBody })
        .expect(201);
    });

    it('should handle special characters in subject', async () => {
      const specialSubject = 'Test: <Important> [Action Required] & More!';
      emailService.sendEmail.mockResolvedValue(mockEmailLog as any);

      await request(app.getHttpServer())
        .post('/email/send')
        .set('Authorization', 'Bearer valid-token')
        .send({ to: 'test@example.com', subject: specialSubject, body: 'Test' })
        .expect(201);
    });

    it('should handle multiple recipients in CC', async () => {
      emailService.sendEmail.mockResolvedValue(mockEmailLog as any);

      await request(app.getHttpServer())
        .post('/email/send')
        .set('Authorization', 'Bearer valid-token')
        .send({
          to: 'test@example.com',
          subject: 'Test',
          body: 'Test',
          cc: 'cc1@example.com,cc2@example.com,cc3@example.com',
        })
        .expect(201);
    });

    it('should handle HTML content in body', async () => {
      const htmlBody =
        '<html><body><h1>Hello</h1><p>This is <strong>HTML</strong> content.</p></body></html>';
      emailService.sendEmail.mockResolvedValue(mockEmailLog as any);

      await request(app.getHttpServer())
        .post('/email/send')
        .set('Authorization', 'Bearer valid-token')
        .send({ to: 'test@example.com', subject: 'Test', body: htmlBody })
        .expect(201);
    });

    it('should handle missing optional variables in template', async () => {
      emailService.sendTemplateEmail.mockResolvedValue(mockEmailLog as any);

      await request(app.getHttpServer())
        .post('/email/send-template')
        .set('Authorization', 'Bearer valid-token')
        .send({
          to: 'test@example.com',
          templateId: 'template-123',
          variables: { userName: 'John' }, // Missing companyName
        })
        .expect(201);
    });

    it('should handle rate limiting gracefully', async () => {
      emailService.sendEmail.mockRejectedValue(
        new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS),
      );

      await request(app.getHttpServer())
        .post('/email/send')
        .set('Authorization', 'Bearer valid-token')
        .send({ to: 'test@example.com', subject: 'Test', body: 'Test' })
        .expect(429);
    });
  });
});
