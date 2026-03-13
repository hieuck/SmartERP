import { User } from '@/common/security/permission.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { TaskDependency } from './entities/task-dependency.entity';
import { Task } from './entities/task.entity';
import { DependencyType } from './enums/dependency-type.enum';
import { TaskStatus } from './enums/task-status.enum';
import { CreateTaskDependencyDto } from './dto/create-task-dependency.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

/**
 * TaskService handles task CRUD, dependencies, and Gantt chart data
 */
@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskDependency)
    private readonly dependencyRepository: Repository<TaskDependency>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /**
   * Create new task
   */
  async create(dto: CreateTaskDto, tenantId: string, user: User): Promise<Task> {
    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: dto.projectId, tenantId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${dto.projectId} not found`);
    }

    // Verify parent task if provided
    if (dto.parentTaskId) {
      const parentTask = await this.taskRepository.findOne({
        where: { id: dto.parentTaskId, tenantId },
      });

      if (!parentTask) {
        throw new NotFoundException(`Parent task with ID ${dto.parentTaskId} not found`);
      }
    }

    const task = this.taskRepository.create({
      ...dto,
      tenantId,
      createdBy: user.id,
      updatedBy: user.id,
    });

    return this.taskRepository.save(task);
  }

  /**
   * Find task by ID
   */
  async findOne(id: string, tenantId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, tenantId },
      relations: ['project', 'assignee', 'parentTask', 'dependencies', 'dependentTasks'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  /**
   * Find task by code
   */
  async findByCode(code: string, tenantId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { code, tenantId },
      relations: ['project', 'assignee', 'parentTask'],
    });

    if (!task) {
      throw new NotFoundException(`Task with code ${code} not found`);
    }

    return task;
  }

  /**
   * Find all tasks with optional filters
   */
  async findAll(
    tenantId: string,
    filters?: {
      projectId?: string;
      assigneeId?: string;
      status?: TaskStatus;
      parentTaskId?: string;
    },
  ): Promise<Task[]> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.parentTask', 'parentTask')
      .where('task.tenantId = :tenantId', { tenantId });

    if (filters?.projectId) {
      query.andWhere('task.projectId = :projectId', { projectId: filters.projectId });
    }

    if (filters?.assigneeId) {
      query.andWhere('task.assigneeId = :assigneeId', { assigneeId: filters.assigneeId });
    }

    if (filters?.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters?.parentTaskId) {
      query.andWhere('task.parentTaskId = :parentTaskId', {
        parentTaskId: filters.parentTaskId,
      });
    }

    query.orderBy('task.createdAt', 'DESC');
    return query.getMany();
  }

  /**
   * Update task
   */
  async update(id: string, dto: UpdateTaskDto, tenantId: string, user: User): Promise<Task> {
    const task = await this.findOne(id, tenantId);

    Object.assign(task, dto);
    task.updatedBy = user.id;

    return this.taskRepository.save(task);
  }

  /**
   * Update task status
   */
  async updateStatus(id: string, status: TaskStatus, tenantId: string, user: User): Promise<Task> {
    const task = await this.findOne(id, tenantId);

    task.status = status;
    task.updatedBy = user.id;

    // Auto-set completed date
    if (status === TaskStatus.COMPLETED && !task.completedDate) {
      task.completedDate = new Date();
      task.progress = 100;
    }

    return this.taskRepository.save(task);
  }

  /**
   * Delete task (soft delete by setting status to cancelled)
   */
  async remove(id: string, tenantId: string, user: User): Promise<void> {
    const task = await this.findOne(id, tenantId);

    task.status = TaskStatus.CANCELLED;
    task.updatedBy = user.id;

    await this.taskRepository.save(task);
  }

  /**
   * Add task dependency
   */
  async addDependency(
    dto: CreateTaskDependencyDto,
    tenantId: string,
    user: User,
  ): Promise<TaskDependency> {
    // Verify both tasks exist
    const task = await this.taskRepository.findOne({
      where: { id: dto.taskId, tenantId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${dto.taskId} not found`);
    }

    const dependsOnTask = await this.taskRepository.findOne({
      where: { id: dto.dependsOnTaskId, tenantId },
    });

    if (!dependsOnTask) {
      throw new NotFoundException(`Task with ID ${dto.dependsOnTaskId} not found`);
    }

    // Prevent self-dependency
    if (dto.taskId === dto.dependsOnTaskId) {
      throw new BadRequestException('Task cannot depend on itself');
    }

    // Check for circular dependency
    const hasCircular = await this.hasCircularDependency(dto.taskId, dto.dependsOnTaskId, tenantId);

    if (hasCircular) {
      throw new BadRequestException('Circular dependency detected');
    }

    // Check if dependency already exists
    const existing = await this.dependencyRepository.findOne({
      where: {
        taskId: dto.taskId,
        dependsOnTaskId: dto.dependsOnTaskId,
        tenantId,
      },
    });

    if (existing) {
      throw new BadRequestException('Dependency already exists');
    }

    const dependency = this.dependencyRepository.create({
      ...dto,
      tenantId,
      createdBy: user.id,
    });

    return this.dependencyRepository.save(dependency);
  }

  /**
   * Remove task dependency
   */
  async removeDependency(id: string, tenantId: string): Promise<void> {
    const dependency = await this.dependencyRepository.findOne({
      where: { id, tenantId },
    });

    if (!dependency) {
      throw new NotFoundException(`Dependency with ID ${id} not found`);
    }

    await this.dependencyRepository.remove(dependency);
  }

  /**
   * Get task dependencies
   */
  async getDependencies(taskId: string, tenantId: string): Promise<TaskDependency[]> {
    return this.dependencyRepository.find({
      where: { taskId, tenantId },
      relations: ['task', 'dependsOnTask'],
    });
  }

  /**
   * Check for circular dependency
   */
  private async hasCircularDependency(
    taskId: string,
    dependsOnTaskId: string,
    tenantId: string,
    visited: Set<string> = new Set(),
  ): Promise<boolean> {
    if (visited.has(dependsOnTaskId)) {
      return dependsOnTaskId === taskId;
    }

    visited.add(dependsOnTaskId);

    const dependencies = await this.dependencyRepository.find({
      where: { taskId: dependsOnTaskId, tenantId },
    });

    for (const dep of dependencies) {
      if (await this.hasCircularDependency(taskId, dep.dependsOnTaskId, tenantId, visited)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate Gantt chart data
   */
  async getGanttData(
    projectId: string,
    tenantId: string,
  ): Promise<{
    tasks: Array<{
      id: string;
      code: string;
      title: string;
      startDate: Date | null;
      dueDate: Date | null;
      progress: number;
      assignee: string | null;
      dependencies: Array<{ taskId: string; type: DependencyType; lagDays: number }>;
    }>;
  }> {
    const tasks = await this.taskRepository.find({
      where: { projectId, tenantId },
      relations: ['assignee', 'dependencies', 'dependencies.dependsOnTask'],
      order: { startDate: 'ASC' },
    });

    const ganttTasks = tasks.map((task) => ({
      id: task.id,
      code: task.code,
      title: task.title,
      startDate: task.startDate || null,
      dueDate: task.dueDate || null,
      progress: task.progress,
      assignee: (task.assignee as any)?.email || null,
      dependencies: task.dependencies.map((dep) => ({
        taskId: dep.dependsOnTaskId,
        type: dep.type,
        lagDays: dep.lagDays,
      })),
    }));

    return { tasks: ganttTasks };
  }
}
