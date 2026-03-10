import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project, ProjectStatus } from './entities/project.entity';

/**
 * ProjectService handles project CRUD and status management
 * Refactored to use SecureRepository pattern for tenant isolation and RBAC
 */
@Injectable()
export class ProjectService {
  private readonly secureProjectRepo: SecureRepository<Project>;

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly permissionService: PermissionService,
  ) {
    // Initialize SecureRepository for automatic tenant isolation and permission checks
    this.secureProjectRepo = new SecureRepository(projectRepository, permissionService, 'Project');
  }

  /**
   * Create new project with automatic tenant isolation and permission check
   */
  async create(dto: CreateProjectDto, user: User): Promise<Project> {
    const project = this.projectRepository.create({
      ...dto,
      tenantId: user.tenantId,
      createdBy: user.id,
      updatedBy: user.id,
    });

    return this.secureProjectRepo.save(user, project);
  }

  /**
   * Find project by ID with automatic tenant isolation
   */
  async findOne(id: string, user: User): Promise<Project> {
    const project = await this.secureProjectRepo.findOne(user, {
      where: { id },
      relations: ['projectManager', 'tasks'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  /**
   * Find project by code with automatic tenant isolation
   */
  async findByCode(code: string, user: User): Promise<Project> {
    const project = await this.secureProjectRepo.findOne(user, {
      where: { code },
      relations: ['projectManager', 'tasks'],
    });

    if (!project) {
      throw new NotFoundException(`Project with code ${code} not found`);
    }

    return project;
  }

  /**
   * Find all projects with optional filters and automatic tenant isolation
   */
  async findAll(
    user: User,
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
      .where('project.tenantId = :tenantId', { tenantId: user.tenantId });

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
   * Update project with automatic permission check and audit trail
   */
  async update(id: string, dto: UpdateProjectDto, user: User): Promise<Project> {
    const project = await this.findOne(id, user);

    Object.assign(project, dto);
    project.updatedBy = user.id;

    return this.secureProjectRepo.save(user, project);
  }

  /**
   * Update project status with automatic permission check and audit trail
   */
  async updateStatus(id: string, status: ProjectStatus, user: User): Promise<Project> {
    const project = await this.findOne(id, user);

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

    return this.secureProjectRepo.save(user, project);
  }

  /**
   * Update project progress with automatic permission check and audit trail
   */
  async updateProgress(id: string, progress: number, user: User): Promise<Project> {
    if (progress < 0 || progress > 100) {
      throw new BadRequestException('Progress must be between 0 and 100');
    }

    const project = await this.findOne(id, user);

    project.progress = progress;
    project.updatedBy = user.id;

    // Auto-complete if progress reaches 100%
    if (progress === 100 && project.status !== ProjectStatus.COMPLETED) {
      project.status = ProjectStatus.COMPLETED;
      project.actualEndDate = new Date();
    }

    return this.secureProjectRepo.save(user, project);
  }

  /**
   * Delete project (soft delete by setting status to cancelled) with permission check
   */
  async remove(id: string, user: User): Promise<void> {
    const project = await this.findOne(id, user);

    project.status = ProjectStatus.CANCELLED;
    project.updatedBy = user.id;

    await this.secureProjectRepo.save(user, project);
  }

  /**
   * Get project statistics with automatic tenant isolation
   */
  async getStatistics(
    user: User,
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
      .where('project.tenantId = :tenantId', { tenantId: user.tenantId });

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
      totalProjects > 0 ? projects.reduce((sum, p) => sum + p.progress, 0) / totalProjects : 0;

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
