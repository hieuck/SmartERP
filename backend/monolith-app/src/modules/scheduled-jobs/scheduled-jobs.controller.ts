import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ScheduledJobsService, ScheduledJob } from './scheduled-jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@Controller('scheduled-jobs')
@UseGuards(JwtAuthGuard)
export class ScheduledJobsController {
  constructor(private readonly scheduledJobsService: ScheduledJobsService) {}

  @Get()
  async listJobs(@TenantId() tenantId: string): Promise<ScheduledJob[]> {
    return this.scheduledJobsService.listJobs(tenantId);
  }

  @Get(':id')
  async getJob(@Param('id') id: string): Promise<ScheduledJob | undefined> {
    return this.scheduledJobsService.getJob(id);
  }

  @Post()
  async createJob(
    @TenantId() tenantId: string,
    @Body() job: Omit<ScheduledJob, 'id'>,
  ): Promise<ScheduledJob> {
    return this.scheduledJobsService.createJob(tenantId, job);
  }

  @Put(':id')
  async updateJob(
    @Param('id') id: string,
    @Body() updates: Partial<ScheduledJob>,
  ): Promise<ScheduledJob | undefined> {
    return this.scheduledJobsService.updateJob(id, updates);
  }

  @Delete(':id')
  async deleteJob(@Param('id') id: string): Promise<void> {
    return this.scheduledJobsService.deleteJob(id);
  }

  @Post(':id/run')
  async runJob(@Param('id') id: string): Promise<void> {
    return this.scheduledJobsService.runJob(id);
  }
}
