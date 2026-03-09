import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../core/user/entities/user.entity';
import { CreateBackgroundJobDto } from './dto/create-background-job.dto';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import { UpdateErrorLogDto } from './dto/update-error-log.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { BackgroundJob, JobStatus } from './entities/background-job.entity';
import { ErrorLog } from './entities/error-log.entity';
import { SystemSetting } from './entities/system-setting.entity';

@Injectable()
export class SystemAdminService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingRepository: Repository<SystemSetting>,
    @InjectRepository(BackgroundJob)
    private readonly jobRepository: Repository<BackgroundJob>,
    @InjectRepository(ErrorLog)
    private readonly errorLogRepository: Repository<ErrorLog>,
  ) {}

  // System Settings
  async createSetting(user: User, createDto: CreateSystemSettingDto): Promise<SystemSetting> {
    const existing = await this.settingRepository.findOne({
      where: { tenantId: user.tenantId, key: createDto.key },
    });

    if (existing) {
      throw new ConflictException(`Setting with key '${createDto.key}' already exists`);
    }

    const setting = this.settingRepository.create({
      ...createDto,
      tenantId: user.tenantId,
      updatedBy: user.id,
    });

    return this.settingRepository.save(setting);
  }

  async getSetting(user: User, key: string): Promise<SystemSetting> {
    const setting = await this.settingRepository.findOne({
      where: { tenantId: user.tenantId, key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    return setting;
  }

  async getAllSettings(user: User, category?: string): Promise<SystemSetting[]> {
    const where: any = { tenantId: user.tenantId };
    if (category) {
      where.category = category;
    }

    return this.settingRepository.find({ where });
  }

  async updateSetting(
    user: User,
    key: string,
    updateDto: UpdateSystemSettingDto,
  ): Promise<SystemSetting> {
    const setting = await this.getSetting(user, key);

    Object.assign(setting, updateDto);
    setting.updatedBy = user.id;

    return this.settingRepository.save(setting);
  }

  async deleteSetting(user: User, key: string): Promise<void> {
    const setting = await this.getSetting(user, key);
    await this.settingRepository.delete(setting.id);
  }

  // Background Jobs
  async createJob(user: User, createDto: CreateBackgroundJobDto): Promise<BackgroundJob> {
    const job = this.jobRepository.create({
      ...createDto,
      tenantId: user.tenantId,
      createdBy: user.id,
      scheduledAt: createDto.scheduledAt ? new Date(createDto.scheduledAt) : null,
    });

    return this.jobRepository.save(job);
  }

  async getJobById(user: User, id: string): Promise<BackgroundJob> {
    const job = await this.jobRepository.findOne({
      where: { tenantId: user.tenantId, id },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID '${id}' not found`);
    }

    return job;
  }

  async getJobsByStatus(user: User, status: JobStatus): Promise<BackgroundJob[]> {
    return this.jobRepository.find({
      where: { tenantId: user.tenantId, status },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllJobs(user: User): Promise<BackgroundJob[]> {
    return this.jobRepository.find({
      where: { tenantId: user.tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateJobStatus(
    user: User,
    id: string,
    status: JobStatus,
    result?: any,
    errorMessage?: string,
  ): Promise<BackgroundJob> {
    const job = await this.getJobById(user, id);

    job.status = status;
    if (result) job.result = result;
    if (errorMessage) job.errorMessage = errorMessage;

    if (status === JobStatus.RUNNING && !job.startedAt) {
      job.startedAt = new Date();
    }

    if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
      job.completedAt = new Date();
      if (job.startedAt) {
        job.durationMs = job.completedAt.getTime() - job.startedAt.getTime();
      }
    }

    return this.jobRepository.save(job);
  }

  // Error Logs
  async createErrorLog(user: User, createDto: any): Promise<ErrorLog> {
    const errorLog = this.errorLogRepository.create({
      ...createDto,
      tenantId: user.tenantId,
      userId: user.id,
    });

    const saved = await this.errorLogRepository.save(errorLog);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async getErrorLogs(user: User, filters: any): Promise<ErrorLog[]> {
    const queryBuilder = this.errorLogRepository.createQueryBuilder('error_log');

    queryBuilder.where('error_log.tenantId = :tenantId', { tenantId: user.tenantId });

    if (filters.severity) {
      queryBuilder.andWhere('error_log.severity = :severity', { severity: filters.severity });
    }

    if (filters.errorType) {
      queryBuilder.andWhere('error_log.errorType = :errorType', { errorType: filters.errorType });
    }

    if (filters.resolved !== undefined) {
      queryBuilder.andWhere('error_log.resolved = :resolved', { resolved: filters.resolved });
    }

    queryBuilder.orderBy('error_log.createdAt', 'DESC');

    if (filters.limit) {
      queryBuilder.take(filters.limit);
    }

    if (filters.offset) {
      queryBuilder.skip(filters.offset);
    }

    return queryBuilder.getMany();
  }

  async resolveErrorLog(user: User, id: string, updateDto: UpdateErrorLogDto): Promise<ErrorLog> {
    const errorLog = await this.errorLogRepository.findOne({
      where: { tenantId: user.tenantId, id },
    });

    if (!errorLog) {
      throw new NotFoundException(`Error log with ID '${id}' not found`);
    }

    errorLog.resolved = updateDto.resolved;
    if (updateDto.resolution) {
      errorLog.resolution = updateDto.resolution;
    }
    if (updateDto.resolved) {
      errorLog.resolvedBy = user.id;
      errorLog.resolvedAt = new Date();
    }

    return this.errorLogRepository.save(errorLog);
  }

  // System Health
  async getSystemHealth(user: User): Promise<any> {
    const [pendingJobs, failedJobs, unresolvedErrors] = await Promise.all([
      this.jobRepository.count({
        where: { tenantId: user.tenantId, status: JobStatus.PENDING },
      }),
      this.jobRepository.count({
        where: { tenantId: user.tenantId, status: JobStatus.FAILED },
      }),
      this.errorLogRepository.count({
        where: { tenantId: user.tenantId, resolved: false },
      }),
    ]);

    return {
      status: failedJobs === 0 && unresolvedErrors === 0 ? 'healthy' : 'degraded',
      pendingJobs,
      failedJobs,
      unresolvedErrors,
      timestamp: new Date(),
    };
  }
}
