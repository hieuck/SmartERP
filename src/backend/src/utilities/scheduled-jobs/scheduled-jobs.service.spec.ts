import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerRegistry } from '@nestjs/schedule';
import { NotFoundException } from '@nestjs/common';
import { ScheduledJobsService, ScheduledJob } from './scheduled-jobs.service';
import { CronJob } from 'cron';

describe('ScheduledJobsService', () => {
  let service: ScheduledJobsService;
  let schedulerRegistry: jest.Mocked<SchedulerRegistry>;

  const mockJob: Omit<ScheduledJob, 'id'> = {
    name: 'Backup Job',
    schedule: '0 0 * * *',
    handler: 'backup',
    enabled: true,
  };

  const mockCronJob = {
    start: jest.fn(),
    stop: jest.fn(),
  };

  beforeEach(async () => {
    const mockSchedulerRegistry = {
      addCronJob: jest.fn(),
      deleteCronJob: jest.fn(),
      doesExist: jest.fn(),
      getCronJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledJobsService,
        { provide: SchedulerRegistry, useValue: mockSchedulerRegistry },
      ],
    }).compile();

    service = module.get<ScheduledJobsService>(ScheduledJobsService);
    schedulerRegistry = module.get(SchedulerRegistry);

    // Mock CronJob constructor
    jest.spyOn(global as any, 'CronJob' as any).mockImplementation(() => mockCronJob);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create job successfully', async () => {
      const result = await service.createJob('tenant-1', mockJob);

      expect(result).toMatchObject({
        name: mockJob.name,
        schedule: mockJob.schedule,
        handler: mockJob.handler,
        enabled: mockJob.enabled,
      });
      expect(result.id).toContain('tenant-1:');
    });

    it('should register cron job when enabled', async () => {
      await service.createJob('tenant-1', mockJob);

      expect(schedulerRegistry.addCronJob).toHaveBeenCalled();
      expect(mockCronJob.start).toHaveBeenCalled();
    });

    it('should not register cron job when disabled', async () => {
      const disabledJob = { ...mockJob, enabled: false };

      await service.createJob('tenant-1', disabledJob);

      expect(schedulerRegistry.addCronJob).not.toHaveBeenCalled();
    });
  });

  describe('listJobs', () => {
    it('should return jobs for specific tenant', async () => {
      await service.createJob('tenant-1', mockJob);
      await service.createJob('tenant-1', { ...mockJob, name: 'Job 2' });
      await service.createJob('tenant-2', { ...mockJob, name: 'Job 3' });

      const result = await service.listJobs('tenant-1');

      expect(result).toHaveLength(2);
      expect(result.every(job => job.id.startsWith('tenant-1:'))).toBe(true);
    });

    it('should return empty array when no jobs for tenant', async () => {
      const result = await service.listJobs('tenant-3');

      expect(result).toEqual([]);
    });
  });

  describe('getJob', () => {
    it('should return job by id', async () => {
      const created = await service.createJob('tenant-1', mockJob);

      const result = await service.getJob(created.id);

      expect(result).toEqual(created);
    });

    it('should return undefined when job not found', async () => {
      const result = await service.getJob('invalid-id');

      expect(result).toBeUndefined();
    });
  });

  describe('updateJob', () => {
    it('should update job successfully', async () => {
      const created = await service.createJob('tenant-1', mockJob);

      const result = await service.updateJob(created.id, { name: 'Updated Job' });

      expect(result?.name).toBe('Updated Job');
    });

    it('should unregister old cron job and register new one when enabled', async () => {
      const created = await service.createJob('tenant-1', mockJob);
      schedulerRegistry.doesExist.mockReturnValue(true);

      await service.updateJob(created.id, { schedule: '0 1 * * *' });

      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith(created.id);
      expect(schedulerRegistry.addCronJob).toHaveBeenCalled();
    });

    it('should not register cron job when disabled', async () => {
      const created = await service.createJob('tenant-1', mockJob);
      schedulerRegistry.doesExist.mockReturnValue(true);
      jest.clearAllMocks();

      await service.updateJob(created.id, { enabled: false });

      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalled();
      expect(schedulerRegistry.addCronJob).not.toHaveBeenCalled();
    });

    it('should return undefined when job not found', async () => {
      const result = await service.updateJob('invalid-id', { name: 'Test' });

      expect(result).toBeUndefined();
    });
  });

  describe('deleteJob', () => {
    it('should delete job successfully', async () => {
      const created = await service.createJob('tenant-1', mockJob);
      schedulerRegistry.doesExist.mockReturnValue(true);

      await service.deleteJob(created.id);

      const result = await service.getJob(created.id);
      expect(result).toBeUndefined();
      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith(created.id);
    });

    it('should throw NotFoundException when job not found', async () => {
      await expect(service.deleteJob('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should handle cron job not registered', async () => {
      const created = await service.createJob('tenant-1', { ...mockJob, enabled: false });
      schedulerRegistry.doesExist.mockReturnValue(false);

      await expect(service.deleteJob(created.id)).resolves.not.toThrow();
    });
  });

  describe('runJob', () => {
    it('should run job manually and update lastRun', async () => {
      const created = await service.createJob('tenant-1', mockJob);

      await service.runJob(created.id);

      const updated = await service.getJob(created.id);
      expect(updated?.lastRun).toBeDefined();
    });

    it('should throw NotFoundException when job not found', async () => {
      await expect(service.runJob('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should execute backup handler', async () => {
      const created = await service.createJob('tenant-1', { ...mockJob, handler: 'backup' });

      await expect(service.runJob(created.id)).resolves.not.toThrow();
    });

    it('should execute cleanup handler', async () => {
      const created = await service.createJob('tenant-1', { ...mockJob, handler: 'cleanup' });

      await expect(service.runJob(created.id)).resolves.not.toThrow();
    });

    it('should execute report handler', async () => {
      const created = await service.createJob('tenant-1', { ...mockJob, handler: 'report' });

      await expect(service.runJob(created.id)).resolves.not.toThrow();
    });

    it('should execute sync handler', async () => {
      const created = await service.createJob('tenant-1', { ...mockJob, handler: 'sync' });

      await expect(service.runJob(created.id)).resolves.not.toThrow();
    });

    it('should handle unknown handler', async () => {
      const created = await service.createJob('tenant-1', { ...mockJob, handler: 'unknown' });

      await expect(service.runJob(created.id)).resolves.not.toThrow();
    });
  });

  describe('registerCronJob', () => {
    it('should handle cron job registration error', async () => {
      schedulerRegistry.addCronJob.mockImplementation(() => {
        throw new Error('Registration failed');
      });

      await expect(service.createJob('tenant-1', mockJob)).rejects.toThrow('Registration failed');
    });
  });

  describe('unregisterCronJob', () => {
    it('should handle cron job unregistration error gracefully', async () => {
      const created = await service.createJob('tenant-1', mockJob);
      schedulerRegistry.doesExist.mockReturnValue(true);
      schedulerRegistry.deleteCronJob.mockImplementation(() => {
        throw new Error('Unregistration failed');
      });

      await expect(service.deleteJob(created.id)).resolves.not.toThrow();
    });
  });
});
