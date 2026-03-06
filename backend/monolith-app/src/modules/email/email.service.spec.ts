import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EmailService } from './email.service';
import { EmailTemplate, TemplateType } from './entities/email-template.entity';
import { EmailLog, EmailStatus } from './entities/email-log.entity';
import { NotFoundException } from '@nestjs/common';

describe('EmailService', () => {
  let service: EmailService;

  const mockTemplateRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockLogRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: getRepositoryToken(EmailTemplate),
          useValue: mockTemplateRepository,
        },
        {
          provide: getRepositoryToken(EmailLog),
          useValue: mockLogRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Template Management', () => {
    it('should find all templates', async () => {
      const mockTemplates = [{ id: '1', name: 'Welcome Email' }];
      mockCacheManager.get.mockResolvedValue(null); // Cache miss
      mockTemplateRepository.find.mockResolvedValue(mockTemplates);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.findAllTemplates('tenant-1');

      expect(result).toEqual(mockTemplates);
      expect(mockCacheManager.get).toHaveBeenCalledWith('email-template:all:tenant-1');
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'email-template:all:tenant-1',
        mockTemplates,
        300000,
      );
    });

    it('should find template by type', async () => {
      const mockTemplate = {
        id: '1',
        type: TemplateType.WELCOME,
        isActive: true,
      };
      mockCacheManager.get.mockResolvedValue(null); // Cache miss
      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.findTemplateByType('tenant-1', TemplateType.WELCOME);

      expect(result).toEqual(mockTemplate);
    });

    it('should throw NotFoundException if template not found', async () => {
      mockCacheManager.get.mockResolvedValue(null); // Cache miss
      mockTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.findTemplateByType('tenant-1', TemplateType.WELCOME)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Email Sending', () => {
    it('should send email', async () => {
      const mockLog = {
        id: '1',
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body',
        status: EmailStatus.PENDING,
      };
      mockLogRepository.create.mockReturnValue(mockLog);
      mockLogRepository.save.mockResolvedValue(mockLog);
      mockLogRepository.update.mockResolvedValue({ affected: 1 });
      mockLogRepository.findOne.mockResolvedValue({
        ...mockLog,
        status: EmailStatus.SENT,
        sentAt: new Date(),
      });

      await service.sendEmail('tenant-1', 'test@example.com', 'Test', 'Test body');

      expect(mockLogRepository.create).toHaveBeenCalled();
      expect(mockLogRepository.save).toHaveBeenCalled();
    });

    it('should send template email with variables', async () => {
      const mockTemplate = {
        id: 'tmpl-1',
        subject: 'Hello {{name}}',
        body: 'Welcome {{name}}, your code is {{code}}',
      };
      mockCacheManager.get.mockResolvedValue(null); // Cache miss
      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
      mockCacheManager.set.mockResolvedValue(undefined);

      const mockLog = {
        id: '1',
        to: 'test@example.com',
        status: EmailStatus.PENDING,
      };
      mockLogRepository.create.mockReturnValue(mockLog);
      mockLogRepository.save.mockResolvedValue(mockLog);
      mockLogRepository.update.mockResolvedValue({ affected: 1 });
      mockLogRepository.findOne.mockResolvedValue({
        ...mockLog,
        status: EmailStatus.SENT,
        templateId: 'tmpl-1',
      });

      await service.sendTemplateEmail('tenant-1', 'test@example.com', 'tmpl-1', {
        name: 'John',
        code: '12345',
      });

      // Should be called twice: once for status update, once for templateId
      expect(mockLogRepository.update).toHaveBeenCalledTimes(2);
      expect(mockLogRepository.update).toHaveBeenNthCalledWith(
        2,
        { id: '1', tenantId: 'tenant-1' },
        { templateId: 'tmpl-1' },
      );
    });
  });

  describe('Email Logs', () => {
    it('should find all logs', async () => {
      const mockLogs = [{ id: '1', to: 'test@example.com' }];
      mockLogRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findAllLogs('tenant-1');

      expect(result).toEqual(mockLogs);
      expect(mockLogRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });

    it('should find log by id', async () => {
      const mockLog = { id: '1', to: 'test@example.com' };
      mockLogRepository.findOne.mockResolvedValue(mockLog);

      const result = await service.findLogById('tenant-1', '1');

      expect(result).toEqual(mockLog);
    });

    it('should throw NotFoundException if log not found', async () => {
      mockLogRepository.findOne.mockResolvedValue(null);

      await expect(service.findLogById('tenant-1', '999')).rejects.toThrow(NotFoundException);
    });
  });
});
