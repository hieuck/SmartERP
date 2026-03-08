import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TimeEntry } from './entities/time-entry.entity';
import { Task } from './entities/task.entity';
import { Project } from './entities/project.entity';
import { User as UserEntity } from '../../core/user/entities/user.entity';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { User } from '@/common/security/permission.service';

/**
 * TimeTrackingService handles time entry logging and calculations
 */
@Injectable()
export class TimeTrackingService {
  constructor(
    @InjectRepository(TimeEntry)
    private readonly timeEntryRepository: Repository<TimeEntry>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /**
   * Create time entry
   */
  async create(dto: CreateTimeEntryDto, tenantId: string, user: User): Promise<TimeEntry> {
    // Verify task exists
    const task = await this.taskRepository.findOne({
      where: { id: dto.taskId, tenantId },
      relations: ['project'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${dto.taskId} not found`);
    }

    const timeEntry = this.timeEntryRepository.create({
      ...dto,
      userId: user.id,
      projectId: task.projectId,
      tenantId,
      createdBy: user.id,
      updatedBy: user.id,
    });

    const savedEntry = await this.timeEntryRepository.save(timeEntry);

    // Update task actual hours
    await this.updateTaskActualHours(dto.taskId, tenantId);

    // Update project actual hours and cost
    await this.updateProjectActualHours(task.projectId, tenantId);

    return savedEntry;
  }

  /**
   * Find time entry by ID
   */
  async findOne(id: string, tenantId: string): Promise<TimeEntry> {
    const entry = await this.timeEntryRepository.findOne({
      where: { id, tenantId },
      relations: ['user', 'task', 'project'],
    });

    if (!entry) {
      throw new NotFoundException(`Time entry with ID ${id} not found`);
    }

    return entry;
  }

  /**
   * Find all time entries with filters
   */
  async findAll(
    tenantId: string,
    filters?: {
      userId?: string;
      taskId?: string;
      projectId?: string;
      startDate?: Date;
      endDate?: Date;
      isBillable?: boolean;
    },
  ): Promise<TimeEntry[]> {
    const query = this.timeEntryRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.user', 'user')
      .leftJoinAndSelect('entry.task', 'task')
      .leftJoinAndSelect('entry.project', 'project')
      .where('entry.tenantId = :tenantId', { tenantId });

    if (filters?.userId) {
      query.andWhere('entry.userId = :userId', { userId: filters.userId });
    }

    if (filters?.taskId) {
      query.andWhere('entry.taskId = :taskId', { taskId: filters.taskId });
    }

    if (filters?.projectId) {
      query.andWhere('entry.projectId = :projectId', { projectId: filters.projectId });
    }

    if (filters?.startDate) {
      query.andWhere('entry.date >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('entry.date <= :endDate', { endDate: filters.endDate });
    }

    if (filters?.isBillable !== undefined) {
      query.andWhere('entry.isBillable = :isBillable', { isBillable: filters.isBillable });
    }

    query.orderBy('entry.date', 'DESC');
    return query.getMany();
  }

  /**
   * Update time entry
   */
  async update(
    id: string,
    hours: number,
    description: string,
    tenantId: string,
    user: User,
  ): Promise<TimeEntry> {
    if (hours <= 0 || hours > 24) {
      throw new BadRequestException('Hours must be between 0.1 and 24');
    }

    const entry = await this.findOne(id, tenantId);

    // Only allow user to update their own entries
    if (entry.userId !== user.id) {
      throw new BadRequestException('You can only update your own time entries');
    }

    entry.hours = hours;
    entry.description = description;
    entry.updatedBy = user.id;

    const savedEntry = await this.timeEntryRepository.save(entry);

    // Recalculate task and project hours
    await this.updateTaskActualHours(entry.taskId, tenantId);
    await this.updateProjectActualHours(entry.projectId, tenantId);

    return savedEntry;
  }

  /**
   * Delete time entry
   */
  async remove(id: string, tenantId: string, user: User): Promise<void> {
    const entry = await this.findOne(id, tenantId);

    // Only allow user to delete their own entries
    if (entry.userId !== user.id) {
      throw new BadRequestException('You can only delete your own time entries');
    }

    const taskId = entry.taskId;
    const projectId = entry.projectId;

    await this.timeEntryRepository.remove(entry);

    // Recalculate task and project hours
    await this.updateTaskActualHours(taskId, tenantId);
    await this.updateProjectActualHours(projectId, tenantId);
  }

  /**
   * Get total hours by task
   */
  async getTotalHoursByTask(taskId: string, tenantId: string): Promise<number> {
    const result = await this.timeEntryRepository
      .createQueryBuilder('entry')
      .select('SUM(entry.hours)', 'total')
      .where('entry.taskId = :taskId', { taskId })
      .andWhere('entry.tenantId = :tenantId', { tenantId })
      .getRawOne();

    return Number(result?.total || 0);
  }

  /**
   * Get total hours by project
   */
  async getTotalHoursByProject(projectId: string, tenantId: string): Promise<number> {
    const result = await this.timeEntryRepository
      .createQueryBuilder('entry')
      .select('SUM(entry.hours)', 'total')
      .where('entry.projectId = :projectId', { projectId })
      .andWhere('entry.tenantId = :tenantId', { tenantId })
      .getRawOne();

    return Number(result?.total || 0);
  }

  /**
   * Get total hours by user
   */
  async getTotalHoursByUser(
    userId: string,
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const query = this.timeEntryRepository
      .createQueryBuilder('entry')
      .select('SUM(entry.hours)', 'total')
      .where('entry.userId = :userId', { userId })
      .andWhere('entry.tenantId = :tenantId', { tenantId });

    if (startDate) {
      query.andWhere('entry.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('entry.date <= :endDate', { endDate });
    }

    const result = await query.getRawOne();
    return Number(result?.total || 0);
  }

  /**
   * Get billable hours
   */
  async getBillableHours(
    tenantId: string,
    filters?: {
      userId?: string;
      projectId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{ totalHours: number; totalCost: number }> {
    const query = this.timeEntryRepository
      .createQueryBuilder('entry')
      .select('SUM(entry.hours)', 'totalHours')
      .addSelect('SUM(entry.cost)', 'totalCost')
      .where('entry.tenantId = :tenantId', { tenantId })
      .andWhere('entry.isBillable = :isBillable', { isBillable: true });

    if (filters?.userId) {
      query.andWhere('entry.userId = :userId', { userId: filters.userId });
    }

    if (filters?.projectId) {
      query.andWhere('entry.projectId = :projectId', { projectId: filters.projectId });
    }

    if (filters?.startDate) {
      query.andWhere('entry.date >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('entry.date <= :endDate', { endDate: filters.endDate });
    }

    const result = await query.getRawOne();

    return {
      totalHours: Number(result?.totalHours || 0),
      totalCost: Number(result?.totalCost || 0),
    };
  }

  /**
   * Update task actual hours (internal helper)
   */
  private async updateTaskActualHours(taskId: string, tenantId: string): Promise<void> {
    const totalHours = await this.getTotalHoursByTask(taskId, tenantId);

    await this.taskRepository.update(
      { id: taskId, tenantId },
      { actualHours: totalHours },
    );
  }

  /**
   * Update project actual hours and cost (internal helper)
   */
  private async updateProjectActualHours(projectId: string, tenantId: string): Promise<void> {
    const totalHours = await this.getTotalHoursByProject(projectId, tenantId);

    // Calculate total cost
    const result = await this.timeEntryRepository
      .createQueryBuilder('entry')
      .select('SUM(entry.cost)', 'totalCost')
      .where('entry.projectId = :projectId', { projectId })
      .andWhere('entry.tenantId = :tenantId', { tenantId })
      .getRawOne();

    const totalCost = Number(result?.totalCost || 0);

    await this.projectRepository.update(
      { id: projectId, tenantId },
      { actualHours: totalHours, actualCost: totalCost },
    );
  }
}
