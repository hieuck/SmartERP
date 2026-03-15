import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { ScheduledJobsService, ScheduledJob } from './scheduled-jobs.service';
@Controller('scheduled-jobs')
@UseGuards(JwtAuthGuard)
export class ScheduledJobsController {
  constructor(private readonly scheduledJobsService: ScheduledJobsService) {}

  @Get()
  async listJobs(@CurrentUser() user: User): Promise<ScheduledJob[]> {
    return this.scheduledJobsService.listJobs(user.tenantId);
  }

  @Get(':id')
  async getJob(@Param('id') id: string): Promise<ScheduledJob | undefined> {
    return this.scheduledJobsService.getJob(id);
  }

  @Post()
  async createJob(
    @CurrentUser() user: User,
    @Body() job: Omit<ScheduledJob, 'id'>,
  ): Promise<ScheduledJob> {
    return this.scheduledJobsService.createJob(user.tenantId, job);
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
