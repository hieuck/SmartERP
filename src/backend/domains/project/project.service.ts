import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import { User as UserEntity } from '../../core/user/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User } from '@/common/security/permission.service';

/**
 * ProjectService handles project CRUD and status management
 */
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /**
   * Create new project
   */
  async create(dto: CreateProjectDto, tenantId: string, user: User): Promise<Project> {
    const project = this.projectRepository.create({
      ...dto,
      tenantId,
      createdBy: user.id,
      updatedBy: user.id,
    });

    return this.projectRepository.save(project);
  }

  /**
   * Find project by ID
   */
  async findOne(id: string, tenantId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id, tenantId },
      relations: ['projectManager', 'tasks'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  /**
   * Find project by code
   */
  async findByCode(code: string, tenantId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { code, tenantId },
      relations: ['projectManager', 'tasks'],
    });

    if (!project) {
      throw new NotFoundException(`Project with code ${code} not found`);
    }

    return project;
  }

  /**
   * Find all projects with optional filters
   */
  async findAll(
    tenantId: string,
    filters?: {
      status?: ProjectStatus;
      projectManagerId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<Project[]> {
    const query = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.projectManager', 'projectManager')
      .leftJoinAndSelect('project.tasks', 'tasks')
      .where('project.tenantId = :tenantId', { tenantId });

    if (filters?.status) {
      query.andWhere('project.status = :status', { status: filters.status });
    }

    if (filters?.projectManagerId) {
      query.andWhere('project.projectManagerId = :projectManagerId', {
        projectManagerId: filters.projectManagerId,
      });
    }

    if (filters?.startDate) {
      query.andWhere('project.startDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('project.endDate <= :endDate', { endDate: filters.endDate });
    }

    query.orderBy('project.createdAt', 'DESC');
    return query.getMany();
  }

  /**
   * Update project
   */
  async update(
    id: string,
    dto: UpdateProjectDto,
    tenantId: string,
    user: User,
  ): Promise<Project> {
    const project = await this.findOne(id, tenantId);

    Object.assign(project, dto);
    project.updatedBy = user.id;

    return this.projectRepository.save(project);
  }

  /**
   * Update project status
   */
  async updateStatus(
    id: string,
    status: ProjectStatus,
    tenantId: string,
    user: User,
  ): Promise<Project> {
    const project = await this.findOne(id, tenantId);

    project.status = status;
    project.updatedBy = user.id;

    // Auto-set actual dates
    if (status === ProjectStatus.ACTIVE && !project.actualStartDate) {
      project.actualStartDate = new Date();
    }

    if (status === ProjectStatus.COMPLETED && !project.actualEndDate) {
      project.actualEndDate = new Date();
      project.progress = 100;
    }

    return this.projectRepository.save(project);
  }

  /**
   * Update project progress
   */
  async updateProgress(
    id: string,
    progress: number,
    tenantId: string,
    user: User,
  ): Promise<Project> {
    if (progress < 0 || progress > 100) {
      throw new BadRequestException('Progress must be between 0 and 100');
    }

    const project = await this.findOne(id, tenantId);

    project.progress = progress;
    project.updatedBy = user.id;

    // Auto-complete if progress reaches 100%
    if (progress === 100 && project.status !== ProjectStatus.COMPLETED) {
      project.status = ProjectStatus.COMPLETED;
      project.actualEndDate = new Date();
    }

    return this.projectRepository.save(project);
  }

  /**
   * Delete project (soft delete by setting status to cancelled)
   */
  async remove(id: string, tenantId: string, user: User): Promise<void> {
    const project = await this.findOne(id, tenantId);

    project.status = ProjectStatus.CANCELLED;
    project.updatedBy = user.id;

    await this.projectRepository.save(project);
  }

  /**
   * Get project statistics
   */
  async getStatistics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalBudget: number;
    totalActualCost: number;
    averageProgress: number;
    projectsByStatus: Record<ProjectStatus, number>;
  }> {
    const query = this.projectRepository
      .createQueryBuilder('project')
      .where('project.tenantId = :tenantId', { tenantId });

    if (startDate) {
      query.andWhere('project.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('project.createdAt <= :endDate', { endDate });
    }

    const projects = await query.getMany();

    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === ProjectStatus.ACTIVE).length;
    const completedProjects = projects.filter((p) => p.status === ProjectStatus.COMPLETED).length;
    const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
    const totalActualCost = projects.reduce((sum, p) => sum + Number(p.actualCost), 0);
    const averageProgress =
      totalProjects > 0
        ? projects.reduce((sum, p) => sum + p.progress, 0) / totalProjects
        : 0;

    const projectsByStatus = projects.reduce(
      (acc, project) => {
        acc[project.status] = (acc[project.status] || 0) + 1;
        return acc;
      },
      {} as Record<ProjectStatus, number>,
    );

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalBudget,
      totalActualCost,
      averageProgress,
      projectsByStatus,
    };
  }
}
