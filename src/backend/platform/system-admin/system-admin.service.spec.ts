import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SystemAdminService } from './system-admin.service';
import { SystemSetting, SettingCategory, SettingType } from './entities/system-setting.entity';
import { BackgroundJob, JobStatus, JobPriority } from './entities/background-job.entity';
import { ErrorLog, ErrorSeverity } from './entities/error-log.entity';
import { User } from '../../core/user/entities/user.entity';

describe('SystemAdminService', () => {
  let service: SystemAdminService;
  let settingRepository: Repository<SystemSetting>;
  let jobRepository: Repository<BackgroundJob>;
  let errorLogRepository: Repository<ErrorLog>;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    email: 'admin@test.com',
    roles: ['admin']
  } as User;

  const mockSetting: SystemSetting = {
    id: 'setting-123',
    tenantId: 'tenant-123',
    key: 'smtp_host',
    value: 'smtp.gmail.com',
    type: SettingType.STRING,
    category: SettingCategory.EMAIL,
    description: 'SMTP server hostname',
    isSecret: false,
    isEditable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: 'user-123'
  };

  const mockJob: BackgroundJob = {
    id: 'job-123',
    tenantId: 'tenant-123',
    jobType: 'email_batch_send',
    description: 'Send monthly newsletter',
    status: JobStatus.PENDING,
    priority: JobPriority.NORMAL,
    payload: { recipients: ['user@example.com'] },
    result: null,
    errorMessage: null,
    stackTrace: null,
    attempts: 0,
    maxAttempts: 3,
    scheduledAt: new Date(),
    startedAt: null,
    completedAt: null,
    durationMs: null,
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockErrorLog: ErrorLog = {
    id: 'error-123',
    tenantId: 'tenant-123',
    errorType: 'DatabaseError',
    message: 'Connection timeout',
    stackTrace: 'Error: Connection timeout\n  at ...',
    severity: ErrorSeverity.HIGH,
    context: { query: 'SELECT * FROM users' },
    userId: 'user-123',
    endpoint: '/api/users',
    method: 'GET',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    resolved: false,
    resolvedBy: null,
    resolvedAt: null,
    resolution: null,
    createdAt: new Date()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemAdminService,
        {
          provide: getRepositoryToken(SystemSetting),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            delete: jest.fn()
  }
  },
        {
          provide: getRepositoryToken(BackgroundJob),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn()
  }
  },
        {
          provide: getRepositoryToken(ErrorLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn()
  }
  },
      ]
  }).compile();

    service = module.get<SystemAdminService>(SystemAdminService);
    settingRepository = module.get<Repository<SystemSetting>>(getRepositoryToken(SystemSetting));
    jobRepository = module.get<Repository<BackgroundJob>>(getRepositoryToken(BackgroundJob));
    errorLogRepository = module.get<Repository<ErrorLog>>(getRepositoryToken(ErrorLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('System Settings', () => {
    describe('createSetting', () => {
      it('should create a new setting', async () => {
        const createDto = {
          key: 'smtp_host',
          value: 'smtp.gmail.com',
          type: SettingType.STRING,
          category: SettingCategory.EMAIL
  };

        jest.spyOn(settingRepository, 'findOne').mockResolvedValue(null);
        jest.spyOn(settingRepository, 'create').mockReturnValue(mockSetting as any);
        jest.spyOn(settingRepository, 'save').mockResolvedValue(mockSetting);

        const result = await service.createSetting(mockUser, createDto);

        expect(result).toEqual(mockSetting);
        expect(settingRepository.findOne).toHaveBeenCalledWith({
          where: { tenantId: mockUser.tenantId, key: createDto.key }
  });
      });

      it('should throw ConflictException if key already exists', async () => {
        const createDto = {
          key: 'smtp_host',
          value: 'smtp.gmail.com',
          type: SettingType.STRING,
          category: SettingCategory.EMAIL
  };

        jest.spyOn(settingRepository, 'findOne').mockResolvedValue(mockSetting);

        await expect(service.createSetting(mockUser, createDto)).rejects.toThrow(ConflictException);
      });
    });

    describe('getSetting', () => {
      it('should return a setting by key', async () => {
        jest.spyOn(settingRepository, 'findOne').mockResolvedValue(mockSetting);

        const result = await service.getSetting(mockUser, 'smtp_host');

        expect(result).toEqual(mockSetting);
      });

      it('should throw NotFoundException if setting not found', async () => {
        jest.spyOn(settingRepository, 'findOne').mockResolvedValue(null);

        await expect(service.getSetting(mockUser, 'nonexistent')).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateSetting', () => {
      it('should update a setting', async () => {
        const updateDto = { value: 'smtp.newhost.com' };
        const updatedSetting = { ...mockSetting, ...updateDto };

        jest.spyOn(settingRepository, 'findOne').mockResolvedValue(mockSetting);
        jest.spyOn(settingRepository, 'save').mockResolvedValue(updatedSetting);

        const result = await service.updateSetting(mockUser, 'smtp_host', updateDto);

        expect(result.value).toBe('smtp.newhost.com');
      });
    });

    describe('deleteSetting', () => {
      it('should delete a setting', async () => {
        jest.spyOn(settingRepository, 'findOne').mockResolvedValue(mockSetting);
        jest.spyOn(settingRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

        await service.deleteSetting(mockUser, 'smtp_host');

        expect(settingRepository.delete).toHaveBeenCalled();
      });
    });
  });

  describe('Background Jobs', () => {
    describe('createJob', () => {
      it('should create a new background job', async () => {
        const createDto = {
          jobType: 'email_batch_send',
          priority: JobPriority.NORMAL
  };

        jest.spyOn(jobRepository, 'create').mockReturnValue(mockJob as any);
        jest.spyOn(jobRepository, 'save').mockResolvedValue(mockJob);

        const result = await service.createJob(mockUser, createDto);

        expect(result).toEqual(mockJob);
      });
    });

    describe('getJobById', () => {
      it('should return a job by id', async () => {
        jest.spyOn(jobRepository, 'findOne').mockResolvedValue(mockJob);

        const result = await service.getJobById(mockUser, 'job-123');

        expect(result).toEqual(mockJob);
      });
    });

    describe('getJobsByStatus', () => {
      it('should return jobs by status', async () => {
        jest.spyOn(jobRepository, 'find').mockResolvedValue([mockJob]);

        const result = await service.getJobsByStatus(mockUser, JobStatus.PENDING);

        expect(result).toEqual([mockJob]);
      });
    });
  });

  describe('Error Logs', () => {
    describe('createErrorLog', () => {
      it('should create a new error log', async () => {
        const createDto = {
          errorType: 'DatabaseError',
          message: 'Connection timeout',
          severity: ErrorSeverity.HIGH
  };

        jest.spyOn(errorLogRepository, 'create').mockReturnValue(mockErrorLog as any);
        jest.spyOn(errorLogRepository, 'save').mockResolvedValue(mockErrorLog);

        const result = await service.createErrorLog(mockUser, createDto);

        expect(result).toEqual(mockErrorLog);
      });
    });

    describe('getErrorLogs', () => {
      it('should return error logs with filters', async () => {
        const queryBuilder: any = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([mockErrorLog])
  };

        jest.spyOn(errorLogRepository, 'createQueryBuilder').mockReturnValue(queryBuilder);

        const result = await service.getErrorLogs(mockUser, {});

        expect(result).toEqual([mockErrorLog]);
      });

      it('should filter by severity', async () => {
        const queryBuilder: any = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([mockErrorLog])
  };

        jest.spyOn(errorLogRepository, 'createQueryBuilder').mockReturnValue(queryBuilder);

        const result = await service.getErrorLogs(mockUser, { severity: ErrorSeverity.HIGH });

        expect(result).toEqual([mockErrorLog]);
        expect(queryBuilder.andWhere).toHaveBeenCalled();
      });

      it('should filter by resolved status', async () => {
        const queryBuilder: any = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([mockErrorLog])
  };

        jest.spyOn(errorLogRepository, 'createQueryBuilder').mockReturnValue(queryBuilder);

        const result = await service.getErrorLogs(mockUser, { resolved: false });

        expect(result).toEqual([mockErrorLog]);
      });
    });

    describe('resolveErrorLog', () => {
      it('should resolve an error log', async () => {
        const resolvedLog = { ...mockErrorLog, resolved: true, resolution: 'Fixed' };

        jest.spyOn(errorLogRepository, 'findOne').mockResolvedValue(mockErrorLog);
        jest.spyOn(errorLogRepository, 'save').mockResolvedValue(resolvedLog);

        const result = await service.resolveErrorLog(mockUser, 'error-123', {
          resolved: true,
          resolution: 'Fixed'
  });

        expect(result.resolved).toBe(true);
      });

      it('should throw NotFoundException if error log not found', async () => {
        jest.spyOn(errorLogRepository, 'findOne').mockResolvedValue(null);

        await expect(service.resolveErrorLog(mockUser, 'invalid-id', { resolved: true })).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Additional Coverage', () => {
    describe('getAllSettings', () => {
      it('should return all settings', async () => {
        jest.spyOn(settingRepository, 'find').mockResolvedValue([mockSetting]);

        const result = await service.getAllSettings(mockUser);

        expect(result).toEqual([mockSetting]);
      });

      it('should filter by category', async () => {
        jest.spyOn(settingRepository, 'find').mockResolvedValue([mockSetting]);

        const result = await service.getAllSettings(mockUser, SettingCategory.EMAIL);

        expect(result).toEqual([mockSetting]);
        expect(settingRepository.find).toHaveBeenCalledWith({
          where: { tenantId: mockUser.tenantId, category: SettingCategory.EMAIL }
  });
      });
    });

    describe('getAllJobs', () => {
      it('should return all jobs', async () => {
        jest.spyOn(jobRepository, 'find').mockResolvedValue([mockJob]);

        const result = await service.getAllJobs(mockUser);

        expect(result).toEqual([mockJob]);
      });
    });

    describe('updateJobStatus', () => {
      it('should update a job status to RUNNING', async () => {
        const updatedJob = { ...mockJob, status: JobStatus.RUNNING, startedAt: new Date() };

        jest.spyOn(jobRepository, 'findOne').mockResolvedValue(mockJob);
        jest.spyOn(jobRepository, 'save').mockResolvedValue(updatedJob);

        const result = await service.updateJobStatus(mockUser, 'job-123', JobStatus.RUNNING);

        expect(result.status).toBe(JobStatus.RUNNING);
      });

      it('should update a job status to COMPLETED with duration', async () => {
        const startedJob = { ...mockJob, status: JobStatus.RUNNING, startedAt: new Date() };
        const completedJob = { ...startedJob, status: JobStatus.COMPLETED, completedAt: new Date(), durationMs: 1000 };

        jest.spyOn(jobRepository, 'findOne').mockResolvedValue(startedJob);
        jest.spyOn(jobRepository, 'save').mockResolvedValue(completedJob);

        const result = await service.updateJobStatus(mockUser, 'job-123', JobStatus.COMPLETED, { success: true });

        expect(result.status).toBe(JobStatus.COMPLETED);
      });

      it('should update a job status to FAILED with error message', async () => {
        const startedJob = { ...mockJob, status: JobStatus.RUNNING, startedAt: new Date() };
        const failedJob = { ...startedJob, status: JobStatus.FAILED, completedAt: new Date(), errorMessage: 'Error occurred' };

        jest.spyOn(jobRepository, 'findOne').mockResolvedValue(startedJob);
        jest.spyOn(jobRepository, 'save').mockResolvedValue(failedJob);

        const result = await service.updateJobStatus(mockUser, 'job-123', JobStatus.FAILED, null, 'Error occurred');

        expect(result.status).toBe(JobStatus.FAILED);
        expect(result.errorMessage).toBe('Error occurred');
      });

      it('should throw NotFoundException if job not found', async () => {
        jest.spyOn(jobRepository, 'findOne').mockResolvedValue(null);

        await expect(service.updateJobStatus(mockUser, 'invalid-id', JobStatus.RUNNING)).rejects.toThrow(NotFoundException);
      });
    });

    describe('createJob with scheduledAt', () => {
      it('should create a job with scheduled time', async () => {
        const scheduledDate = new Date('2026-12-31');
        const createDto = {
          jobType: 'email_batch_send',
          priority: JobPriority.NORMAL,
          scheduledAt: scheduledDate.toISOString()
  };

        const jobWithSchedule = { ...mockJob, scheduledAt: scheduledDate };

        jest.spyOn(jobRepository, 'create').mockReturnValue(jobWithSchedule as any);
        jest.spyOn(jobRepository, 'save').mockResolvedValue(jobWithSchedule);

        const result = await service.createJob(mockUser, createDto);

        expect(result.scheduledAt).toBeDefined();
      });
    });

    describe('getErrorLogs with filters', () => {
      it('should filter by errorType', async () => {
        const queryBuilder: any = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([mockErrorLog])
  };

        jest.spyOn(errorLogRepository, 'createQueryBuilder').mockReturnValue(queryBuilder);

        const result = await service.getErrorLogs(mockUser, { errorType: 'DatabaseError' });

        expect(result).toEqual([mockErrorLog]);
        expect(queryBuilder.andWhere).toHaveBeenCalled();
      });

      it('should apply limit and offset', async () => {
        const queryBuilder: any = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([mockErrorLog])
  };

        jest.spyOn(errorLogRepository, 'createQueryBuilder').mockReturnValue(queryBuilder);

        const result = await service.getErrorLogs(mockUser, { limit: 10, offset: 0 });

        expect(result).toEqual([mockErrorLog]);
        expect(queryBuilder.take).toHaveBeenCalledWith(10);
        expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      });
    });

    describe('resolveErrorLog with resolution', () => {
      it('should update resolvedBy and resolvedAt when resolved is true', async () => {
        const resolvedLog = {
          ...mockErrorLog,
          resolved: true,
          resolution: 'Fixed by restarting service',
          resolvedBy: mockUser.id,
          resolvedAt: new Date()
  };

        jest.spyOn(errorLogRepository, 'findOne').mockResolvedValue(mockErrorLog);
        jest.spyOn(errorLogRepository, 'save').mockResolvedValue(resolvedLog);

        const result = await service.resolveErrorLog(mockUser, 'error-123', {
          resolved: true,
          resolution: 'Fixed by restarting service'
  });

        expect(result.resolved).toBe(true);
        expect(result.resolution).toBe('Fixed by restarting service');
      });

      it('should not update resolvedBy when resolved is false', async () => {
        const unresolvedLog = { ...mockErrorLog, resolved: false };

        jest.spyOn(errorLogRepository, 'findOne').mockResolvedValue(mockErrorLog);
        jest.spyOn(errorLogRepository, 'save').mockResolvedValue(unresolvedLog);

        const result = await service.resolveErrorLog(mockUser, 'error-123', {
          resolved: false
  });

        expect(result.resolved).toBe(false);
      });
    });

    describe('getSystemHealth', () => {
      it('should return healthy status when no issues', async () => {
        jest.spyOn(jobRepository, 'count')
          .mockResolvedValueOnce(0) // pending jobs
          .mockResolvedValueOnce(0); // failed jobs
        jest.spyOn(errorLogRepository, 'count').mockResolvedValue(0);

        const result = await service.getSystemHealth(mockUser);

        expect(result).toBeDefined();
        expect(result.status).toBe('healthy');
        expect(result.pendingJobs).toBe(0);
        expect(result.failedJobs).toBe(0);
        expect(result.unresolvedErrors).toBe(0);
      });

      it('should return degraded status when there are failed jobs', async () => {
        jest.spyOn(jobRepository, 'count')
          .mockResolvedValueOnce(0) // pending jobs
          .mockResolvedValueOnce(5); // failed jobs
        jest.spyOn(errorLogRepository, 'count').mockResolvedValue(0);

        const result = await service.getSystemHealth(mockUser);

        expect(result.status).toBe('degraded');
        expect(result.failedJobs).toBe(5);
      });

      it('should return degraded status when there are unresolved errors', async () => {
        jest.spyOn(jobRepository, 'count')
          .mockResolvedValueOnce(0) // pending jobs
          .mockResolvedValueOnce(0); // failed jobs
        jest.spyOn(errorLogRepository, 'count').mockResolvedValue(3);

        const result = await service.getSystemHealth(mockUser);

        expect(result.status).toBe('degraded');
        expect(result.unresolvedErrors).toBe(3);
      });
    });

    describe('getJobById', () => {
      it('should throw NotFoundException if job not found', async () => {
        jest.spyOn(jobRepository, 'findOne').mockResolvedValue(null);

        await expect(service.getJobById(mockUser, 'invalid-id')).rejects.toThrow(NotFoundException);
      });
    });

    describe('deleteSetting', () => {
      it('should throw NotFoundException if setting not found', async () => {
        jest.spyOn(settingRepository, 'findOne').mockResolvedValue(null);

        await expect(service.deleteSetting(mockUser, 'nonexistent')).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateSetting', () => {
      it('should throw NotFoundException if setting not found', async () => {
        jest.spyOn(settingRepository, 'findOne').mockResolvedValue(null);

        await expect(service.updateSetting(mockUser, 'nonexistent', { value: 'new' })).rejects.toThrow(NotFoundException);
      });
    });
  });
});
