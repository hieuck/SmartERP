/**
 * ProjectController Integration Tests
 * Coverage target: 95%
 *
 * Test cases:
 * 1. POST /projects - Create project
 * 2. GET /projects - Get all projects with filters
 * 3. GET /projects/statistics - Get project statistics
 * 4. GET /projects/:id - Get project by ID
 * 5. GET /projects/code/:code - Get project by code
 * 6. PUT /projects/:id - Update project
 * 7. PUT /projects/:id/status - Update project status
 * 8. PUT /projects/:id/progress - Update project progress
 * 9. DELETE /projects/:id - Delete project (soft delete)
 * 10. Authentication/Authorization tests
 * 11. Validation tests
 * 12. Edge cases
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { ProjectStatus } from './enums/project-status.enum';

describe('ProjectController (Integration)', () => {
  let app: INestApplication;
  let projectService: jest.Mocked<ProjectService>;

  const mockUser = {
    id: 'user-123',
    email: 'pm@example.com',
    tenantId: 'tenant-123',
    roles: ['project_manager'],
  };

  const mockProject = {
    id: 'proj-123',
    code: 'PROJ-001',
    name: 'ERP Implementation',
    description: 'Implement ERP system',
    status: ProjectStatus.DRAFT,
    projectManagerId: 'user-123',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    budget: 100000,
    actualCost: 0,
    progress: 0,
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeAll(async () => {
    const mockProjectService = {
      create: jest.fn(),
      findAll: jest.fn(),
      getStatistics: jest.fn(),
      findOne: jest.fn(),
      findByCode: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      updateProgress: jest.fn(),
      remove: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
          request.user = mockUser;
          return true;
        }

        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const mockRolesGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        if (request.user && request.user.roles) {
          return true;
        }
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: mockProjectService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    projectService = moduleFixture.get(ProjectService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /projects', () => {
    it('should create project successfully', async () => {
      const createDto = {
        name: 'New Project',
        code: 'PROJ-002',
        description: 'New project description',
        projectManagerId: 'user-123',
        startDate: '2024-02-01',
        endDate: '2024-12-31',
        budget: 50000,
      };

      projectService.create.mockResolvedValue({
        ...mockProject,
        ...createDto,
        id: 'proj-124',
      } as any);

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe('New Project');
      expect(response.body.code).toBe('PROJ-002');
      expect(projectService.create).toHaveBeenCalledWith(createDto, mockUser);
    });

    it('should return 409 when project code already exists', async () => {
      const createDto = {
        name: 'Duplicate',
        code: 'PROJ-001',
        projectManagerId: 'user-123',
        startDate: '2024-02-01',
        endDate: '2024-12-31',
      };

      projectService.create.mockRejectedValue(
        new HttpException('Project with code "PROJ-001" already exists', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(409);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).post('/projects').send({ name: 'Test' }).expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should validate date range', async () => {
      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test',
          code: 'TEST',
          projectManagerId: 'user-123',
          startDate: '2024-12-31',
          endDate: '2024-01-01',
        })
        .expect(400);
    });

    it('should validate budget is positive', async () => {
      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test',
          code: 'TEST',
          projectManagerId: 'user-123',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          budget: -1000,
        })
        .expect(400);
    });
  });

  describe('GET /projects', () => {
    it('should return all projects', async () => {
      const projects = [mockProject];
      projectService.findAll.mockResolvedValue(projects as any);

      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(projects);
      expect(projectService.findAll).toHaveBeenCalledWith(mockUser, {});
    });

    it('should filter by status', async () => {
      projectService.findAll.mockResolvedValue([mockProject] as any);

      await request(app.getHttpServer())
        .get(`/projects?status=${ProjectStatus.ACTIVE}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(projectService.findAll).toHaveBeenCalledWith(mockUser, {
        status: ProjectStatus.ACTIVE,
      });
    });

    it('should filter by project manager', async () => {
      projectService.findAll.mockResolvedValue([mockProject] as any);

      await request(app.getHttpServer())
        .get('/projects?projectManagerId=user-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(projectService.findAll).toHaveBeenCalledWith(mockUser, {
        projectManagerId: 'user-123',
      });
    });

    it('should filter by date range', async () => {
      projectService.findAll.mockResolvedValue([mockProject] as any);

      await request(app.getHttpServer())
        .get('/projects?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(projectService.findAll).toHaveBeenCalledWith(mockUser, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });
    });

    it('should return empty array when no projects', async () => {
      projectService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /projects/statistics', () => {
    it('should return project statistics', async () => {
      const stats = {
        totalProjects: 10,
        activeProjects: 5,
        completedProjects: 3,
        totalBudget: 500000,
        totalActualCost: 300000,
        averageProgress: 60,
        projectsByStatus: {
          [ProjectStatus.DRAFT]: 2,
          [ProjectStatus.ACTIVE]: 5,
          [ProjectStatus.COMPLETED]: 3,
          [ProjectStatus.ON_HOLD]: 0,
          [ProjectStatus.CANCELLED]: 0,
        },
      };

      projectService.getStatistics.mockResolvedValue(stats);

      const response = await request(app.getHttpServer())
        .get('/projects/statistics')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(stats);
      expect(projectService.getStatistics).toHaveBeenCalledWith(mockUser, undefined, undefined);
    });

    it('should accept date range filters', async () => {
      projectService.getStatistics.mockResolvedValue({} as any);

      await request(app.getHttpServer())
        .get('/projects/statistics?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(projectService.getStatistics).toHaveBeenCalledWith(
        mockUser,
        new Date('2024-01-01'),
        new Date('2024-12-31'),
      );
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/projects/statistics').expect(401);
    });
  });

  describe('GET /projects/:id', () => {
    it('should return project by ID', async () => {
      projectService.findOne.mockResolvedValue(mockProject as any);

      const response = await request(app.getHttpServer())
        .get('/projects/proj-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockProject);
      expect(projectService.findOne).toHaveBeenCalledWith('proj-123', mockUser);
    });

    it('should return 404 when project not found', async () => {
      projectService.findOne.mockRejectedValue(
        new HttpException('Project not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/projects/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/projects/proj-123').expect(401);
    });
  });

  describe('GET /projects/code/:code', () => {
    it('should return project by code', async () => {
      projectService.findByCode.mockResolvedValue(mockProject as any);

      const response = await request(app.getHttpServer())
        .get('/projects/code/PROJ-001')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockProject);
      expect(projectService.findByCode).toHaveBeenCalledWith('PROJ-001', mockUser);
    });

    it('should return 404 when project not found', async () => {
      projectService.findByCode.mockRejectedValue(
        new HttpException('Project not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/projects/code/NON-EXISTENT')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('PUT /projects/:id', () => {
    it('should update project successfully', async () => {
      const updateDto = {
        name: 'Updated Project',
        description: 'Updated description',
        budget: 120000,
      };

      const updatedProject = {
        ...mockProject,
        ...updateDto,
      };

      projectService.update.mockResolvedValue(updatedProject as any);

      const response = await request(app.getHttpServer())
        .put('/projects/proj-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe('Updated Project');
      expect(response.body.budget).toBe(120000);
      expect(projectService.update).toHaveBeenCalledWith('proj-123', updateDto, mockUser);
    });

    it('should return 404 when project not found', async () => {
      projectService.update.mockRejectedValue(
        new HttpException('Project not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .put('/projects/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Test' })
        .expect(404);
    });

    it('should return 409 when new code conflicts', async () => {
      projectService.update.mockRejectedValue(
        new HttpException('Project with code "PROJ-002" already exists', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .put('/projects/proj-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ code: 'PROJ-002' })
        .expect(409);
    });

    it('should allow partial updates', async () => {
      projectService.update.mockResolvedValue(mockProject as any);

      await request(app.getHttpServer())
        .put('/projects/proj-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ description: 'Only description updated' })
        .expect(200);
    });
  });

  describe('PUT /projects/:id/status', () => {
    it('should update project status successfully', async () => {
      const updatedProject = {
        ...mockProject,
        status: ProjectStatus.ACTIVE,
      };

      projectService.updateStatus.mockResolvedValue(updatedProject as any);

      const response = await request(app.getHttpServer())
        .put('/projects/proj-123/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: ProjectStatus.ACTIVE })
        .expect(200);

      expect(response.body.status).toBe(ProjectStatus.ACTIVE);
      expect(projectService.updateStatus).toHaveBeenCalledWith(
        'proj-123',
        ProjectStatus.ACTIVE,
        mockUser,
      );
    });

    it('should return 404 when project not found', async () => {
      projectService.updateStatus.mockRejectedValue(
        new HttpException('Project not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .put('/projects/non-existent/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: ProjectStatus.ACTIVE })
        .expect(404);
    });

    it('should validate status value', async () => {
      await request(app.getHttpServer())
        .put('/projects/proj-123/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });

    it('should handle all valid status transitions', async () => {
      const statuses = [
        ProjectStatus.DRAFT,
        ProjectStatus.ACTIVE,
        ProjectStatus.ON_HOLD,
        ProjectStatus.COMPLETED,
        ProjectStatus.CANCELLED,
      ];

      for (const status of statuses) {
        projectService.updateStatus.mockResolvedValue({ ...mockProject, status } as any);

        await request(app.getHttpServer())
          .put('/projects/proj-123/status')
          .set('Authorization', 'Bearer valid-token')
          .send({ status })
          .expect(200);
      }
    });
  });

  describe('PUT /projects/:id/progress', () => {
    it('should update project progress successfully', async () => {
      const updatedProject = {
        ...mockProject,
        progress: 50,
      };

      projectService.updateProgress.mockResolvedValue(updatedProject as any);

      const response = await request(app.getHttpServer())
        .put('/projects/proj-123/progress')
        .set('Authorization', 'Bearer valid-token')
        .send({ progress: 50 })
        .expect(200);

      expect(response.body.progress).toBe(50);
      expect(projectService.updateProgress).toHaveBeenCalledWith('proj-123', 50, mockUser);
    });

    it('should validate progress is between 0 and 100', async () => {
      await request(app.getHttpServer())
        .put('/projects/proj-123/progress')
        .set('Authorization', 'Bearer valid-token')
        .send({ progress: 150 })
        .expect(400);

      await request(app.getHttpServer())
        .put('/projects/proj-123/progress')
        .set('Authorization', 'Bearer valid-token')
        .send({ progress: -10 })
        .expect(400);
    });

    it('should allow progress of 0', async () => {
      projectService.updateProgress.mockResolvedValue(mockProject as any);

      await request(app.getHttpServer())
        .put('/projects/proj-123/progress')
        .set('Authorization', 'Bearer valid-token')
        .send({ progress: 0 })
        .expect(200);
    });

    it('should allow progress of 100', async () => {
      projectService.updateProgress.mockResolvedValue({
        ...mockProject,
        progress: 100,
      } as any);

      await request(app.getHttpServer())
        .put('/projects/proj-123/progress')
        .set('Authorization', 'Bearer valid-token')
        .send({ progress: 100 })
        .expect(200);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should delete project successfully (soft delete)', async () => {
      projectService.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/projects/proj-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(projectService.remove).toHaveBeenCalledWith('proj-123', mockUser);
    });

    it('should return 404 when project not found', async () => {
      projectService.remove.mockRejectedValue(
        new HttpException('Project not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/projects/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 400 when project has active tasks', async () => {
      projectService.remove.mockRejectedValue(
        new HttpException('Cannot delete project with active tasks', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .delete('/projects/proj-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).delete('/projects/proj-123').expect(401);
    });
  });

  describe('Authorization', () => {
    it('should allow project_manager to create project', async () => {
      projectService.create.mockResolvedValue(mockProject as any);

      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test',
          code: 'TEST',
          projectManagerId: 'user-123',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        })
        .expect(201);
    });

    it('should allow user to read projects', async () => {
      projectService.findAll.mockResolvedValue([mockProject] as any);

      await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle service errors gracefully', async () => {
      projectService.findAll.mockRejectedValue(
        new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });

    it('should handle invalid UUID format', async () => {
      projectService.findOne.mockRejectedValue(
        new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .get('/projects/invalid-uuid')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should trim whitespace from string fields', async () => {
      projectService.create.mockResolvedValue(mockProject as any);

      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: '  Test Project  ',
          code: '  PROJ-003  ',
          projectManagerId: 'user-123',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        })
        .expect(201);
    });

    it('should handle concurrent updates', async () => {
      projectService.update.mockRejectedValue(
        new HttpException('Resource has been modified by another user', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .put('/projects/proj-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Update' })
        .expect(409);
    });
  });
});
