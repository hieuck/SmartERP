import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerRegistry } from '@nestjs/schedule';
import { NotFoundException } from '@nestjs/common';
import { ScheduledJobsService, ScheduledJob } from './scheduled-jobs.service';
import { CronJob } from 'cron';

describe('ScheduledJobsService', () => {
  let service: ScheduledJobsService;
  let schedulerRegistry: jest.Mocked<SchedulerRegistry>;
  const mockCronJob = { start: jest.fn(), stop: jest.fn() };

  beforeEach(async () => {
    const mockSchedulerRegistry = {
      addCronJob: jest.fn(),
      deleteCronJob: jest.fn(),
      doesExist: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledJobsService,
        { provide: SchedulerRegistry, useValue: mockSchedulerRegistry },
      ],
    }).compile();

    service = module.get<ScheduledJobsService>(ScheduledJobsService);
    schedulerRegistry = module.get(SchedulerRegistry);
    jest.spyOn(CronJob, 'from').mockReturnValue(mockCronJob as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create job with generated ID', async () => {
      const jobData: Omit<ScheduledJob, 'id'> = {
        name: 'Daily Backup',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: false,
      };

      const result = await service.createJob('tenant1', jobData);

      expect(result).toMatchObject(jobData);
      expect(result.id).toMatch(/^tenant1:\d+$/);
    });

    it('should register cron job when enabled is true', async () => {
      const jobData: Omit<ScheduledJob, 'id'> = {
        name: 'Hourly Sync',
        schedule: '0 * * * *',
        handler: 'sync',
        enabled: true,
      };

      await service.createJob('tenant1', jobData);

      expect(CronJob.from).toHaveBeenCalledWith(
        expect.objectContaining({
          cronTime: '0 * * * *',
        }),
      );
      expect(schedulerRegistry.addCronJob).toHaveBeenCalled();
      expect(mockCronJob.start).toHaveBeenCalled();
    });

    it('should not register cron job when enabled is false', async () => {
      const jobData: Omit<ScheduledJob, 'id'> = {
        name: 'Manual Job',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: false,
      };

      await service.createJob('tenant1', jobData);

      expect(CronJob.from).not.toHaveBeenCalled();
      expect(schedulerRegistry.addCronJob).not.toHaveBeenCalled();
    });

    it('should handle invalid cron expression', async () => {
      const jobData: Omit<ScheduledJob, 'id'> = {
        name: 'Invalid Job',
        schedule: 'invalid-cron',
        handler: 'backup',
        enabled: true,
      };

      jest.spyOn(CronJob, 'from').mockImplementation(() => {
        throw new Error('Invalid cron expression');
      });

      await expect(service.createJob('tenant1', jobData)).rejects.toThrow(
        'Invalid cron expression',
      );
    });
  });

  describe('listJobs', () => {
    it('should return jobs for specific tenant', async () => {
      // Mock Date.now() to ensure unique IDs
      let mockTime = 1000;
      jest.spyOn(Date, 'now').mockImplementation(() => mockTime++);

      // Create jobs for tenant1
      await service.createJob('tenant1', {
        name: 'Job 1',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: false,
      });
      await service.createJob('tenant1', {
        name: 'Job 2',
        schedule: '0 1 * * *',
        handler: 'cleanup',
        enabled: false,
      });

      // Create job for tenant2
      await service.createJob('tenant2', {
        name: 'Job 3',
        schedule: '0 2 * * *',
        handler: 'report',
        enabled: false,
      });

      // Verify tenant1 has 2 jobs
      const tenant1Jobs = await service.listJobs('tenant1');
      expect(tenant1Jobs.length).toBe(2);
      expect(tenant1Jobs.some((j) => j.name === 'Job 1')).toBe(true);
      expect(tenant1Jobs.some((j) => j.name === 'Job 2')).toBe(true);

      // Verify tenant2 has 1 job
      const tenant2Jobs = await service.listJobs('tenant2');
      expect(tenant2Jobs.length).toBe(1);
      expect(tenant2Jobs[0].name).toBe('Job 3');

      // Restore Date.now()
      jest.restoreAllMocks();
    });

    it('should return empty array when tenant has no jobs', async () => {
      const jobs = await service.listJobs('nonexistent-tenant');
      expect(jobs).toEqual([]);
    });

    it('should isolate jobs between tenants', async () => {
      await service.createJob('tenant-a', {
        name: 'Job A',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: false,
      });
      await service.createJob('tenant-b', {
        name: 'Job B',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: false,
      });

      const tenantAJobs = await service.listJobs('tenant-a');
      const tenantBJobs = await service.listJobs('tenant-b');

      expect(tenantAJobs.length).toBe(1);
      expect(tenantBJobs.length).toBe(1);
      expect(tenantAJobs[0].name).toBe('Job A');
      expect(tenantBJobs[0].name).toBe('Job B');
    });
  });

  describe('getJob', () => {
    it('should return job by ID', async () => {
      const created = await service.createJob('tenant1', {
        name: 'Test Job',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: false,
      });

      const found = await service.getJob(created.id);

      expect(found).toEqual(created);
    });

    it('should return undefined for non-existent job', async () => {
      const found = await service.getJob('nonexistent-id');
      expect(found).toBeUndefined();
    });
  });

  describe('updateJob', () => {
    it('should update job properties', async () => {
      const created = await service.createJob('tenant1', {
        name: 'Original Name',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: false,
      });

      const updated = await service.updateJob(created.id, {
        name: 'Updated Name',
        schedule: '0 1 * * *',
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.schedule).toBe('0 1 * * *');
      expect(updated?.handler).toBe('backup');
    });

    it('should unregister and re-register cron job when updating enabled job', async () => {
      schedulerRegistry.doesExist.mockReturnValue(true);

      const created = await service.createJob('tenant1', {
        name: 'Job',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: true,
      });

      jest.clearAllMocks();

      await service.updateJob(created.id, { schedule: '0 1 * * *' });

      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith(created.id);
      expect(schedulerRegistry.addCronJob).toHaveBeenCalled();
    });

    it('should return undefined for non-existent job', async () => {
      const result = await service.updateJob('nonexistent-id', { name: 'New Name' });
      expect(result).toBeUndefined();
    });

    it('should enable job when updating enabled to true', async () => {
      const created = await service.createJob('tenant1', {
        name: 'Job',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: false,
      });

      jest.clearAllMocks();

      await service.updateJob(created.id, { enabled: true });

      expect(CronJob.from).toHaveBeenCalled();
      expect(schedulerRegistry.addCronJob).toHaveBeenCalled();
    });

    it('should disable job when updating enabled to false', async () => {
      schedulerRegistry.doesExist.mockReturnValue(true);

      const created = await service.createJob('tenant1', {
        name: 'Job',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: true,
      });

      jest.clearAllMocks();

      await service.updateJob(created.id, { enabled: false });

      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith(created.id);
      expect(CronJob.from).not.toHaveBeenCalled();
    });
  });

  describe('deleteJob', () => {
    it('should delete job and unregister cron', async () => {
      schedulerRegistry.doesExist.mockReturnValue(true);

      const created = await service.createJob('tenant1', {
        name: 'Job',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: true,
      });

      jest.clearAllMocks();

      await service.deleteJob(created.id);

      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith(created.id);

      const found = await service.getJob(created.id);
      expect(found).toBeUndefined();
    });

    it('should throw NotFoundException for non-existent job', async () => {
      await expect(service.deleteJob('nonexistent-id')).rejects.toThrow(NotFoundException);
      await expect(service.deleteJob('nonexistent-id')).rejects.toThrow(
        'Job nonexistent-id not found',
      );
    });
  });

  describe('runJob', () => {
    it('should execute job handler and update lastRun', async () => {
      const created = await service.createJob('tenant1', {
        name: 'Backup Job',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: false,
      });

      const beforeRun = created.lastRun;

      await service.runJob(created.id);

      const afterRun = await service.getJob(created.id);
      expect(afterRun?.lastRun).toBeDefined();
      expect(afterRun?.lastRun).not.toBe(beforeRun);
    });

    it('should throw NotFoundException for non-existent job', async () => {
      await expect(service.runJob('nonexistent-id')).rejects.toThrow(NotFoundException);
      await expect(service.runJob('nonexistent-id')).rejects.toThrow(
        'Job nonexistent-id not found',
      );
    });

    it('should execute backup handler', async () => {
      const created = await service.createJob('tenant1', {
        name: 'Backup',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: false,
      });

      await expect(service.runJob(created.id)).resolves.not.toThrow();
    });

    it('should execute cleanup handler', async () => {
      const created = await service.createJob('tenant1', {
        name: 'Cleanup',
        schedule: '0 0 * * *',
        handler: 'cleanup',
        enabled: false,
      });

      await expect(service.runJob(created.id)).resolves.not.toThrow();
    });

    it('should execute report handler', async () => {
      const created = await service.createJob('tenant1', {
        name: 'Report',
        schedule: '0 0 * * *',
        handler: 'report',
        enabled: false,
      });

      await expect(service.runJob(created.id)).resolves.not.toThrow();
    });

    it('should execute sync handler', async () => {
      const created = await service.createJob('tenant1', {
        name: 'Sync',
        schedule: '0 0 * * *',
        handler: 'sync',
        enabled: false,
      });

      await expect(service.runJob(created.id)).resolves.not.toThrow();
    });

    it('should handle unknown handler gracefully', async () => {
      const created = await service.createJob('tenant1', {
        name: 'Unknown',
        schedule: '0 0 * * *',
        handler: 'unknown-handler',
        enabled: false,
      });

      await expect(service.runJob(created.id)).resolves.not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple tenants with same job names', async () => {
      const job1 = await service.createJob('tenant1', {
        name: 'Daily Backup',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: false,
      });

      const job2 = await service.createJob('tenant2', {
        name: 'Daily Backup',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: false,
      });

      expect(job1.id).not.toBe(job2.id);
      expect(job1.name).toBe(job2.name);

      const tenant1Jobs = await service.listJobs('tenant1');
      const tenant2Jobs = await service.listJobs('tenant2');

      expect(tenant1Jobs).toHaveLength(1);
      expect(tenant2Jobs).toHaveLength(1);
    });

    it('should handle scheduler registry errors gracefully', async () => {
      schedulerRegistry.addCronJob.mockImplementation(() => {
        throw new Error('Scheduler error');
      });

      const jobData: Omit<ScheduledJob, 'id'> = {
        name: 'Job',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: true,
      };

      await expect(service.createJob('tenant1', jobData)).rejects.toThrow('Scheduler error');
    });

    it('should handle unregister errors gracefully', async () => {
      schedulerRegistry.doesExist.mockReturnValue(true);
      schedulerRegistry.deleteCronJob.mockImplementation(() => {
        throw new Error('Delete error');
      });

      const created = await service.createJob('tenant1', {
        name: 'Job',
        schedule: '0 0 * * *',
        handler: 'backup',
        enabled: true,
      });

      // Should not throw, just log warning
      await expect(service.updateJob(created.id, { enabled: false })).resolves.toBeDefined();
    });
  });
});
