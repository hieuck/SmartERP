import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project } from './entities/project.entity';
import { ProjectStatus } from './enums/project-status.enum';
import { PermissionService, User } from '@/common/security/permission.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let projectRepository: jest.Mocked<Repository<Project>>;
  let permissionService: jest.Mocked<PermissionService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@example.com',
    roles: ['admin'],
  } as User;

  const mockProject: Project = {
    id: 'project-1',
    code: 'PRJ-001',
    name: 'Test Project',
    description: 'Test description',
    status: ProjectStatus.DRAFT,
    projectManagerId: 'manager-1',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    actualStartDate: null,
    actualEndDate: null,
    budget: 100000,
    actualCost: 0,
    progress: 0,
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    updatedBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Project;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      })),
    };

    const mockPermission = {
      canRead: jest.fn().mockReturnValue(true),
      canWrite: jest.fn().mockReturnValue(true),
      canDelete: jest.fn().mockReturnValue(true),
      buildSecureQuery: jest.fn((user, baseWhere) => ({
        ...baseWhere,
        tenantId: user.tenantId,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockRepo,
        },
        {
          provide: PermissionService,
          useValue: mockPermission,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    projectRepository = module.get(getRepositoryToken(Project));
    permissionService = module.get(PermissionService);
    void permissionService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create new project', async () => {
      const createDto = {
        name: 'Test Project',
        description: 'Test',
        projectManagerId: 'manager-1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budget: 100000,
      };

      projectRepository.create.mockReturnValue(mockProject);
      projectRepository.save.mockResolvedValue(mockProject);

      const result = await service.create(createDto, mockUser);

      expect(result).toEqual(mockProject);
      expect(projectRepository.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return project by id', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);

      const result = await service.findOne('project-1', mockUser);

      expect(result).toEqual(mockProject);
      expect(projectRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        relations: ['projectManager', 'tasks'],
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return project by code', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);

      const result = await service.findByCode('PRJ-001', mockUser);

      expect(result).toEqual(mockProject);
      expect(projectRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'PRJ-001' },
        relations: ['projectManager', 'tasks'],
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCode('INVALID', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      const projects = [mockProject];
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(projects),
      };
      projectRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findAll(mockUser);

      expect(result).toEqual(projects);
    });

    it('should filter by status', async () => {
      const projects = [mockProject];
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(projects),
      };
      projectRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findAll(mockUser, { status: ProjectStatus.DRAFT });

      expect(result).toEqual(projects);
    });
  });

  describe('update', () => {
    it('should update project', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);
      const updated = { ...mockProject, name: 'Updated Name' } as any;
      projectRepository.save.mockResolvedValue(updated);

      const result = await service.update('project-1', { name: 'Updated Name' }, mockUser);

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('updateStatus', () => {
    it('should update project status to ACTIVE', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);
      const updated = {
        ...mockProject,
        status: ProjectStatus.ACTIVE,
        actualStartDate: expect.any(Date),
      } as any;
      projectRepository.save.mockResolvedValue(updated);

      const result = await service.updateStatus('project-1', ProjectStatus.ACTIVE, mockUser);

      expect(result.status).toBe(ProjectStatus.ACTIVE);
      expect(result.actualStartDate).toBeDefined();
    });

    it('should update project status to COMPLETED', async () => {
      const activeProject = { ...mockProject, status: ProjectStatus.ACTIVE } as any;
      projectRepository.findOne.mockResolvedValue(activeProject);
      const updated = {
        ...activeProject,
        status: ProjectStatus.COMPLETED,
        actualEndDate: expect.any(Date),
        progress: 100,
      } as any;
      projectRepository.save.mockResolvedValue(updated);

      const result = await service.updateStatus('project-1', ProjectStatus.COMPLETED, mockUser);

      expect(result.status).toBe(ProjectStatus.COMPLETED);
      expect(result.actualEndDate).toBeDefined();
      expect(result.progress).toBe(100);
    });
  });

  describe('updateProgress', () => {
    it('should update project progress', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);
      const updated = { ...mockProject, progress: 50 } as any;
      projectRepository.save.mockResolvedValue(updated);

      const result = await service.updateProgress('project-1', 50, mockUser);

      expect(result.progress).toBe(50);
    });

    it('should throw BadRequestException when progress < 0', async () => {
      await expect(service.updateProgress('project-1', -10, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when progress > 100', async () => {
      await expect(service.updateProgress('project-1', 150, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should auto-complete project when progress reaches 100%', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);
      const updated = {
        ...mockProject,
        progress: 100,
        status: ProjectStatus.COMPLETED,
        actualEndDate: expect.any(Date),
      } as any;
      projectRepository.save.mockResolvedValue(updated);

      const result = await service.updateProgress('project-1', 100, mockUser);

      expect(result.progress).toBe(100);
      expect(result.status).toBe(ProjectStatus.COMPLETED);
      expect(result.actualEndDate).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should cancel project (soft delete)', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);
      const cancelled = { ...mockProject, status: ProjectStatus.CANCELLED } as any;
      projectRepository.save.mockResolvedValue(cancelled);

      await service.remove('project-1', mockUser);

      expect(projectRepository.save).toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    it('should return project statistics', async () => {
      const projects = [
        mockProject,
        { ...mockProject, id: 'project-2', status: ProjectStatus.ACTIVE },
        { ...mockProject, id: 'project-3', status: ProjectStatus.COMPLETED },
      ];
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(projects),
      };
      projectRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getStatistics(mockUser);

      expect(result.totalProjects).toBe(3);
      expect(result.activeProjects).toBe(1);
      expect(result.completedProjects).toBe(1);
    });
  });
});
