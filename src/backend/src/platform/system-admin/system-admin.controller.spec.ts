import { Test, TestingModule } from '@nestjs/testing';
import { SystemAdminController } from './system-admin.controller';
import { SystemAdminService } from './system-admin.service';
import { JobStatus, SettingCategory, SettingType, JobPriority } from './enums';
import { User } from '@core/user/entities/user.entity';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { CreateBackgroundJobDto } from './dto/create-background-job.dto';
import { UpdateErrorLogDto } from './dto/update-error-log.dto';

describe('SystemAdminController', () => {
  let result: any;
  let service: jest.Mocked<SystemAdminService>;
  let controller: SystemAdminController;
  let _service: SystemAdminService;

  const mockUser: User = {
    id: 'user-1',
    email: 'admin@test.com',
    tenantId: 'tenant-1',
  } as User;

  const mockSystemAdminService = {
    createSetting: jest.fn(),
    getAllSettings: jest.fn(),
    getSetting: jest.fn(),
    updateSetting: jest.fn(),
    deleteSetting: jest.fn(),
    createJob: jest.fn(),
    getAllJobs: jest.fn(),
    getJobsByStatus: jest.fn(),
    getJobById: jest.fn(),
    getErrorLogs: jest.fn(),
    resolveErrorLog: jest.fn(),
    getSystemHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemAdminController],
      providers: [
        {
          provide: SystemAdminService,
          useValue: mockSystemAdminService,
        },
      ],
    }).compile();

    controller = module.get<SystemAdminController>(SystemAdminController);
    service = module.get<SystemAdminService>(SystemAdminService) as any;

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('System Settings Endpoints', () => {
    describe('POST /system-admin/settings', () => {
      it('should create a new system setting successfully', async () => {
        const createDto: CreateSystemSettingDto = {
          key: 'app.theme',
          value: 'dark',
          type: SettingType.STRING,
          category: SettingCategory.GENERAL,
          description: 'Application theme',
        };

        const expectedResult = {
          id: 'setting-1',
          ...createDto,
          createdAt: new Date(),
        };

        mockSystemAdminService.createSetting.mockResolvedValue(expectedResult);

        const result = await controller.createSetting(mockUser, createDto);

        expect(result).toEqual(expectedResult);
        expect(mockSystemAdminService.createSetting).toHaveBeenCalledWith(mockUser, createDto);
        expect(mockSystemAdminService.createSetting).toHaveBeenCalledTimes(1);
      });

      it('should handle empty value', async () => {
        const createDto: CreateSystemSettingDto = {
          key: 'app.feature',
          value: '',
          type: SettingType.STRING,
          category: SettingCategory.GENERAL,
        };

        const expectedResult = { id: 'setting-2', ...createDto };
        mockSystemAdminService.createSetting.mockResolvedValue(expectedResult);

        const result = await controller.createSetting(mockUser, createDto);

        expect(result).toEqual(expectedResult);
        expect(mockSystemAdminService.createSetting).toHaveBeenCalledWith(mockUser, createDto);
      });

      it('should handle service errors', async () => {
        const createDto: CreateSystemSettingDto = {
          key: 'duplicate.key',
          value: 'test',
          type: SettingType.STRING,
          category: SettingCategory.SYSTEM,
        };

        const error = new Error('Setting key already exists');
        mockSystemAdminService.createSetting.mockRejectedValue(error);

        await expect(controller.createSetting(mockUser, createDto)).rejects.toThrow(error);
        expect(mockSystemAdminService.createSetting).toHaveBeenCalledWith(mockUser, createDto);
      });
    });

    describe('GET /system-admin/settings', () => {
      it('should get all settings without category filter', async () => {
        const expectedSettings = [
          { id: '1', key: 'app.theme', value: 'dark', category: 'appearance' },
          { id: '2', key: 'app.lang', value: 'en', category: 'localization' },
        ];

        mockSystemAdminService.getAllSettings.mockResolvedValue(expectedSettings);

        const result = await controller.getAllSettings(mockUser);

        expect(result).toEqual(expectedSettings);
        expect(mockSystemAdminService.getAllSettings).toHaveBeenCalledWith(mockUser, undefined);
        expect(mockSystemAdminService.getAllSettings).toHaveBeenCalledTimes(1);
      });

      it('should get settings filtered by category', async () => {
        const category = 'appearance';
        const expectedSettings = [
          { id: '1', key: 'app.theme', value: 'dark', category: 'appearance' },
        ];

        mockSystemAdminService.getAllSettings.mockResolvedValue(expectedSettings);

        const result = await controller.getAllSettings(mockUser, category);

        expect(result).toEqual(expectedSettings);
        expect(mockSystemAdminService.getAllSettings).toHaveBeenCalledWith(mockUser, category);
      });

      it('should return empty array when no settings exist', async () => {
        mockSystemAdminService.getAllSettings.mockResolvedValue([]);

        const result = await controller.getAllSettings(mockUser);

        expect(result).toEqual([]);
        expect(mockSystemAdminService.getAllSettings).toHaveBeenCalledWith(mockUser, undefined);
      });

      it('should handle service errors', async () => {
        const error = new Error('Database connection failed');
        mockSystemAdminService.getAllSettings.mockRejectedValue(error);

        await expect(controller.getAllSettings(mockUser)).rejects.toThrow(error);
      });
    });

    describe('GET /system-admin/settings/:key', () => {
      it('should get a setting by key successfully', async () => {
        const key = 'app.theme';
        const expectedSetting = {
          id: '1',
          key: 'app.theme',
          value: 'dark',
          category: 'appearance',
        };

        mockSystemAdminService.getSetting.mockResolvedValue(expectedSetting);

        const result = await controller.getSetting(mockUser, key);

        expect(result).toEqual(expectedSetting);
        expect(mockSystemAdminService.getSetting).toHaveBeenCalledWith(mockUser, key);
        expect(mockSystemAdminService.getSetting).toHaveBeenCalledTimes(1);
      });

      it('should handle non-existent key', async () => {
        const key = 'non.existent';
        const error = new Error('Setting not found');
        mockSystemAdminService.getSetting.mockRejectedValue(error);

        await expect(controller.getSetting(mockUser, key)).rejects.toThrow(error);
        expect(mockSystemAdminService.getSetting).toHaveBeenCalledWith(mockUser, key);
      });

      it('should handle special characters in key', async () => {
        const key = 'app.feature-flag_v2';
        const expectedSetting = { id: '2', key, value: 'true' };
        mockSystemAdminService.getSetting.mockResolvedValue(expectedSetting);

        const result = await controller.getSetting(mockUser, key);

        expect(result).toEqual(expectedSetting);
        expect(mockSystemAdminService.getSetting).toHaveBeenCalledWith(mockUser, key);
      });
    });

    describe('PUT /system-admin/settings/:key', () => {
      it('should update a setting successfully', async () => {
        const key = 'app.theme';
        const updateDto: UpdateSystemSettingDto = {
          value: 'light',
          description: 'Updated theme',
        };

        const expectedResult = {
          id: '1',
          key,
          value: 'light',
          category: 'appearance',
          description: 'Updated theme',
        };

        mockSystemAdminService.updateSetting.mockResolvedValue(expectedResult);

        const result = await controller.updateSetting(mockUser, key, updateDto);

        expect(result).toEqual(expectedResult);
        expect(mockSystemAdminService.updateSetting).toHaveBeenCalledWith(mockUser, key, updateDto);
        expect(mockSystemAdminService.updateSetting).toHaveBeenCalledTimes(1);
      });

      it('should update only value field', async () => {
        const key = 'app.lang';
        const updateDto: UpdateSystemSettingDto = { value: 'vi' };
        const expectedResult = { id: '2', key, value: 'vi' };

        mockSystemAdminService.updateSetting.mockResolvedValue(expectedResult);

        const result = await controller.updateSetting(mockUser, key, updateDto);

        expect(result).toEqual(expectedResult);
        expect(mockSystemAdminService.updateSetting).toHaveBeenCalledWith(mockUser, key, updateDto);
      });

      it('should handle non-existent key', async () => {
        const key = 'non.existent';
        const updateDto: UpdateSystemSettingDto = { value: 'test' };
        const error = new Error('Setting not found');

        mockSystemAdminService.updateSetting.mockRejectedValue(error);

        await expect(controller.updateSetting(mockUser, key, updateDto)).rejects.toThrow(error);
      });

      it('should handle empty update dto', async () => {
        const key = 'app.theme';
        const updateDto: UpdateSystemSettingDto = {};
        const expectedResult = { id: '1', key, value: 'dark' };

        mockSystemAdminService.updateSetting.mockResolvedValue(expectedResult);

        const result = await controller.updateSetting(mockUser, key, updateDto);

        expect(result).toEqual(expectedResult);
      });
    });

    describe('DELETE /system-admin/settings/:key', () => {
      it('should delete a setting successfully', async () => {
        const key = 'app.deprecated';
        mockSystemAdminService.deleteSetting.mockResolvedValue({ success: true });

        const result = await controller.deleteSetting(mockUser, key);

        expect(result).toEqual({ success: true });
        expect(mockSystemAdminService.deleteSetting).toHaveBeenCalledWith(mockUser, key);
        expect(mockSystemAdminService.deleteSetting).toHaveBeenCalledTimes(1);
      });

      it('should handle non-existent key', async () => {
        const key = 'non.existent';
        const error = new Error('Setting not found');
        mockSystemAdminService.deleteSetting.mockRejectedValue(error);

        await expect(controller.deleteSetting(mockUser, key)).rejects.toThrow(error);
        expect(mockSystemAdminService.deleteSetting).toHaveBeenCalledWith(mockUser, key);
      });

      it('should handle deletion of protected settings', async () => {
        const key = 'system.protected';
        const error = new Error('Cannot delete protected setting');
        mockSystemAdminService.deleteSetting.mockRejectedValue(error);

        await expect(controller.deleteSetting(mockUser, key)).rejects.toThrow(error);
      });
    });
  });

  describe('Background Jobs Endpoints', () => {
    describe('POST /system-admin/jobs', () => {
      it('should create a new background job successfully', async () => {
        const createDto: CreateBackgroundJobDto = {
          jobType: 'data-sync',
          description: 'Scheduled data sync',
          priority: JobPriority.NORMAL,
          payload: { source: 'external-api' },
          scheduledAt: '2026-03-15T00:00:00Z',
        };

        const expectedResult = {
          id: 'job-1',
          ...createDto,
          status: JobStatus.PENDING,
          createdAt: new Date(),
        };

        mockSystemAdminService.createJob.mockResolvedValue(expectedResult);

        const result = await controller.createJob(mockUser, createDto);

        expect(result).toEqual(expectedResult);
        expect(mockSystemAdminService.createJob).toHaveBeenCalledWith(mockUser, createDto);
        expect(mockSystemAdminService.createJob).toHaveBeenCalledTimes(1);
      });

      it('should create job with empty payload', async () => {
        const createDto: CreateBackgroundJobDto = {
          jobType: 'cleanup',
          description: 'Manual cleanup',
          priority: JobPriority.LOW,
          payload: {},
        };

        const expectedResult = { id: 'job-2', ...createDto, status: JobStatus.PENDING };
        mockSystemAdminService.createJob.mockResolvedValue(expectedResult);

        const result = await controller.createJob(mockUser, createDto);

        expect(result).toEqual(expectedResult);
      });

      it('should handle invalid job configuration', async () => {
        const createDto: CreateBackgroundJobDto = {
          jobType: 'invalid-job',
          description: 'Invalid job',
          priority: JobPriority.NORMAL,
          scheduledAt: 'invalid-date',
        };

        const error = new Error('Invalid cron expression');
        mockSystemAdminService.createJob.mockRejectedValue(error);

        await expect(controller.createJob(mockUser, createDto)).rejects.toThrow(error);
      });
    });

    describe('GET /system-admin/jobs', () => {
      it('should get all jobs without status filter', async () => {
        const expectedJobs = [
          { id: '1', name: 'job-1', status: JobStatus.PENDING },
          { id: '2', name: 'job-2', status: JobStatus.RUNNING },
        ];

        mockSystemAdminService.getAllJobs.mockResolvedValue(expectedJobs);

        const result = await controller.getAllJobs(mockUser);

        expect(result).toEqual(expectedJobs);
        expect(mockSystemAdminService.getAllJobs).toHaveBeenCalledWith(mockUser);
        expect(mockSystemAdminService.getJobsByStatus).not.toHaveBeenCalled();
      });

      it('should get jobs filtered by status', async () => {
        const status = JobStatus.COMPLETED;
        const expectedJobs = [{ id: '1', name: 'job-1', status: JobStatus.COMPLETED }];

        mockSystemAdminService.getJobsByStatus.mockResolvedValue(expectedJobs);

        const result = await controller.getAllJobs(mockUser, status);

        expect(result).toEqual(expectedJobs);
        expect(mockSystemAdminService.getJobsByStatus).toHaveBeenCalledWith(mockUser, status);
        expect(mockSystemAdminService.getAllJobs).not.toHaveBeenCalled();
      });

      it('should return empty array when no jobs exist', async () => {
        mockSystemAdminService.getAllJobs.mockResolvedValue([]);

        const result = await controller.getAllJobs(mockUser);

        expect(result).toEqual([]);
      });

      it('should handle each job status filter', async () => {
        const statuses = [
          JobStatus.PENDING,
          JobStatus.RUNNING,
          JobStatus.COMPLETED,
          JobStatus.FAILED,
        ];

        for (const status of statuses) {
          mockSystemAdminService.getJobsByStatus.mockResolvedValue([{ id: '1', status }]);

          const result = await controller.getAllJobs(mockUser, status);

          expect(mockSystemAdminService.getJobsByStatus).toHaveBeenCalledWith(mockUser, status);
          expect(result[0].status).toBe(status);
        }
      });
    });

    describe('GET /system-admin/jobs/:id', () => {
      it('should get a job by id successfully', async () => {
        const id = 'job-1';
        const expectedJob = {
          id,
          name: 'data-sync',
          status: JobStatus.RUNNING,
          progress: 50,
        };

        mockSystemAdminService.getJobById.mockResolvedValue(expectedJob);

        const result = await controller.getJobById(mockUser, id);

        expect(result).toEqual(expectedJob);
        expect(mockSystemAdminService.getJobById).toHaveBeenCalledWith(mockUser, id);
        expect(mockSystemAdminService.getJobById).toHaveBeenCalledTimes(1);
      });

      it('should handle non-existent job id', async () => {
        const id = 'non-existent';
        const error = new Error('Job not found');
        mockSystemAdminService.getJobById.mockRejectedValue(error);

        await expect(controller.getJobById(mockUser, id)).rejects.toThrow(error);
      });

      it('should handle invalid job id format', async () => {
        const id = 'invalid-uuid';
        const error = new Error('Invalid job ID format');
        mockSystemAdminService.getJobById.mockRejectedValue(error);

        await expect(controller.getJobById(mockUser, id)).rejects.toThrow(error);
      });
    });
  });

  describe('Error Logs Endpoints', () => {
    describe('GET /system-admin/error-logs', () => {
      it('should get error logs without filters', async () => {
        const expectedLogs = [
          { id: '1', message: 'Error 1', level: 'error', timestamp: new Date() },
          { id: '2', message: 'Error 2', level: 'critical', timestamp: new Date() },
        ];

        mockSystemAdminService.getErrorLogs.mockResolvedValue(expectedLogs);

        const result = await controller.getErrorLogs(mockUser, {});

        expect(result).toEqual(expectedLogs);
        expect(mockSystemAdminService.getErrorLogs).toHaveBeenCalledWith(mockUser, {});
      });

      it('should get error logs with level filter', async () => {
        const filters = { level: 'critical' };
        const expectedLogs = [{ id: '1', message: 'Critical error', level: 'critical' }];

        mockSystemAdminService.getErrorLogs.mockResolvedValue(expectedLogs);

        const result = await controller.getErrorLogs(mockUser, filters);

        expect(result).toEqual(expectedLogs);
        expect(mockSystemAdminService.getErrorLogs).toHaveBeenCalledWith(mockUser, filters);
      });

      it('should get error logs with date range filter', async () => {
        const filters = {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        };

        const expectedLogs = [
          { id: '1', message: 'Error in January', timestamp: new Date('2024-01-15') },
        ];

        mockSystemAdminService.getErrorLogs.mockResolvedValue(expectedLogs);

        const result = await controller.getErrorLogs(mockUser, filters);

        expect(result).toEqual(expectedLogs);
        expect(mockSystemAdminService.getErrorLogs).toHaveBeenCalledWith(mockUser, filters);
      });

      it('should get error logs with multiple filters', async () => {
        const filters = {
          level: 'error',
          resolved: false,
          limit: 50,
        };

        const expectedLogs = [{ id: '1', level: 'error', resolved: false }];

        mockSystemAdminService.getErrorLogs.mockResolvedValue(expectedLogs);

        const result = await controller.getErrorLogs(mockUser, filters);

        expect(result).toEqual(expectedLogs);
      });

      it('should return empty array when no logs match filters', async () => {
        mockSystemAdminService.getErrorLogs.mockResolvedValue([]);

        const result = await controller.getErrorLogs(mockUser, { level: 'debug' });

        expect(result).toEqual([]);
      });
    });

    describe('PUT /system-admin/error-logs/:id/resolve', () => {
      it('should resolve an error log successfully', async () => {
        const id = 'log-1';
        const updateDto: UpdateErrorLogDto = {
          resolved: true,
          resolution: 'Fixed by restarting service',
        };

        const expectedResult = {
          id,
          resolved: true,
          resolution: updateDto.resolution,
          resolvedAt: new Date(),
        };

        mockSystemAdminService.resolveErrorLog.mockResolvedValue(expectedResult);

        const result = await controller.resolveErrorLog(mockUser, id, updateDto);

        expect(result).toEqual(expectedResult);
        expect(mockSystemAdminService.resolveErrorLog).toHaveBeenCalledWith(
          mockUser,
          id,
          updateDto,
        );
      });

      it('should resolve error log with minimal info', async () => {
        const id = 'log-2';
        const updateDto: UpdateErrorLogDto = {
          resolved: true,
          resolution: 'Resolved',
        };

        const expectedResult = { id, resolved: true };
        mockSystemAdminService.resolveErrorLog.mockResolvedValue(expectedResult);

        const result = await controller.resolveErrorLog(mockUser, id, updateDto);

        expect(result).toEqual(expectedResult);
      });

      it('should handle non-existent error log', async () => {
        const id = 'non-existent';
        const updateDto: UpdateErrorLogDto = { resolved: true, resolution: 'Fixed' };
        const error = new Error('Error log not found');

        mockSystemAdminService.resolveErrorLog.mockRejectedValue(error);

        await expect(controller.resolveErrorLog(mockUser, id, updateDto)).rejects.toThrow(error);
      });

      it('should handle already resolved error log', async () => {
        const id = 'log-3';
        const updateDto: UpdateErrorLogDto = { resolved: true, resolution: 'Fixed again' };
        const error = new Error('Error log already resolved');

        mockSystemAdminService.resolveErrorLog.mockRejectedValue(error);

        await expect(controller.resolveErrorLog(mockUser, id, updateDto)).rejects.toThrow(error);
      });
    });
  });

  describe('System Health Endpoint', () => {
    describe('GET /system-admin/health', () => {
      it('should get system health status successfully', async () => {
        const expectedHealth = {
          status: 'healthy',
          database: { status: 'up', responseTime: 10 },
          redis: { status: 'up', responseTime: 5 },
          memory: { used: 512, total: 2048 },
          cpu: { usage: 25 },
          uptime: 86400,
        };

        mockSystemAdminService.getSystemHealth.mockResolvedValue(expectedHealth);

        const result = await controller.getSystemHealth(mockUser);

        expect(result).toEqual(expectedHealth);
        expect(mockSystemAdminService.getSystemHealth).toHaveBeenCalledWith(mockUser);
        expect(mockSystemAdminService.getSystemHealth).toHaveBeenCalledTimes(1);
      });

      it('should handle degraded system health', async () => {
        const expectedHealth = {
          status: 'degraded',
          database: { status: 'up', responseTime: 100 },
          redis: { status: 'down', error: 'Connection timeout' },
          memory: { used: 1800, total: 2048 },
        };

        mockSystemAdminService.getSystemHealth.mockResolvedValue(expectedHealth);

        const result = await controller.getSystemHealth(mockUser);

        expect(result).toEqual(expectedHealth);
        expect(result.status).toBe('degraded');
      });

      it('should handle unhealthy system', async () => {
        const expectedHealth = {
          status: 'unhealthy',
          database: { status: 'down', error: 'Connection refused' },
          redis: { status: 'down', error: 'Connection refused' },
        };

        mockSystemAdminService.getSystemHealth.mockResolvedValue(expectedHealth);

        const result = await controller.getSystemHealth(mockUser);

        expect(result).toEqual(expectedHealth);
        expect(result.status).toBe('unhealthy');
      });

      it('should handle service errors during health check', async () => {
        const error = new Error('Health check failed');
        mockSystemAdminService.getSystemHealth.mockRejectedValue(error);

        await expect(controller.getSystemHealth(mockUser)).rejects.toThrow(error);
      });
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle null user', async () => {
      const createDto: CreateSystemSettingDto = {
        key: 'test',
        value: 'test',
        type: SettingType.STRING,
        category: SettingCategory.SYSTEM,
      };

      mockSystemAdminService.createSetting.mockRejectedValue(new Error('User is required'));

      await expect(controller.createSetting(null as any, createDto)).rejects.toThrow();
    });

    it('should handle undefined parameters', async () => {
      mockSystemAdminService.getSetting.mockRejectedValue(new Error('Key is required'));

      await expect(controller.getSetting(mockUser, undefined as any)).rejects.toThrow();
    });

    it('should handle service timeout', async () => {
      const error = new Error('Service timeout');
      mockSystemAdminService.getAllSettings.mockRejectedValue(error);

      await expect(controller.getAllSettings(mockUser)).rejects.toThrow('Service timeout');
    });

    it('should handle concurrent requests', async () => {
      const createDto: CreateSystemSettingDto = {
        key: 'concurrent',
        value: 'test',
        type: SettingType.STRING,
        category: SettingCategory.SYSTEM,
      };

      mockSystemAdminService.createSetting.mockResolvedValue({ id: '1', ...createDto });

      const promises = Array(10)
        .fill(null)
        .map(() => controller.createSetting(mockUser, createDto));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(mockSystemAdminService.createSetting).toHaveBeenCalledTimes(10);
    });
  });
});
