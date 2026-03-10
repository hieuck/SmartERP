import { Test, TestingModule } from '@nestjs/testing';
import { ScheduledJobsService, ScheduledJob } from './scheduled-jobs.service';

describe('ScheduledJobsService', () => {
  let service: ScheduledJobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScheduledJobsService],
    }).compile();

    service = module.get<ScheduledJobsService>(ScheduledJobsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createJob', () => {
    it('should create a new scheduled job', async () => {
      const tenantId = 'tenant1';
      const jobData: Omit<ScheduledJob, 'id'> = {
        name: 'Test Job',
        schedule: '0 0 * * *',
        handler: 'testHandler',
        enabled: true,
      };

      const result = await service.createJob(tenantId, jobData);

      expect(result).toBeDefined();
      expect(result.id).toContain(tenantId);
      expect(result.name).toBe(jobData.name);
      expect(result.schedule).toBe(jobData.schedule);
      expect(result.handler).toBe(jobData.handler);
      expect(result.enabled).toBe(jobData.enabled);
    });
  });

  describe('listJobs', () => {
    it('should return jobs for specific tenant', async () => {
      const tenantId = 'tenant1';
      const jobData: Omit<ScheduledJob, 'id'> = {
        name: 'Test Job',
        schedule: '0 0 * * *',
        handler: 'testHandler',
        enabled: true,
      };

      await service.createJob(tenantId, jobData);
      // Add small delay to ensure unique timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      await service.createJob(tenantId, { ...jobData, name: 'Test Job 2' });
      await service.createJob('tenant2', { ...jobData, name: 'Other Tenant Job' });

      const result = await service.listJobs(tenantId);

      expect(result).toHaveLength(2);
      expect(result.every(job => job.id.startsWith(`${tenantId}:`))).toBe(true);
    });

    it('should return empty array when no jobs exist', async () => {
      const result = await service.listJobs('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('getJob', () => {
    it('should return a job by id', async () => {
      const tenantId = 'tenant1';
      const jobData: Omit<ScheduledJob, 'id'> = {
        name: 'Test Job',
        schedule: '0 0 * * *',
        handler: 'testHandler',
        enabled: true,
      };

      const created = await service.createJob(tenantId, jobData);
      const result = await service.getJob(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(jobData.name);
    });

    it('should return undefined for non-existent job', async () => {
      const result = await service.getJob('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('updateJob', () => {
    it('should update an existing job', async () => {
      const tenantId = 'tenant1';
      const jobData: Omit<ScheduledJob, 'id'> = {
        name: 'Test Job',
        schedule: '0 0 * * *',
        handler: 'testHandler',
        enabled: true,
      };

      const created = await service.createJob(tenantId, jobData);
      const updates = { name: 'Updated Job', enabled: false };

      const result = await service.updateJob(created.id, updates);

      expect(result).toBeDefined();
      expect(result?.name).toBe(updates.name);
      expect(result?.enabled).toBe(updates.enabled);
      expect(result?.schedule).toBe(jobData.schedule);
    });

    it('should return undefined for non-existent job', async () => {
      const result = await service.updateJob('nonexistent', { name: 'Updated' });

      expect(result).toBeUndefined();
    });
  });

  describe('deleteJob', () => {
    it('should delete a job', async () => {
      const tenantId = 'tenant1';
      const jobData: Omit<ScheduledJob, 'id'> = {
        name: 'Test Job',
        schedule: '0 0 * * *',
        handler: 'testHandler',
        enabled: true,
      };

      const created = await service.createJob(tenantId, jobData);
      await service.deleteJob(created.id);

      const result = await service.getJob(created.id);

      expect(result).toBeUndefined();
    });
  });

  describe('runJob', () => {
    it('should run a job and update lastRun', async () => {
      const tenantId = 'tenant1';
      const jobData: Omit<ScheduledJob, 'id'> = {
        name: 'Test Job',
        schedule: '0 0 * * *',
        handler: 'testHandler',
        enabled: true,
      };

      const created = await service.createJob(tenantId, jobData);
      await service.runJob(created.id);

      const result = await service.getJob(created.id);

      expect(result?.lastRun).toBeDefined();
      expect(result?.lastRun).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent job', async () => {
      await expect(service.runJob('nonexistent')).rejects.toThrow('Job nonexistent not found');
    });
  });
});
