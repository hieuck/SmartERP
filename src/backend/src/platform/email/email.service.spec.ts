import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { EmailService } from './email.service';
import { EmailTemplate } from './entities/email-template.entity';
import { EmailLog } from './entities/email-log.entity';
import { PermissionService, User } from '@/common/security/permission.service';
import { EmailStatus } from './enums/email-status.enum';
import { TemplateType } from './enums/template-type.enum';

describe('EmailService', () => {
  let permissionService: jest.Mocked<PermissionService>;
  let service: EmailService;
  let templateRepository: jest.Mocked<Repository<EmailTemplate>>;
  let logRepository: jest.Mocked<Repository<EmailLog>>;
  let cacheManager: jest.Mocked<Cache>;
  let _permissionService: jest.Mocked<PermissionService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockTemplate: EmailTemplate = {
    id: 'template-1',
    tenantId: 'tenant-1',
    name: 'Welcome Email',
    subject: 'Welcome {{name}}',
    body: 'Hello {{name}}, welcome to our platform!',
    type: TemplateType.WELCOME,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as EmailTemplate;

  const mockLog: EmailLog = {
    id: 'log-1',
    tenantId: 'tenant-1',
    to: 'test@example.com',
    subject: 'Test Email',
    body: 'Test body',
    status: EmailStatus.PENDING,
    createdAt: new Date(),
  } as EmailLog;

  beforeEach(async () => {
    const mockTemplateRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      softDelete: jest.fn(),
    };

    const mockLogRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockPermissionService = {
      canRead: jest.fn().mockReturnValue(true),
      canWrite: jest.fn().mockReturnValue(true),
    };

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
    templateRepository = module.get(getRepositoryToken(EmailTemplate));
    logRepository = module.get(getRepositoryToken(EmailLog));
    cacheManager = module.get(CACHE_MANAGER);
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllTemplates', () => {
    it('should return templates from cache if available', async () => {
      const mockSecureRepo = {
        find: jest.fn(),
      };
      (service as any).secureTemplateRepo = mockSecureRepo;
      cacheManager.get.mockResolvedValue([mockTemplate]);

      const _result = await service.findAllTemplates(mockUser);

      expect(_result).toEqual([mockTemplate]);
      expect(cacheManager.get).toHaveBeenCalledWith(`email-template:all:${mockUser.tenantId}`);
      expect(mockSecureRepo.find).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when cache miss', async () => {
      const mockSecureRepo = {
        find: jest.fn().mockResolvedValue([mockTemplate]),
      };
      (service as any).secureTemplateRepo = mockSecureRepo;
      cacheManager.get.mockResolvedValue(null);

      const _result = await service.findAllTemplates(mockUser);

      expect(_result).toEqual([mockTemplate]);
      expect(mockSecureRepo.find).toHaveBeenCalledWith(mockUser, {
        order: { createdAt: 'DESC' },
      });
      expect(cacheManager.set).toHaveBeenCalledWith(
        `email-template:all:${mockUser.tenantId}`,
        [mockTemplate],
        300000,
      );
    });

    it('should return empty array when no templates found', async () => {
      const mockSecureRepo = {
        find: jest.fn().mockResolvedValue([]),
      };
      (service as any).secureTemplateRepo = mockSecureRepo;
      cacheManager.get.mockResolvedValue(null);

      const _result = await service.findAllTemplates(mockUser);

      expect(_result).toEqual([]);
    });
  });

  describe('findTemplateById', () => {
    it('should return template from cache if available', async () => {
      const mockSecureRepo = {
        findOne: jest.fn(),
      };
      (service as any).secureTemplateRepo = mockSecureRepo;
      cacheManager.get.mockResolvedValue(mockTemplate);

      const _result = await service.findTemplateById(mockUser, 'template-1');

      expect(_result).toEqual(mockTemplate);
      expect(mockSecureRepo.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when cache miss', async () => {
      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(mockTemplate),
      };
      (service as any).secureTemplateRepo = mockSecureRepo;
      cacheManager.get.mockResolvedValue(null);

      const _result = await service.findTemplateById(mockUser, 'template-1');

      expect(_result).toEqual(mockTemplate);
      expect(mockSecureRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { id: 'template-1' },
      });
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should throw NotFoundException when template not found', async () => {
      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      (service as any).secureTemplateRepo = mockSecureRepo;
      cacheManager.get.mockResolvedValue(null);

      await expect(service.findTemplateById(mockUser, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findTemplateById(mockUser, 'non-existent')).rejects.toThrow(
        'Template with ID non-existent not found',
      );
    });
  });

  describe('findTemplateByType', () => {
    it('should return template from cache if available', async () => {
      const mockSecureRepo = {
        findOne: jest.fn(),
      };
      (service as any).secureTemplateRepo = mockSecureRepo;
      cacheManager.get.mockResolvedValue(mockTemplate);

      const _result = await service.findTemplateByType(mockUser, TemplateType.WELCOME);

      expect(_result).toEqual(mockTemplate);
      expect(mockSecureRepo.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when cache miss', async () => {
      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(mockTemplate),
      };
      (service as any).secureTemplateRepo = mockSecureRepo;
      cacheManager.get.mockResolvedValue(null);

      const _result = await service.findTemplateByType(mockUser, TemplateType.WELCOME);

      expect(_result).toEqual(mockTemplate);
      expect(mockSecureRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { type: TemplateType.WELCOME, isActive: true },
      });
    });

    it('should throw NotFoundException when template type not found', async () => {
      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      (service as any).secureTemplateRepo = mockSecureRepo;
      cacheManager.get.mockResolvedValue(null);

      await expect(service.findTemplateByType(mockUser, TemplateType.WELCOME)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createTemplate', () => {
    it('should create template successfully', async () => {
      const mockSecureRepo = {
        save: jest.fn().mockResolvedValue(mockTemplate),
      };
      (service as any).secureTemplateRepo = mockSecureRepo;
      templateRepository.create.mockReturnValue(mockTemplate as any);

      const data = {
        name: 'Welcome Email',
        subject: 'Welcome',
        body: 'Hello',
        type: TemplateType.WELCOME,
      };

      const _result = await service.createTemplate(mockUser, data);

      expect(_result).toEqual(mockTemplate);
      expect(templateRepository.create).toHaveBeenCalledWith({
        ...data,
        tenantId: mockUser.tenantId,
      });
      expect(mockSecureRepo.save).toHaveBeenCalledWith(mockUser, mockTemplate);
    });
  });

  describe('updateTemplate', () => {
    it('should update template and invalidate cache', async () => {
      const updatedTemplate = { ...mockTemplate, name: 'Updated' };
      const mockSecureRepo = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(mockTemplate)
          .mockResolvedValueOnce(updatedTemplate),
        save: jest.fn().mockResolvedValue(updatedTemplate),
      };
      (service as any).secureTemplateRepo = mockSecureRepo;
      cacheManager.get.mockResolvedValue(null);

      const _result = await service.updateTemplate(mockUser, 'template-1', { name: 'Updated' });

      expect(mockSecureRepo.save).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalledWith(
        `email-template:${mockUser.tenantId}:template-1`,
      );
      expect(cacheManager.del).toHaveBeenCalledWith(`email-template:all:${mockUser.tenantId}`);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template and invalidate all related caches', async () => {
      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(mockTemplate),
      };
      (service as any).secureTemplateRepo = mockSecureRepo;
      cacheManager.get.mockResolvedValue(null);
      templateRepository.softDelete.mockResolvedValue({ affected: 1 } as any);

      await service.deleteTemplate(mockUser, 'template-1');

      expect(templateRepository.softDelete).toHaveBeenCalledWith({
        tenantId: mockUser.tenantId,
        id: 'template-1',
      });
      expect(cacheManager.del).toHaveBeenCalledWith(
        `email-template:${mockUser.tenantId}:template-1`,
      );
      expect(cacheManager.del).toHaveBeenCalledWith(`email-template:all:${mockUser.tenantId}`);
      expect(cacheManager.del).toHaveBeenCalledWith(
        `email-template:${mockUser.tenantId}:type:${mockTemplate.type}`,
      );
    });

    it('should handle template without type', async () => {
      const templateWithoutType = { ...mockTemplate, type: null };
      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(templateWithoutType),
      };
      (service as any).secureTemplateRepo = mockSecureRepo;
      cacheManager.get.mockResolvedValue(null);

      await service.deleteTemplate(mockUser, 'template-1');

      expect(cacheManager.del).toHaveBeenCalledTimes(2); // Only id and all caches
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const sentLog = { ...mockLog, status: EmailStatus.SENT, sentAt: expect.any(Date) };
      const mockSecureRepo = {
        save: jest.fn().mockResolvedValueOnce(mockLog).mockResolvedValueOnce(sentLog),
        findOne: jest.fn().mockResolvedValue(sentLog),
      };
      (service as any).secureLogRepo = mockSecureRepo;
      logRepository.create.mockReturnValue(mockLog as any);

      const _result = await service.sendEmail(
        mockUser,
        'test@example.com',
        'Test Subject',
        'Test Body',
      );

      expect(result.status).toBe(EmailStatus.SENT);
      expect(logRepository.create).toHaveBeenCalledWith({
        tenantId: mockUser.tenantId,
        to: 'test@example.com',
        cc: undefined,
        bcc: undefined,
        subject: 'Test Subject',
        body: 'Test Body',
        status: EmailStatus.PENDING,
      });
    });

    it('should send email with cc and bcc', async () => {
      const mockSecureRepo = {
        save: jest.fn().mockResolvedValue(mockLog),
        findOne: jest.fn().mockResolvedValue(mockLog),
      };
      (service as any).secureLogRepo = mockSecureRepo;
      logRepository.create.mockReturnValue(mockLog as any);

      await service.sendEmail(
        mockUser,
        'test@example.com',
        'Subject',
        'Body',
        'cc@example.com',
        'bcc@example.com',
      );

      expect(logRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: 'cc@example.com',
          bcc: 'bcc@example.com',
        }),
      );
    });

    it('should handle email sending failure', async () => {
      const failedLog = { ...mockLog, status: EmailStatus.FAILED, error: 'SMTP error' };
      const mockSecureRepo = {
        save: jest
          .fn()
          .mockResolvedValueOnce(mockLog)
          .mockRejectedValueOnce(new Error('SMTP error'))
          .mockResolvedValueOnce(failedLog),
        findOne: jest.fn().mockResolvedValue(failedLog),
      };
      (service as any).secureLogRepo = mockSecureRepo;
      logRepository.create.mockReturnValue(mockLog as any);

      const _result = await service.sendEmail(mockUser, 'test@example.com', 'Subject', 'Body');

      expect(result.status).toBe(EmailStatus.FAILED);
    });
  });

  describe('sendTemplateEmail', () => {
    it('should send email using template with variable replacement', async () => {
      const mockSecureRepo = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(mockTemplate)
          .mockResolvedValueOnce({ ...mockLog, status: EmailStatus.SENT }),
        save: jest.fn().mockResolvedValue({ ...mockLog, templateId: 'template-1' }),
      };
      (service as any).secureTemplateRepo = mockSecureRepo;
      (service as any).secureLogRepo = mockSecureRepo;
      cacheManager.get.mockResolvedValue(null);
      logRepository.create.mockReturnValue(mockLog as any);

      const _result = await service.sendTemplateEmail(mockUser, 'test@example.com', 'template-1', {
        name: 'John',
      });

      expect(mockSecureRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { id: 'template-1' },
      });
      expect(logRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Welcome John',
          body: 'Hello John, welcome to our platform!',
        }),
      );
    });

    it('should replace multiple variables in template', async () => {
      const template = {
        ...mockTemplate,
        subject: 'Hello {{firstName}} {{lastName}}',
        body: 'Welcome {{firstName}} {{lastName}} to {{company}}',
      };
      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValueOnce(template).mockResolvedValueOnce(mockLog),
        save: jest.fn().mockResolvedValue(mockLog),
      };
      (service as any).secureTemplateRepo = mockSecureRepo;
      (service as any).secureLogRepo = mockSecureRepo;
      cacheManager.get.mockResolvedValue(null);
      logRepository.create.mockReturnValue(mockLog as any);

      await service.sendTemplateEmail(mockUser, 'test@example.com', 'template-1', {
        firstName: 'John',
        lastName: 'Doe',
        company: 'ACME Corp',
      });

      expect(logRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Hello John Doe',
          body: 'Welcome John Doe to ACME Corp',
        }),
      );
    });

    it('should handle template not found', async () => {
      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      (service as any).secureTemplateRepo = mockSecureRepo;
      cacheManager.get.mockResolvedValue(null);

      await expect(
        service.sendTemplateEmail(mockUser, 'test@example.com', 'non-existent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllLogs', () => {
    it('should return email logs with limit', async () => {
      const mockSecureRepo = {
        find: jest.fn().mockResolvedValue([mockLog]),
      };
      (service as any).secureLogRepo = mockSecureRepo;

      const _result = await service.findAllLogs(mockUser);

      expect(_result).toEqual([mockLog]);
      expect(mockSecureRepo.find).toHaveBeenCalledWith(mockUser, {
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });

    it('should return empty array when no logs found', async () => {
      const mockSecureRepo = {
        find: jest.fn().mockResolvedValue([]),
      };
      (service as any).secureLogRepo = mockSecureRepo;

      const _result = await service.findAllLogs(mockUser);

      expect(_result).toEqual([]);
    });
  });

  describe('findLogById', () => {
    it('should return email log by id', async () => {
      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(mockLog),
      };
      (service as any).secureLogRepo = mockSecureRepo;

      const _result = await service.findLogById(mockUser, 'log-1');

      expect(_result).toEqual(mockLog);
      expect(mockSecureRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { id: 'log-1' },
      });
    });

    it('should throw NotFoundException when log not found', async () => {
      const mockSecureRepo = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      (service as any).secureLogRepo = mockSecureRepo;

      await expect(service.findLogById(mockUser, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findLogById(mockUser, 'non-existent')).rejects.toThrow(
        'Email log with ID non-existent not found',
      );
    });
  });
});
