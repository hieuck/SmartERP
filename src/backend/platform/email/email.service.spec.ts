import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EmailService } from './email.service';
import { EmailTemplate, TemplateType } from './entities/email-template.entity';
import { EmailLog, EmailStatus } from './entities/email-log.entity';
import { NotFoundException } from '@nestjs/common';
import { createMockUser } from '@/common/test/test-helpers';

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

  const mockUser = createMockUser();

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
    describe('findAllTemplates', () => {
      it('should find all templates from database (cache miss)', async () => {
        const mockTemplates = [{ id: '1', name: 'Welcome Email' }];
        mockCacheManager.get.mockResolvedValue(null); // Cache miss
        mockTemplateRepository.find.mockResolvedValue(mockTemplates);
        mockCacheManager.set.mockResolvedValue(undefined);

        const result = await service.findAllTemplates(mockUser);

        expect(result).toEqual(mockTemplates);
        expect(mockCacheManager.get).toHaveBeenCalledWith('email-template:all:tenant-1');
        expect(mockCacheManager.set).toHaveBeenCalledWith(
          'email-template:all:tenant-1',
          mockTemplates,
          300000,
        );
      });

      it('should return templates from cache (cache hit)', async () => {
        const mockTemplates = [{ id: '1', name: 'Welcome Email' }];
        mockCacheManager.get.mockResolvedValue(mockTemplates); // Cache hit

        const result = await service.findAllTemplates(mockUser);

        expect(result).toEqual(mockTemplates);
        expect(mockCacheManager.get).toHaveBeenCalledWith('email-template:all:tenant-1');
        expect(mockTemplateRepository.find).not.toHaveBeenCalled();
        expect(mockCacheManager.set).not.toHaveBeenCalled();
      });
    });

    describe('findTemplateById', () => {
      it('should find template by id from database (cache miss)', async () => {
        const mockTemplate = { id: '1', name: 'Welcome Email' };
        mockCacheManager.get.mockResolvedValue(null); // Cache miss
        mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
        mockCacheManager.set.mockResolvedValue(undefined);

        const result = await service.findTemplateById(mockUser, '1');

        expect(result).toEqual(mockTemplate);
        expect(mockCacheManager.get).toHaveBeenCalledWith('email-template:tenant-1:1');
        expect(mockCacheManager.set).toHaveBeenCalledWith(
          'email-template:tenant-1:1',
          mockTemplate,
          300000,
        );
      });

      it('should return template from cache (cache hit)', async () => {
        const mockTemplate = { id: '1', name: 'Welcome Email' };
        mockCacheManager.get.mockResolvedValue(mockTemplate); // Cache hit

        const result = await service.findTemplateById(mockUser, '1');

        expect(result).toEqual(mockTemplate);
        expect(mockCacheManager.get).toHaveBeenCalledWith('email-template:tenant-1:1');
        expect(mockTemplateRepository.findOne).not.toHaveBeenCalled();
        expect(mockCacheManager.set).not.toHaveBeenCalled();
      });

      it('should throw NotFoundException if template not found', async () => {
        mockCacheManager.get.mockResolvedValue(null); // Cache miss
        mockTemplateRepository.findOne.mockResolvedValue(null);

        await expect(service.findTemplateById(mockUser, '999')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('findTemplateByType', () => {
      it('should find template by type from database (cache miss)', async () => {
        const mockTemplate = {
          id: '1',
          type: TemplateType.WELCOME,
          isActive: true,
        };
        mockCacheManager.get.mockResolvedValue(null); // Cache miss
        mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
        mockCacheManager.set.mockResolvedValue(undefined);

        const result = await service.findTemplateByType(mockUser, TemplateType.WELCOME);

        expect(result).toEqual(mockTemplate);
        expect(mockCacheManager.get).toHaveBeenCalledWith(
          'email-template:tenant-1:type:welcome',
        );
        expect(mockCacheManager.set).toHaveBeenCalledWith(
          'email-template:tenant-1:type:welcome',
          mockTemplate,
          300000,
        );
      });

      it('should return template from cache (cache hit)', async () => {
        const mockTemplate = {
          id: '1',
          type: TemplateType.WELCOME,
          isActive: true,
        };
        mockCacheManager.get.mockResolvedValue(mockTemplate); // Cache hit

        const result = await service.findTemplateByType(mockUser, TemplateType.WELCOME);

        expect(result).toEqual(mockTemplate);
        expect(mockCacheManager.get).toHaveBeenCalledWith(
          'email-template:tenant-1:type:welcome',
        );
        expect(mockTemplateRepository.findOne).not.toHaveBeenCalled();
        expect(mockCacheManager.set).not.toHaveBeenCalled();
      });

      it('should throw NotFoundException if template not found', async () => {
        mockCacheManager.get.mockResolvedValue(null); // Cache miss
        mockTemplateRepository.findOne.mockResolvedValue(null);

        await expect(service.findTemplateByType(mockUser, TemplateType.WELCOME)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('createTemplate', () => {
      it('should create a new template', async () => {
        const templateData = {
          name: 'New Template',
          subject: 'Test Subject',
          body: 'Test Body',
          type: TemplateType.WELCOME,
        };
        const mockTemplate = { id: '1', ...templateData, tenantId: 'tenant-1' };
        mockTemplateRepository.create.mockReturnValue(mockTemplate);
        mockTemplateRepository.save.mockResolvedValue(mockTemplate);

        const result = await service.createTemplate(mockUser, templateData);

        expect(result).toEqual(mockTemplate);
        expect(mockTemplateRepository.create).toHaveBeenCalledWith({
          ...templateData,
          tenantId: 'tenant-1',
        });
        expect(mockTemplateRepository.save).toHaveBeenCalledWith(mockTemplate);
      });
    });

    describe('updateTemplate', () => {
      it('should update template and invalidate caches', async () => {
        const existingTemplate = { id: '1', name: 'Old Name', tenantId: 'tenant-1' };
        const updatedTemplate = { id: '1', name: 'New Name', tenantId: 'tenant-1' };
        const updateData = { name: 'New Name' };

        // First call to findTemplateById (in updateTemplate)
        mockCacheManager.get.mockResolvedValueOnce(null);
        mockTemplateRepository.findOne.mockResolvedValueOnce(existingTemplate);
        mockCacheManager.set.mockResolvedValue(undefined);

        mockTemplateRepository.update.mockResolvedValue({ affected: 1 });
        mockCacheManager.del.mockResolvedValue(undefined);

        // Second call to findTemplateById (return updated template)
        mockCacheManager.get.mockResolvedValueOnce(null);
        mockTemplateRepository.findOne.mockResolvedValueOnce(updatedTemplate);

        const result = await service.updateTemplate(mockUser, '1', updateData);

        expect(result).toEqual(updatedTemplate);
        expect(mockTemplateRepository.update).toHaveBeenCalledWith(
          { tenantId: 'tenant-1', id: '1' },
          updateData,
        );
        expect(mockCacheManager.del).toHaveBeenCalledWith('email-template:tenant-1:1');
        expect(mockCacheManager.del).toHaveBeenCalledWith('email-template:all:tenant-1');
      });
    });

    describe('deleteTemplate', () => {
      it('should delete template and invalidate caches', async () => {
        const mockTemplate = {
          id: '1',
          name: 'Template',
          type: TemplateType.WELCOME,
          tenantId: 'tenant-1',
        };
        mockCacheManager.get.mockResolvedValue(null);
        mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
        mockCacheManager.set.mockResolvedValue(undefined);
        mockTemplateRepository.softDelete.mockResolvedValue({ affected: 1 });
        mockCacheManager.del.mockResolvedValue(undefined);

        await service.deleteTemplate(mockUser, '1');

        expect(mockTemplateRepository.softDelete).toHaveBeenCalledWith({
          tenantId: 'tenant-1',
          id: '1',
        });
        expect(mockCacheManager.del).toHaveBeenCalledWith('email-template:tenant-1:1');
        expect(mockCacheManager.del).toHaveBeenCalledWith('email-template:all:tenant-1');
        expect(mockCacheManager.del).toHaveBeenCalledWith(
          'email-template:tenant-1:type:welcome',
        );
      });

      it('should delete template without type cache invalidation', async () => {
        const mockTemplate = {
          id: '1',
          name: 'Template',
          type: null,
          tenantId: 'tenant-1',
        };
        mockCacheManager.get.mockResolvedValue(null);
        mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
        mockCacheManager.set.mockResolvedValue(undefined);
        mockTemplateRepository.softDelete.mockResolvedValue({ affected: 1 });
        mockCacheManager.del.mockResolvedValue(undefined);

        await service.deleteTemplate(mockUser, '1');

        expect(mockTemplateRepository.softDelete).toHaveBeenCalledWith({
          tenantId: 'tenant-1',
          id: '1',
        });
        expect(mockCacheManager.del).toHaveBeenCalledWith('email-template:tenant-1:1');
        expect(mockCacheManager.del).toHaveBeenCalledWith('email-template:all:tenant-1');
        expect(mockCacheManager.del).toHaveBeenCalledTimes(2); // Only 2 calls, no type cache
      });
    });
  });

  describe('Email Sending', () => {
    it('should send email successfully', async () => {
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

      await service.sendEmail(mockUser, 'test@example.com', 'Test', 'Test body');

      expect(mockLogRepository.create).toHaveBeenCalled();
      expect(mockLogRepository.save).toHaveBeenCalled();
      expect(mockLogRepository.update).toHaveBeenCalledWith(
        { id: '1', tenantId: 'tenant-1' },
        expect.objectContaining({
          status: EmailStatus.SENT,
          sentAt: expect.any(Date),
        }),
      );
    });

    it('should handle email sending failure', async () => {
      const mockLog = {
        id: '1',
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body',
        status: EmailStatus.PENDING,
      };
      mockLogRepository.create.mockReturnValue(mockLog);
      mockLogRepository.save.mockResolvedValue(mockLog);
      
      // Mock update to throw error on first call (simulating SMTP failure)
      const error = new Error('SMTP connection failed');
      mockLogRepository.update.mockRejectedValueOnce(error);
      
      // Second update call should succeed (updating status to FAILED)
      mockLogRepository.update.mockResolvedValueOnce({ affected: 1 });
      
      mockLogRepository.findOne.mockResolvedValue({
        ...mockLog,
        status: EmailStatus.FAILED,
        error: 'SMTP connection failed',
      });

      const result = await service.sendEmail(mockUser, 'test@example.com', 'Test', 'Test body');

      expect(result.status).toBe(EmailStatus.FAILED);
      expect(mockLogRepository.update).toHaveBeenCalledWith(
        { id: '1', tenantId: 'tenant-1' },
        expect.objectContaining({
          status: EmailStatus.FAILED,
          error: 'SMTP connection failed',
        }),
      );
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

      await service.sendTemplateEmail(mockUser, 'test@example.com', 'tmpl-1', {
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

      const result = await service.findAllLogs(mockUser);

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

      const result = await service.findLogById(mockUser, '1');

      expect(result).toEqual(mockLog);
    });

    it('should throw NotFoundException if log not found', async () => {
      mockLogRepository.findOne.mockResolvedValue(null);

      await expect(service.findLogById(mockUser, '999')).rejects.toThrow(NotFoundException);
    });
  });
});
