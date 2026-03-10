import { Injectable, Logger } from '@nestjs/common';

export interface ScheduledJob {
  id: string;
  name: string;
  schedule: string; // Cron expression
  handler: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);
  private jobs: Map<string, ScheduledJob> = new Map();

  async createJob(tenantId: string, job: Omit<ScheduledJob, 'id'>): Promise<ScheduledJob> {
    const id = `${tenantId}:${Date.now()}`;
    const newJob: ScheduledJob = {
      ...job,
      id,
    };

    this.jobs.set(id, newJob);
    this.logger.log(`Created scheduled job ${job.name} for tenant ${tenantId}`);

    // TODO: Register job with actual scheduler (node-cron, bull, etc.)

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

    const updatedJob = { ...job, ...updates };
    this.jobs.set(jobId, updatedJob);

    return updatedJob;
  }

  async deleteJob(jobId: string): Promise<void> {
    this.jobs.delete(jobId);
    // TODO: Unregister job from scheduler
  }

  async runJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    this.logger.log(`Running job ${job.name}`);

    // TODO: Execute actual job handler

    job.lastRun = new Date();
    this.jobs.set(jobId, job);
  }
}
