import { PermissionService, User } from '@/common/security/permission.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { EmailLog, EmailStatus } from './entities/email-log.entity';
import { EmailTemplate, TemplateType } from './entities/email-template.entity';

describe('EmailService', () => {
  let service: EmailService;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockTemplateRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    metadata: {
      tableName: 'email_templates',
      name: 'EmailTemplate',
      columns: [],
      relations: [],
    },
  };

  const mockLogRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    metadata: {
      tableName: 'email_logs',
      name: 'EmailLog',
      columns: [],
      relations: [],
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockPermissionService = {
    canRead: jest.fn().mockReturnValue(true),
    canWrite: jest.fn().mockReturnValue(true),
    canDelete: jest.fn().mockReturnValue(true),
    buildSecureQuery: jest.fn((user, query) => query),
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
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);

    // Mock SecureRepository methods
    jest.spyOn(service['secureTemplateRepo'], 'find').mockImplementation(async () => []);
    jest.spyOn(service['secureTemplateRepo'], 'findOne').mockImplementation(async () => null);
    jest
      .spyOn(service['secureTemplateRepo'], 'save')
      .mockImplementation(async (_user, data: any) => data);

    jest.spyOn(service['secureLogRepo'], 'find').mockImplementation(async () => []);
    jest.spyOn(service['secureLogRepo'], 'findOne').mockImplementation(async () => null);
    jest
      .spyOn(service['secureLogRepo'], 'save')
      .mockImplementation(async (_user, data: any) => data);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Template Management', () => {
    describe('findAllTemplates', () => {
      it('should find all templates from database (cache miss)', async () => {
        const mockTemplates = [{ id: '1', name: 'Welcome Email' }];
        mockCacheManager.get.mockResolvedValue(null); // Cache miss
        jest.spyOn(service['secureTemplateRepo'], 'find').mockResolvedValue(mockTemplates as any);
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
        expect(service['secureTemplateRepo'].find).not.toHaveBeenCalled();
        expect(mockCacheManager.set).not.toHaveBeenCalled();
      });
    });

    describe('findTemplateById', () => {
      it('should find template by id from database (cache miss)', async () => {
        const mockTemplate = { id: '1', name: 'Welcome Email' };
        mockCacheManager.get.mockResolvedValue(null); // Cache miss
        jest.spyOn(service['secureTemplateRepo'], 'findOne').mockResolvedValue(mockTemplate as any);
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
        expect(service['secureTemplateRepo'].findOne).not.toHaveBeenCalled();
        expect(mockCacheManager.set).not.toHaveBeenCalled();
      });

      it('should throw NotFoundException if template not found', async () => {
        mockCacheManager.get.mockResolvedValue(null); // Cache miss
        jest.spyOn(service['secureTemplateRepo'], 'findOne').mockResolvedValue(null);

        await expect(service.findTemplateById(mockUser, '999')).rejects.toThrow(NotFoundException);
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
        jest.spyOn(service['secureTemplateRepo'], 'findOne').mockResolvedValue(mockTemplate as any);
        mockCacheManager.set.mockResolvedValue(undefined);

        const result = await service.findTemplateByType(mockUser, TemplateType.WELCOME);

        expect(result).toEqual(mockTemplate);
        expect(mockCacheManager.get).toHaveBeenCalledWith('email-template:tenant-1:type:welcome');
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
        expect(mockCacheManager.get).toHaveBeenCalledWith('email-template:tenant-1:type:welcome');
        expect(service['secureTemplateRepo'].findOne).not.toHaveBeenCalled();
        expect(mockCacheManager.set).not.toHaveBeenCalled();
      });

      it('should throw NotFoundException if template not found', async () => {
        mockCacheManager.get.mockResolvedValue(null); // Cache miss
        jest.spyOn(service['secureTemplateRepo'], 'findOne').mockResolvedValue(null);

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
        const mockTemplate = {
          id: '1',
          ...templateData,
          tenantId: 'tenant-1',
        };
        mockTemplateRepository.create.mockReturnValue(mockTemplate);
        jest.spyOn(service['secureTemplateRepo'], 'save').mockResolvedValue(mockTemplate as any);

        const result = await service.createTemplate(mockUser, templateData);

        expect(result).toEqual(mockTemplate);
        expect(mockTemplateRepository.create).toHaveBeenCalledWith({
          ...templateData,
          tenantId: 'tenant-1',
        });
        expect(service['secureTemplateRepo'].save).toHaveBeenCalled();
      });
    });

    describe('updateTemplate', () => {
      it('should update template and invalidate caches', async () => {
        const existingTemplate = { id: '1', name: 'Old Name', tenantId: 'tenant-1' };
        const updatedTemplate = { id: '1', name: 'New Name', tenantId: 'tenant-1' };
        const updateData = { name: 'New Name' };

        // First call to findTemplateById (in updateTemplate)
        mockCacheManager.get.mockResolvedValueOnce(null);
        jest
          .spyOn(service['secureTemplateRepo'], 'findOne')
          .mockResolvedValueOnce(existingTemplate as any);
        mockCacheManager.set.mockResolvedValue(undefined);

        jest.spyOn(service['secureTemplateRepo'], 'save').mockResolvedValue(updatedTemplate as any);
        mockCacheManager.del.mockResolvedValue(undefined);

        // Second call to findTemplateById (return updated template)
        mockCacheManager.get.mockResolvedValueOnce(null);
        jest
          .spyOn(service['secureTemplateRepo'], 'findOne')
          .mockResolvedValueOnce(updatedTemplate as any);

        const result = await service.updateTemplate(mockUser, '1', updateData);

        expect(result).toEqual(updatedTemplate);
        expect(service['secureTemplateRepo'].save).toHaveBeenCalled();
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
        jest.spyOn(service['secureTemplateRepo'], 'findOne').mockResolvedValue(mockTemplate as any);
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
        expect(mockCacheManager.del).toHaveBeenCalledWith('email-template:tenant-1:type:welcome');
      });

      it('should delete template without type cache invalidation', async () => {
        const mockTemplate = {
          id: '1',
          name: 'Template',
          type: null,
          tenantId: 'tenant-1',
        };
        mockCacheManager.get.mockResolvedValue(null);
        jest.spyOn(service['secureTemplateRepo'], 'findOne').mockResolvedValue(mockTemplate as any);
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
        tenantId: 'tenant-1',
      };
      mockLogRepository.create.mockReturnValue(mockLog);
      jest
        .spyOn(service['secureLogRepo'], 'save')
        .mockResolvedValueOnce(mockLog as any)
        .mockResolvedValueOnce({ ...mockLog, status: EmailStatus.SENT, sentAt: new Date() } as any);
      jest
        .spyOn(service['secureLogRepo'], 'findOne')
        .mockResolvedValue({ ...mockLog, status: EmailStatus.SENT, sentAt: new Date() } as any);

      const result = await service.sendEmail(mockUser, 'test@example.com', 'Test', 'Test body');

      expect(mockLogRepository.create).toHaveBeenCalled();
      expect(service['secureLogRepo'].save).toHaveBeenCalledTimes(2);
      expect(result.status).toBe(EmailStatus.SENT);
    });

    it('should handle email sending failure', async () => {
      const mockLog = {
        id: '1',
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body',
        status: EmailStatus.PENDING,
        tenantId: 'tenant-1',
      };
      mockLogRepository.create.mockReturnValue(mockLog);

      // First save succeeds, second save (after error) also succeeds
      jest
        .spyOn(service['secureLogRepo'], 'save')
        .mockResolvedValueOnce(mockLog as any)
        .mockResolvedValueOnce({
          ...mockLog,
          status: EmailStatus.FAILED,
          error: 'SMTP connection failed',
        } as any);

      jest.spyOn(service['secureLogRepo'], 'findOne').mockResolvedValue({
        ...mockLog,
        status: EmailStatus.FAILED,
        error: 'SMTP connection failed',
      } as any);

      // Mock logger to throw error during email sending simulation
      jest.spyOn(service['logger'], 'log').mockImplementation(() => {
        throw new Error('SMTP connection failed');
      });

      const result = await service.sendEmail(mockUser, 'test@example.com', 'Test', 'Test body');

      expect(result.status).toBe(EmailStatus.FAILED);
      expect(result.error).toBe('SMTP connection failed');
    });

    it('should send template email with variables', async () => {
      const mockTemplate = {
        id: 'tmpl-1',
        subject: 'Hello {{name}}',
        body: 'Welcome {{name}}, your code is {{code}}',
        tenantId: 'tenant-1',
      };
      mockCacheManager.get.mockResolvedValue(null); // Cache miss
      jest.spyOn(service['secureTemplateRepo'], 'findOne').mockResolvedValue(mockTemplate as any);
      mockCacheManager.set.mockResolvedValue(undefined);

      const mockLog = {
        id: '1',
        to: 'test@example.com',
        status: EmailStatus.PENDING,
        tenantId: 'tenant-1',
      };
      mockLogRepository.create.mockReturnValue(mockLog);
      jest
        .spyOn(service['secureLogRepo'], 'save')
        .mockResolvedValueOnce(mockLog as any)
        .mockResolvedValueOnce({ ...mockLog, status: EmailStatus.SENT } as any)
        .mockResolvedValueOnce({ ...mockLog, templateId: 'tmpl-1' } as any);
      jest
        .spyOn(service['secureLogRepo'], 'findOne')
        .mockResolvedValueOnce({ ...mockLog, status: EmailStatus.SENT } as any)
        .mockResolvedValueOnce({ ...mockLog, templateId: 'tmpl-1' } as any);

      await service.sendTemplateEmail(mockUser, 'test@example.com', 'tmpl-1', {
        name: 'John',
        code: '12345',
      });

      expect(service['secureLogRepo'].save).toHaveBeenCalled();
    });
  });

  describe('Email Logs', () => {
    it('should find all logs', async () => {
      const mockLogs = [{ id: '1', to: 'test@example.com' }];
      jest.spyOn(service['secureLogRepo'], 'find').mockResolvedValue(mockLogs as any);

      const result = await service.findAllLogs(mockUser);

      expect(result).toEqual(mockLogs);
      expect(service['secureLogRepo'].find).toHaveBeenCalledWith(mockUser, {
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });

    it('should find log by id', async () => {
      const mockLog = { id: '1', to: 'test@example.com' };
      jest.spyOn(service['secureLogRepo'], 'findOne').mockResolvedValue(mockLog as any);

      const result = await service.findLogById(mockUser, '1');

      expect(result).toEqual(mockLog);
    });

    it('should throw NotFoundException if log not found', async () => {
      jest.spyOn(service['secureLogRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.findLogById(mockUser, '999')).rejects.toThrow(NotFoundException);
    });
  });
});
