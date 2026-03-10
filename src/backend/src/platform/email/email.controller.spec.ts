import { Test, TestingModule } from '@nestjs/testing';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('EmailController', () => {
  let controller: EmailController;
  let service: EmailService;

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

  const mockUser = createMockUser();

  const mockTenantId = 'tenant-123';
  const mockTemplateId = 'template-123';
  const mockLogId = 'log-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    controller = module.get<EmailController>(EmailController);
    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllTemplates', () => {
    it('should return all email templates', async () => {
      const mockTemplates = [
        { id: '1', name: 'Welcome Email', subject: 'Welcome!' },
        { id: '2', name: 'Order Confirmation', subject: 'Order Confirmed' },
      ];
      mockEmailService.findAllTemplates.mockResolvedValue(mockTemplates);

      const result = await controller.findAllTemplates(mockTenantId);

      expect(result).toEqual(mockTemplates);
      expect(service.findAllTemplates).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findTemplateById', () => {
    it('should return template by id', async () => {
      const mockTemplate = { id: mockTemplateId, name: 'Welcome Email' };
      mockEmailService.findTemplateById.mockResolvedValue(mockTemplate);

      const result = await controller.findTemplateById(mockTenantId, mockTemplateId);

      expect(result).toEqual(mockTemplate);
      expect(service.findTemplateById).toHaveBeenCalledWith(mockTenantId, mockTemplateId);
    });
  });

  describe('createTemplate', () => {
    it('should create email template', async () => {
      const data = { name: 'New Template', subject: 'Test', body: 'Hello {{name}}' };
      const mockCreated = { id: mockTemplateId, ...data };
      mockEmailService.createTemplate.mockResolvedValue(mockCreated);

      const result = await controller.createTemplate(mockTenantId, data);

      expect(result).toEqual(mockCreated);
      expect(service.createTemplate).toHaveBeenCalledWith(mockTenantId, data);
    });
  });

  describe('updateTemplate', () => {
    it('should update email template', async () => {
      const data = { subject: 'Updated Subject' };
      const mockUpdated = { id: mockTemplateId, ...data };
      mockEmailService.updateTemplate.mockResolvedValue(mockUpdated);

      const result = await controller.updateTemplate(mockTenantId, mockTemplateId, data);

      expect(result).toEqual(mockUpdated);
      expect(service.updateTemplate).toHaveBeenCalledWith(mockTenantId, mockTemplateId, data);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete email template', async () => {
      mockEmailService.deleteTemplate.mockResolvedValue(undefined);

      const result = await controller.deleteTemplate(mockTenantId, mockTemplateId);

      expect(result).toBeUndefined();
      expect(service.deleteTemplate).toHaveBeenCalledWith(mockTenantId, mockTemplateId);
    });
  });

  describe('sendEmail', () => {
    it('should send email', async () => {
      const to = 'user@example.com';
      const subject = 'Test Email';
      const body = 'Test body';
      const mockLog = { id: mockLogId, to, subject, status: 'sent' };
      mockEmailService.sendEmail.mockResolvedValue(mockLog);

      const result = await controller.sendEmail(mockTenantId, to, subject, body);

      expect(result).toEqual(mockLog);
      expect(service.sendEmail).toHaveBeenCalledWith(mockTenantId, to, subject, body, undefined, undefined);
    });
  });

  describe('sendTemplateEmail', () => {
    it('should send template email', async () => {
      const to = 'user@example.com';
      const variables = { name: 'John' };
      const mockLog = { id: mockLogId, to, status: 'sent' };
      mockEmailService.sendTemplateEmail.mockResolvedValue(mockLog);

      const result = await controller.sendTemplateEmail(mockTenantId, to, mockTemplateId, variables);

      expect(result).toEqual(mockLog);
      expect(service.sendTemplateEmail).toHaveBeenCalledWith(mockTenantId, to, mockTemplateId, variables);
    });
  });

  describe('findAllLogs', () => {
    it('should return all email logs', async () => {
      const mockLogs = [
        { id: '1', to: 'user1@example.com', status: 'sent' },
        { id: '2', to: 'user2@example.com', status: 'failed' },
      ];
      mockEmailService.findAllLogs.mockResolvedValue(mockLogs);

      const result = await controller.findAllLogs(mockTenantId);

      expect(result).toEqual(mockLogs);
      expect(service.findAllLogs).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findLogById', () => {
    it('should return email log by id', async () => {
      const mockLog = { id: mockLogId, to: 'user@example.com', status: 'sent' };
      mockEmailService.findLogById.mockResolvedValue(mockLog);

      const result = await controller.findLogById(mockTenantId, mockLogId);

      expect(result).toEqual(mockLog);
      expect(service.findLogById).toHaveBeenCalledWith(mockTenantId, mockLogId);
    });
  });
});
