import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project, ProjectStatus, ProjectPriority } from './entities/project.entity';
import { User } from '../../core/user/entities/user.entity';
import { createMockUser } from '@/common/test/test-helpers';

describe('ProjectService', () => {
  let service: ProjectService;
  let repository: Repository<Project>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@example.com'
  } as User;

  const mockProject: Project = {
    id: 'project-1',
    tenantId: 'tenant-1',
    code: 'PRJ-2026-0001',
    name: 'Test Project',
    status: ProjectStatus.ACTIVE,
    priority: ProjectPriority.HIGH,
    progress: 50,
    actualHours: 100,
    actualCost: 5000,
    createdBy: 'user-1',
    updatedBy: 'user-1'
  } as Project;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockRepository
  },
      ]
  }).compile();

    service = module.get<ProjectService>(ProjectService);
    repository = module.get<Repository<Project>>(getRepositoryToken(Project));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const dto = {
        name: 'New Project',
        status: ProjectStatus.DRAFT,
        priority: ProjectPriority.MEDIUM
  };

      mockRepository.create.mockReturnValue({ ...dto, tenantId: 'tenant-1' });
      mockRepository.save.mockResolvedValue(mockProject);

      const result = await service.create(mockUser, dto, mockUser);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...dto,
        tenantId: 'tenant-1',
        createdBy: 'user-1',
        updatedBy: 'user-1'
  });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockProject);
    });
  });

  describe('findOne', () => {
    it('should return a project by ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockProject);

      const result = await service.findOne(mockUser, 'project-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'project-1', tenantId: 'tenant-1' },
        relations: ['projectManager', 'tasks']
  });
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return a project by code', async () => {
      mockRepository.findOne.mockResolvedValue(mockProject);

      const result = await service.findByCode('PRJ-2026-0001', mockUser);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'PRJ-2026-0001', tenantId: 'tenant-1' },
        relations: ['projectManager', 'tasks']
  });
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCode('INVALID', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all projects with filters', async () => {
      
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockUser, {
        status: ProjectStatus.ACTIVE
  });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('project.tenantId = :tenantId', {
        tenantId: 'tenant-1'
  });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('project.status = :status', {
        status: ProjectStatus.ACTIVE
  });
      expect(result).toEqual([mockProject]);
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const dto = { name: 'Updated Project' };
      mockRepository.findOne.mockResolvedValue(mockProject);
      mockRepository.save.mockResolvedValue({ ...mockProject, ...dto });

      const result = await service.update('project-1', dto, mockUser, mockUser);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Project');
    });
  });

  describe('updateStatus', () => {
    it('should update project status to ACTIVE and set actualStartDate', async () => {
      const project = { ...mockProject, actualStartDate: null };
      mockRepository.findOne.mockResolvedValue(project);
      mockRepository.save.mockResolvedValue({
        ...project,
        status: ProjectStatus.ACTIVE,
        actualStartDate: expect.any(Date)
  });

      const result = await service.updateStatus('project-1', ProjectStatus.ACTIVE, mockUser, mockUser);

      expect(result.status).toBe(ProjectStatus.ACTIVE);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update project status to COMPLETED and set progress to 100', async () => {
      mockRepository.findOne.mockResolvedValue(mockProject);
      mockRepository.save.mockResolvedValue({
        ...mockProject,
        status: ProjectStatus.COMPLETED,
        progress: 100,
        actualEndDate: expect.any(Date)
  });

      const result = await service.updateStatus('project-1', ProjectStatus.COMPLETED, mockUser, mockUser);

      expect(result.status).toBe(ProjectStatus.COMPLETED);
      expect(result.progress).toBe(100);
    });
  });

  describe('updateProgress', () => {
    it('should update project progress', async () => {
      mockRepository.findOne.mockResolvedValue(mockProject);
      mockRepository.save.mockResolvedValue({ ...mockProject, progress: 75 });

      const result = await service.updateProgress('project-1', 75, mockUser, mockUser);

      expect(result.progress).toBe(75);
    });

    it('should throw BadRequestException if progress is invalid', async () => {
      await expect(service.updateProgress('project-1', 150, mockUser, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should auto-complete project when progress reaches 100%', async () => {
      mockRepository.findOne.mockResolvedValue(mockProject);
      mockRepository.save.mockResolvedValue({
        ...mockProject,
        progress: 100,
        status: ProjectStatus.COMPLETED,
        actualEndDate: expect.any(Date)
  });

      const result = await service.updateProgress('project-1', 100, mockUser, mockUser);

      expect(result.progress).toBe(100);
      expect(result.status).toBe(ProjectStatus.COMPLETED);
    });
  });

  describe('remove', () => {
    it('should soft delete a project by setting status to CANCELLED', async () => {
      mockRepository.findOne.mockResolvedValue(mockProject);
      mockRepository.save.mockResolvedValue({
        ...mockProject,
        status: ProjectStatus.CANCELLED
  });

      await service.remove(mockUser, 'project-1', mockUser);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ProjectStatus.CANCELLED }),
      );
    });
  });

  describe('getStatistics', () => {
    it('should return project statistics', async () => {
      const projects = [
        { ...mockProject, status: ProjectStatus.ACTIVE, budget: 10000, actualCost: 5000, progress: 50 },
        { ...mockProject, id: 'project-2', status: ProjectStatus.COMPLETED, budget: 20000, actualCost: 18000, progress: 100 },
      ];

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getStatistics(mockUser);

      expect(result.totalProjects).toBe(2);
      expect(result.activeProjects).toBe(1);
      expect(result.completedProjects).toBe(1);
      expect(result.totalBudget).toBe(30000);
      expect(result.totalActualCost).toBe(23000);
      expect(result.averageProgress).toBe(75);
    });
  });
});
