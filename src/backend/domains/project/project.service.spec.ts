import { PermissionService, User } from '@/common/security/permission.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectPriority, ProjectStatus } from './entities/project.entity';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let repository: Repository<Project>;
  let permissionService: PermissionService;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@example.com',
    role: 'user',
    roles: ['user'],
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
    updatedBy: 'user-1',
  } as Project;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([mockProject]),
    getOne: jest.fn().mockResolvedValue(mockProject),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockRepository,
        },
        {
          provide: PermissionService,
          useValue: {
            canRead: jest.fn().mockReturnValue(true),
            canWrite: jest.fn().mockReturnValue(true),
            canDelete: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    repository = module.get<Repository<Project>>(getRepositoryToken(Project));
    permissionService = module.get<PermissionService>(PermissionService);

    // Mock SecureRepository methods
    jest.spyOn(service['secureProjectRepo'], 'findOne').mockResolvedValue(mockProject);
    jest.spyOn(service['secureProjectRepo'], 'find').mockResolvedValue([mockProject]);
    jest
      .spyOn(service['secureProjectRepo'], 'save')
      .mockImplementation(async (_user, data: any) => ({ ...mockProject, ...data }) as Project);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new project with tenant isolation', async () => {
      const dto = {
        name: 'New Project',
        status: ProjectStatus.DRAFT,
        priority: ProjectPriority.MEDIUM,
      };

      mockRepository.create.mockReturnValue({ ...dto, tenantId: 'tenant-1' } as Project);

      const result = await service.create(dto, mockUser);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...dto,
        tenantId: 'tenant-1',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      });
      expect(service['secureProjectRepo'].save).toHaveBeenCalledWith(mockUser, expect.any(Object));
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return a project by ID with tenant isolation', async () => {
      const result = await service.findOne('project-1', mockUser);

      expect(service['secureProjectRepo'].findOne).toHaveBeenCalledWith(mockUser, {
        where: { id: 'project-1' },
        relations: ['projectManager', 'tasks'],
      });
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project not found', async () => {
      jest.spyOn(service['secureProjectRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return a project by code with tenant isolation', async () => {
      const result = await service.findByCode('PRJ-2026-0001', mockUser);

      expect(service['secureProjectRepo'].findOne).toHaveBeenCalledWith(mockUser, {
        where: { code: 'PRJ-2026-0001' },
        relations: ['projectManager', 'tasks'],
      });
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project not found', async () => {
      jest.spyOn(service['secureProjectRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.findByCode('INVALID', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all projects with filters and tenant isolation', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProject]);

      const result = await service.findAll(mockUser, {
        status: ProjectStatus.ACTIVE,
      });

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('project');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('project.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('project.status = :status', {
        status: ProjectStatus.ACTIVE,
      });
      expect(result).toEqual([mockProject]);
    });
  });

  describe('update', () => {
    it('should update a project with permission check', async () => {
      const dto = { name: 'Updated Project' };

      const result = await service.update('project-1', dto, mockUser);

      expect(service['secureProjectRepo'].findOne).toHaveBeenCalled();
      expect(service['secureProjectRepo'].save).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          name: 'Updated Project',
          updatedBy: 'user-1',
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('updateStatus', () => {
    it('should update project status to ACTIVE and set actualStartDate', async () => {
      const project = { ...mockProject, actualStartDate: null } as Project;
      jest.spyOn(service['secureProjectRepo'], 'findOne').mockResolvedValue(project);

      const result = await service.updateStatus('project-1', ProjectStatus.ACTIVE, mockUser);

      expect(service['secureProjectRepo'].save).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          status: ProjectStatus.ACTIVE,
          actualStartDate: expect.any(Date),
        }),
      );
      expect(result).toBeDefined();
    });

    it('should update project status to COMPLETED and set progress to 100', async () => {
      const result = await service.updateStatus('project-1', ProjectStatus.COMPLETED, mockUser);

      expect(service['secureProjectRepo'].save).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          status: ProjectStatus.COMPLETED,
          progress: 100,
          actualEndDate: expect.any(Date),
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('updateProgress', () => {
    it('should update project progress', async () => {
      const result = await service.updateProgress('project-1', 75, mockUser);

      expect(service['secureProjectRepo'].save).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          progress: 75,
          updatedBy: 'user-1',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if progress is invalid', async () => {
      await expect(service.updateProgress('project-1', 150, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should auto-complete project when progress reaches 100%', async () => {
      const result = await service.updateProgress('project-1', 100, mockUser);

      expect(service['secureProjectRepo'].save).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          progress: 100,
          status: ProjectStatus.COMPLETED,
          actualEndDate: expect.any(Date),
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should soft delete a project by setting status to CANCELLED', async () => {
      await service.remove('project-1', mockUser);

      expect(service['secureProjectRepo'].save).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          status: ProjectStatus.CANCELLED,
          updatedBy: 'user-1',
        }),
      );
    });
  });

  describe('getStatistics', () => {
    it('should return project statistics with tenant isolation', async () => {
      const projects = [
        {
          ...mockProject,
          status: ProjectStatus.ACTIVE,
          budget: 10000,
          actualCost: 5000,
          progress: 50,
        },
        {
          ...mockProject,
          id: 'project-2',
          status: ProjectStatus.COMPLETED,
          budget: 20000,
          actualCost: 18000,
          progress: 100,
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(projects);

      const result = await service.getStatistics(mockUser);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('project');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('project.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(result.totalProjects).toBe(2);
      expect(result.activeProjects).toBe(1);
      expect(result.completedProjects).toBe(1);
      expect(result.totalBudget).toBe(30000);
      expect(result.totalActualCost).toBe(23000);
      expect(result.averageProgress).toBe(75);
    });
  });
});
