import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SystemAdminService } from './system-admin.service';
import { SystemSetting } from './entities/system-setting.entity';
import { BackgroundJob } from './entities/background-job.entity';
import { ErrorLog } from './entities/error-log.entity';
import { PermissionService } from '@common/security/permission.service';
import { User } from '@core/user/entities/user.entity';
import { JobStatus, ErrorSeverity, SettingCategory } from './enums';

describe('SystemAdminService', () => {
  let permissionService: jest.Mocked<PermissionService>;
  let service: SystemAdminService;
  let settingRepository: jest.Mocked<Repository<SystemSetting>>;
  let jobRepository: jest.Mocked<Repository<BackgroundJob>>;
  let errorLogRepository: jest.Mocked<Repository<ErrorLog>>;
  let _permissionService: jest.Mocked<PermissionService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'admin@test.com',
    password: 'hashed',
    role: 'admin',
    roles: ['admin'],
    status: 'active',
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    syncStatus: 'synced',
  } as User;

  const mockSetting: Partial<SystemSetting> = {
    id: 'setting-1',
    key: 'app.name',
    value: 'Smart ERP',
    category: SettingCategory.GENERAL,
    updatedBy: 'user-1',
  };

  const mockJob: Partial<BackgroundJob> = {
    id: 'job-1',
    tenantId: 'tenant-1',
    jobType: 'backup',
    status: JobStatus.PENDING,
    createdBy: 'user-1',
  };

  const mockErrorLog: Partial<ErrorLog> = {
    id: 'error-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    severity: ErrorSeverity.HIGH,
    errorType: 'DatabaseError',
    message: 'Connection failed',
    resolved: false,
  };

  beforeEach(async () => {
    const mockSettingRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
    };

    const mockJobRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    };

    const mockErrorLogRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      })),
    };

    const mockPermissionService = {
      checkPermission: jest.fn().mockResolvedValue(true),
      filterByTenant: jest.fn((user, entities) => entities),
      canRead: jest.fn().mockReturnValue(true),
      canWrite: jest.fn().mockReturnValue(true),
      canDelete: jest.fn().mockReturnValue(true),
      buildSecureQuery: jest.fn((user, query) => query),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemAdminService,
        { provide: getRepositoryToken(SystemSetting), useValue: mockSettingRepo },
        { provide: getRepositoryToken(BackgroundJob), useValue: mockJobRepo },
        { provide: getRepositoryToken(ErrorLog), useValue: mockErrorLogRepo },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
    }).compile();

    service = module.get<SystemAdminService>(SystemAdminService);
    settingRepository = module.get(getRepositoryToken(SystemSetting));
    jobRepository = module.get(getRepositoryToken(BackgroundJob));
    errorLogRepository = module.get(getRepositoryToken(ErrorLog));
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('System Settings', () => {
    describe('createSetting', () => {
      it('should create setting successfully', async () => {
        settingRepository.findOne.mockResolvedValue(null);
        settingRepository.save.mockResolvedValue(mockSetting as SystemSetting);

        const result = await service.createSetting(mockUser, {
          key: 'app.name',
          value: 'Smart ERP',
        } as any);

        expect(settingRepository.save).toHaveBeenCalled();
        expect(result).toEqual(mockSetting);
      });

      it('should throw ConflictException when key already exists', async () => {
        settingRepository.findOne.mockResolvedValue(mockSetting as SystemSetting);

        await expect(
          service.createSetting(mockUser, { key: 'app.name', value: 'Test' } as any),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('getSetting', () => {
      it('should return setting by key', async () => {
        settingRepository.findOne.mockResolvedValue(mockSetting as SystemSetting);

        const result = await service.getSetting(mockUser, 'app.name');

        expect(result).toEqual(mockSetting);
      });

      it('should throw NotFoundException when setting not found', async () => {
        settingRepository.findOne.mockResolvedValue(null);

        await expect(service.getSetting(mockUser, 'invalid-key')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('getAllSettings', () => {
      it('should return all settings', async () => {
        settingRepository.find.mockResolvedValue([mockSetting as SystemSetting]);

        const result = await service.getAllSettings(mockUser);

        expect(result).toEqual([mockSetting]);
      });

      it('should filter by category', async () => {
        settingRepository.find.mockResolvedValue([mockSetting as SystemSetting]);

        const result = await service.getAllSettings(mockUser, SettingCategory.GENERAL);

        expect(result).toEqual([mockSetting]);
      });
    });

    describe('updateSetting', () => {
      it('should update setting successfully', async () => {
        settingRepository.findOne.mockResolvedValue(mockSetting as SystemSetting);
        settingRepository.save.mockResolvedValue({
          ...mockSetting,
          value: 'Updated',
        } as SystemSetting);

        const result = await service.updateSetting(mockUser, 'app.name', {
          value: 'Updated',
        } as any);

        expect(result.value).toBe('Updated');
      });
    });

    describe('deleteSetting', () => {
      it('should delete setting successfully', async () => {
        settingRepository.findOne.mockResolvedValue(mockSetting as SystemSetting);
        settingRepository.remove.mockResolvedValue(mockSetting as SystemSetting);

        await service.deleteSetting(mockUser, 'app.name');

        expect(settingRepository.remove).toHaveBeenCalled();
      });
    });
  });

  describe('Background Jobs', () => {
    describe('createJob', () => {
      it('should create job successfully', async () => {
        jobRepository.save.mockResolvedValue(mockJob as BackgroundJob);

        const result = await service.createJob(mockUser, { jobType: 'backup' } as any);

        expect(jobRepository.save).toHaveBeenCalled();
        expect(result).toEqual(mockJob);
      });

      it('should set scheduledAt when provided', async () => {
        const scheduledAt = '2024-12-31T00:00:00Z';
        jobRepository.save.mockResolvedValue({
          ...mockJob,
          scheduledAt: new Date(scheduledAt),
        } as BackgroundJob);

        const result = await service.createJob(mockUser, { jobType: 'backup', scheduledAt } as any);

        expect(result.scheduledAt).toBeDefined();
      });
    });

    describe('getJobById', () => {
      it('should return job by id', async () => {
        jobRepository.findOne.mockResolvedValue(mockJob as BackgroundJob);

        const result = await service.getJobById(mockUser, 'job-1');

        expect(result).toEqual(mockJob);
      });

      it('should throw NotFoundException when job not found', async () => {
        jobRepository.findOne.mockResolvedValue(null);

        await expect(service.getJobById(mockUser, 'invalid-id')).rejects.toThrow(NotFoundException);
      });
    });

    describe('getJobsByStatus', () => {
      it('should return jobs filtered by status', async () => {
        jobRepository.find.mockResolvedValue([mockJob as BackgroundJob]);

        const result = await service.getJobsByStatus(mockUser, JobStatus.PENDING);

        expect(jobRepository.find).toHaveBeenCalledWith({
          where: { status: JobStatus.PENDING },
          order: { createdAt: 'DESC' },
        });
        expect(result).toEqual([mockJob]);
      });
    });

    describe('getAllJobs', () => {
      it('should return all jobs', async () => {
        jobRepository.find.mockResolvedValue([mockJob as BackgroundJob]);

        const result = await service.getAllJobs(mockUser);

        expect(result).toEqual([mockJob]);
      });
    });

    describe('updateJobStatus', () => {
      it('should update job status to RUNNING and set startedAt', async () => {
        jobRepository.findOne.mockResolvedValue(mockJob as BackgroundJob);
        jobRepository.save.mockResolvedValue({
          ...mockJob,
          status: JobStatus.RUNNING,
          startedAt: new Date(),
        } as BackgroundJob);

        const result = await service.updateJobStatus(mockUser, 'job-1', JobStatus.RUNNING);

        expect(result.status).toBe(JobStatus.RUNNING);
        expect(result.startedAt).toBeDefined();
      });

      it('should update job status to COMPLETED and calculate duration', async () => {
        const startedAt = new Date('2024-01-01T10:00:00Z');
        const job = { ...mockJob, startedAt };
        jobRepository.findOne.mockResolvedValue(job as BackgroundJob);
        jobRepository.save.mockResolvedValue({
          ...job,
          status: JobStatus.COMPLETED,
          completedAt: new Date(),
          durationMs: 5000,
        } as BackgroundJob);

        const result = await service.updateJobStatus(mockUser, 'job-1', JobStatus.COMPLETED);

        expect(result.status).toBe(JobStatus.COMPLETED);
        expect(result.completedAt).toBeDefined();
        expect(result.durationMs).toBeDefined();
      });

      it('should update job status to FAILED with error message', async () => {
        jobRepository.findOne.mockResolvedValue(mockJob as BackgroundJob);
        jobRepository.save.mockResolvedValue({
          ...mockJob,
          status: JobStatus.FAILED,
          errorMessage: 'Error occurred',
        } as BackgroundJob);

        const result = await service.updateJobStatus(
          mockUser,
          'job-1',
          JobStatus.FAILED,
          undefined,
          'Error occurred',
        );

        expect(result.status).toBe(JobStatus.FAILED);
        expect(result.errorMessage).toBe('Error occurred');
      });

      it('should save result when provided', async () => {
        const result_data = { processed: 100 };
        jobRepository.findOne.mockResolvedValue(mockJob as BackgroundJob);
        jobRepository.save.mockResolvedValue({ ...mockJob, result: result_data } as BackgroundJob);

        const result = await service.updateJobStatus(
          mockUser,
          'job-1',
          JobStatus.COMPLETED,
          result_data,
        );

        expect(result.result).toEqual(result_data);
      });
    });
  });

  describe('Error Logs', () => {
    describe('createErrorLog', () => {
      it('should create error log successfully', async () => {
        errorLogRepository.save.mockResolvedValue(mockErrorLog as ErrorLog);

        const result = await service.createErrorLog(mockUser, {
          severity: ErrorSeverity.HIGH,
          errorType: 'DatabaseError',
          message: 'Connection failed',
        } as any);

        expect(errorLogRepository.save).toHaveBeenCalled();
        expect(result).toEqual(mockErrorLog);
      });

      it('should handle array return from save', async () => {
        errorLogRepository.save.mockResolvedValue([mockErrorLog] as any);

        const result = await service.createErrorLog(mockUser, {
          severity: ErrorSeverity.HIGH,
          errorType: 'DatabaseError',
          message: 'Test',
        } as any);

        expect(result).toEqual(mockErrorLog);
      });
    });

    describe('getErrorLogs', () => {
      it('should return error logs without pagination', async () => {
        errorLogRepository.find.mockResolvedValue([mockErrorLog as ErrorLog]);

        const result = await service.getErrorLogs(mockUser, {});

        expect(result).toEqual([mockErrorLog]);
      });

      it('should filter by severity', async () => {
        errorLogRepository.find.mockResolvedValue([mockErrorLog as ErrorLog]);

        const result = await service.getErrorLogs(mockUser, { severity: ErrorSeverity.HIGH });

        expect(result).toEqual([mockErrorLog]);
      });

      it('should filter by errorType', async () => {
        errorLogRepository.find.mockResolvedValue([mockErrorLog as ErrorLog]);

        const result = await service.getErrorLogs(mockUser, { errorType: 'DatabaseError' });

        expect(result).toEqual([mockErrorLog]);
      });

      it('should filter by resolved status', async () => {
        errorLogRepository.find.mockResolvedValue([mockErrorLog as ErrorLog]);

        const result = await service.getErrorLogs(mockUser, { resolved: false });

        expect(result).toEqual([mockErrorLog]);
      });

      it('should use query builder with pagination', async () => {
        const queryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([mockErrorLog]),
        };
        errorLogRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

        const result = await service.getErrorLogs(mockUser, { limit: 10, offset: 0 });

        expect(queryBuilder.take).toHaveBeenCalledWith(10);
        expect(queryBuilder.skip).toHaveBeenCalledWith(0);
        expect(result).toEqual([mockErrorLog]);
      });

      it('should apply all filters with pagination', async () => {
        const queryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        };
        errorLogRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

        await service.getErrorLogs(mockUser, {
          severity: ErrorSeverity.HIGH,
          errorType: 'DatabaseError',
          resolved: false,
          limit: 10,
          offset: 0,
        });

        expect(queryBuilder.andWhere).toHaveBeenCalledTimes(3);
      });
    });

    describe('resolveErrorLog', () => {
      it('should resolve error log successfully', async () => {
        errorLogRepository.findOne.mockResolvedValue(mockErrorLog as ErrorLog);
        errorLogRepository.save.mockResolvedValue({
          ...mockErrorLog,
          resolved: true,
          resolution: 'Fixed',
          resolvedBy: mockUser.id,
          resolvedAt: new Date(),
        } as ErrorLog);

        const result = await service.resolveErrorLog(mockUser, 'error-1', {
          resolved: true,
          resolution: 'Fixed',
        });

        expect(result.resolved).toBe(true);
        expect(result.resolution).toBe('Fixed');
        expect(result.resolvedBy).toBe(mockUser.id);
        expect(result.resolvedAt).toBeDefined();
      });

      it('should throw NotFoundException when error log not found', async () => {
        errorLogRepository.findOne.mockResolvedValue(null);

        await expect(
          service.resolveErrorLog(mockUser, 'invalid-id', { resolved: true }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should update without resolution text', async () => {
        errorLogRepository.findOne.mockResolvedValue(mockErrorLog as ErrorLog);
        errorLogRepository.save.mockResolvedValue({ ...mockErrorLog, resolved: true } as ErrorLog);

        const result = await service.resolveErrorLog(mockUser, 'error-1', { resolved: true });

        expect(result.resolved).toBe(true);
      });
    });
  });

  describe('System Health', () => {
    describe('getSystemHealth', () => {
      it('should return healthy status when no issues', async () => {
        jobRepository.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
        errorLogRepository.count.mockResolvedValue(0);

        const result = await service.getSystemHealth(mockUser);

        expect(result.status).toBe('healthy');
        expect(result.pendingJobs).toBe(0);
        expect(result.failedJobs).toBe(0);
        expect(result.unresolvedErrors).toBe(0);
        expect(result.timestamp).toBeDefined();
      });

      it('should return degraded status when failed jobs exist', async () => {
        jobRepository.count.mockResolvedValueOnce(0).mockResolvedValueOnce(5);
        errorLogRepository.count.mockResolvedValue(0);

        const result = await service.getSystemHealth(mockUser);

        expect(result.status).toBe('degraded');
        expect(result.failedJobs).toBe(5);
      });

      it('should return degraded status when unresolved errors exist', async () => {
        jobRepository.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
        errorLogRepository.count.mockResolvedValue(3);

        const result = await service.getSystemHealth(mockUser);

        expect(result.status).toBe('degraded');
        expect(result.unresolvedErrors).toBe(3);
      });

      it('should return degraded status when both issues exist', async () => {
        jobRepository.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
        errorLogRepository.count.mockResolvedValue(5);

        const result = await service.getSystemHealth(mockUser);

        expect(result.status).toBe('degraded');
        expect(result.pendingJobs).toBe(2);
        expect(result.failedJobs).toBe(1);
        expect(result.unresolvedErrors).toBe(5);
      });
    });
  });
});
