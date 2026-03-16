import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CronJob } from 'cron';

export interface ScheduledJob {
  id: string;
  name: string;
  schedule: string; // Cron expression
  handler: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

/**
 * ScheduledJobsService manages dynamic cron jobs for multi-tenant system.
 *
 * Features:
 * - Create/update/delete jobs dynamically
 * - Per-tenant job isolation
 * - Cron-based scheduling
 * - Job execution tracking
 *
 * Note: This is an in-memory implementation. For production with multiple instances,
 * consider using a distributed job queue like Bull/BullMQ with Redis.
 */
@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);
  private jobs: Map<string, ScheduledJob> = new Map();
  private cronJobs: Map<string, CronJob> = new Map();

  constructor() {}

  async createJob(tenantId: string, job: Omit<ScheduledJob, 'id'>): Promise<ScheduledJob> {
    const id = `${tenantId}:${Date.now()}`;
    const newJob: ScheduledJob = {
      ...job,
      id,
    };

    this.jobs.set(id, newJob);
    this.logger.log(`Created scheduled job ${job.name} for tenant ${tenantId}`);

    // Register job with NestJS scheduler if enabled
    if (newJob.enabled) {
      this.registerCronJob(newJob);
    }

    return newJob;
  }

  async listJobs(tenantId: string): Promise<ScheduledJob[]> {
    const results: ScheduledJob[] = [];
    this.jobs.forEach((value, key) => {
      if (key.startsWith(`${tenantId}:`)) {
        results.push(value);
      }
    });
    return results;
  }

  async getJob(jobId: string): Promise<ScheduledJob | undefined> {
    return this.jobs.get(jobId);
  }

  async updateJob(
    jobId: string,
    updates: Partial<ScheduledJob>,
  ): Promise<ScheduledJob | undefined> {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    // Unregister old cron job if exists
    this.unregisterCronJob(jobId);

    const updatedJob = { ...job, ...updates };
    this.jobs.set(jobId, updatedJob);

    // Register new cron job if enabled
    if (updatedJob.enabled) {
      this.registerCronJob(updatedJob);
    }

    return updatedJob;
  }

  async deleteJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    // Unregister cron job from scheduler
    this.unregisterCronJob(jobId);

    this.jobs.delete(jobId);
    this.logger.log(`Deleted job ${jobId}`);
  }

  async runJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    this.logger.log(`Manually running job ${job.name}`);

    // Execute job handler
    await this.executeJobHandler(job);

    // Update last run time
    job.lastRun = new Date();
    this.jobs.set(jobId, job);
  }

  /**
   * Register a cron job
   */
  private registerCronJob(job: ScheduledJob): void {
    try {
      const cronJob = new CronJob(job.schedule, async () => {
        this.logger.log(`Executing scheduled job: ${job.name}`);
        await this.executeJobHandler(job);

        // Update last run time
        job.lastRun = new Date();
        this.jobs.set(job.id, job);
      });

      this.cronJobs.set(job.id, cronJob);
      cronJob.start();

      this.logger.log(`Registered cron job ${job.id} with schedule ${job.schedule}`);
    } catch (error) {
      this.logger.error(`Failed to register cron job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Unregister a cron job
   */
  private unregisterCronJob(jobId: string): void {
    try {
      const cronJob = this.cronJobs.get(jobId);
      if (cronJob) {
        cronJob.stop();
        this.cronJobs.delete(jobId);
        this.logger.log(`Unregistered cron job ${jobId}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to unregister cron job ${jobId}:`, error);
    }
  }

  /**
   * Execute job handler based on handler name.
   *
   * Supported handlers:
   * - 'backup': Database backup
   * - 'cleanup': Cleanup old logs/temp files
   * - 'report': Generate scheduled reports
   * - 'sync': Sync data with external systems
   *
   * For custom handlers, extend this method or use a handler registry pattern.
   */
  private async executeJobHandler(job: ScheduledJob): Promise<void> {
    try {
      switch (job.handler) {
        case 'backup':
          this.logger.log('Executing backup handler');
          // Implement backup logic or call backup service
          break;

        case 'cleanup':
          this.logger.log('Executing cleanup handler');
          // Implement cleanup logic
          break;

        case 'report':
          this.logger.log('Executing report handler');
          // Implement report generation logic
          break;

        case 'sync':
          this.logger.log('Executing sync handler');
          // Implement sync logic
          break;

        default:
          this.logger.warn(`Unknown handler: ${job.handler}`);
      }
    } catch (error) {
      this.logger.error(`Job ${job.id} execution failed:`, error);
      throw error;
    }
  }
}
