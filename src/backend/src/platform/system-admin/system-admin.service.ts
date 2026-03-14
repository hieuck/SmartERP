import { PermissionService } from '@common/security/permission.service';
import { SecureRepository } from '@common/security/secure-repository';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { User } from '@core/user/entities/user.entity';
import { CreateBackgroundJobDto } from './dto/create-background-job.dto';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import { CreateErrorLogDto } from './dto/create-error-log.dto';
import { ErrorLogFiltersDto } from './dto/error-log-filters.dto';
import { UpdateErrorLogDto } from './dto/update-error-log.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { BackgroundJob } from './entities/background-job.entity';
import { ErrorLog } from './entities/error-log.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { JobStatus } from './enums';
import { SystemHealthResponse } from './interfaces/system-health.interface';

@Injectable()
export class SystemAdminService {
  private readonly secureSettingRepo: SecureRepository<SystemSetting>;
  private readonly secureJobRepo: SecureRepository<BackgroundJob>;
  private readonly secureErrorLogRepo: SecureRepository<ErrorLog>;

  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingRepository: Repository<SystemSetting>,
    @InjectRepository(BackgroundJob)
    private readonly jobRepository: Repository<BackgroundJob>,
    @InjectRepository(ErrorLog)
    private readonly errorLogRepository: Repository<ErrorLog>,
    private readonly permissionService: PermissionService,
  ) {
    this.secureSettingRepo = new SecureRepository(
      settingRepository,
      permissionService,
      'SystemSetting',
    );
    this.secureJobRepo = new SecureRepository(jobRepository, permissionService, 'BackgroundJob');
    this.secureErrorLogRepo = new SecureRepository(
      errorLogRepository,
      permissionService,
      'ErrorLog',
    );
  }

  // System Settings
  async createSetting(user: User, createDto: CreateSystemSettingDto): Promise<SystemSetting> {
    const existing = await this.secureSettingRepo.findOne(user, {
      where: { key: createDto.key },
    });

    if (existing) {
      throw new ConflictException(`Setting with key '${createDto.key}' already exists`);
    }

    const setting = {
      ...createDto,
      updatedBy: user.id,
    };

    return this.secureSettingRepo.save(user, setting);
  }

  async getSetting(user: User, key: string): Promise<SystemSetting> {
    const setting = await this.secureSettingRepo.findOne(user, {
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    return setting;
  }

  async getAllSettings(user: User, category?: string): Promise<SystemSetting[]> {
    const where: FindOptionsWhere<SystemSetting> = {};
    if (category) {
      where.category = category as any;
    }

    return this.secureSettingRepo.find(user, {
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  async updateSetting(
    user: User,
    key: string,
    updateDto: UpdateSystemSettingDto,
  ): Promise<SystemSetting> {
    const setting = await this.getSetting(user, key);

    Object.assign(setting, updateDto);
    setting.updatedBy = user.id;

    return this.secureSettingRepo.save(user, setting);
  }

  async deleteSetting(user: User, key: string): Promise<void> {
    const setting = await this.getSetting(user, key);
    await this.secureSettingRepo.remove(user, setting);
  }

  // Background Jobs
  async createJob(user: User, createDto: CreateBackgroundJobDto): Promise<BackgroundJob> {
    const job = {
      ...createDto,
      createdBy: user.id,
      scheduledAt: createDto.scheduledAt ? new Date(createDto.scheduledAt) : null,
    };

    return this.secureJobRepo.save(user, job);
  }

  async getJobById(user: User, id: string): Promise<BackgroundJob> {
    const job = await this.secureJobRepo.findOne(user, {
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID '${id}' not found`);
    }

    return job;
  }

  async getJobsByStatus(user: User, status: JobStatus): Promise<BackgroundJob[]> {
    return this.secureJobRepo.find(user, {
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllJobs(user: User): Promise<BackgroundJob[]> {
    return this.secureJobRepo.find(user, {
      order: { createdAt: 'DESC' },
    });
  }

  async updateJobStatus(
    user: User,
    id: string,
    status: JobStatus,
    result?: Record<string, any>,
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

    return this.secureJobRepo.save(user, job);
  }

  // Error Logs
  async createErrorLog(user: User, createDto: CreateErrorLogDto): Promise<ErrorLog> {
    const errorLog = {
      ...createDto,
      userId: user.id,
    };

    const saved = await this.secureErrorLogRepo.save(user, errorLog);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async getErrorLogs(user: User, filters: ErrorLogFiltersDto): Promise<ErrorLog[]> {
    // Use SecureRepository for basic filtering
    const where: FindOptionsWhere<ErrorLog> = {};

    if (filters.severity) {
      where.severity = filters.severity;
    }

    if (filters.errorType) {
      where.errorType = filters.errorType;
    }

    if (filters.resolved !== undefined) {
      where.resolved = filters.resolved;
    }

    // For simple queries, use SecureRepository
    if (!filters.limit && !filters.offset) {
      return this.secureErrorLogRepo.find(user, {
        where: Object.keys(where).length > 0 ? where : undefined,
        order: { createdAt: 'DESC' },
      });
    }

    // For complex queries with pagination, use QueryBuilder with tenant isolation
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

    if (filters.limit !== undefined) {
      queryBuilder.take(filters.limit);
    }

    if (filters.offset !== undefined) {
      queryBuilder.skip(filters.offset);
    }

    return queryBuilder.getMany();
  }

  async resolveErrorLog(user: User, id: string, updateDto: UpdateErrorLogDto): Promise<ErrorLog> {
    const errorLog = await this.secureErrorLogRepo.findOne(user, {
      where: { id },
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

    return this.secureErrorLogRepo.save(user, errorLog);
  }

  // System Health
  async getSystemHealth(user: User): Promise<SystemHealthResponse> {
    // System health queries need to count across tenant
    // Use raw repository with explicit tenant filtering
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
