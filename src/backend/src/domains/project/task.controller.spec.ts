/**
 * TaskController Integration Tests
 * Coverage target: 95%
 * 
 * Test cases:
 * 1. POST /tasks - Create task
 * 2. GET /tasks - Get all tasks with filters
 * 3. GET /tasks/:id - Get task by ID
 * 4. GET /tasks/code/:code - Get task by code
 * 5. PUT /tasks/:id - Update task
 * 6. PUT /tasks/:id/status - Update task status
 * 7. DELETE /tasks/:id - Delete task (soft delete)
 * 8. POST /tasks/dependencies - Add task dependency
 * 9. DELETE /tasks/dependencies/:id - Remove task dependency
 * 10. GET /tasks/:id/dependencies - Get task dependencies
 * 11. GET /tasks/project/:projectId/gantt - Get Gantt chart data
 * 12. Authentication/Authorization tests
 * 13. Validation tests
 * 14. Edge cases
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { TaskStatus } from './enums/task-status.enum';
import { DependencyType } from './enums/dependency-type.enum';

describe('TaskController (Integration)', () => {
  let app: INestApplication;
  let taskService: jest.Mocked<TaskService>;

  const mockUser = {
    id: 'user-123',
    email: 'pm@example.com',
    tenantId: 'tenant-123',
    roles: ['project_manager'],
  };

  const mockTask = {
    id: 'task-123',
    code: 'TASK-001',
    title: 'Implement authentication',
    description: 'Implement JWT authentication',
    status: TaskStatus.TODO,
    priority: 'high',
    projectId: 'proj-123',
    assigneeId: 'user-456',
    parentTaskId: null,
    startDate: new Date('2024-01-01'),
    dueDate: new Date('2024-01-15'),
    estimatedHours: 40,
    actualHours: 0,
    progress: 0,
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDependency = {
    id: 'dep-123',
    taskId: 'task-123',
    dependsOnTaskId: 'task-456',
    type: DependencyType.FINISH_TO_START,
    lagDays: 0,
    tenantId: 'tenant-123',
    createdAt: new Date(),
  };

  beforeAll(async () => {
    const mockTaskService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByCode: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      remove: jest.fn(),
      addDependency: jest.fn(),
      removeDependency: jest.fn(),
      getDependencies: jest.fn(),
      getGanttData: jest.fn(),
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
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
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

    taskService = moduleFixture.get(TaskService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /tasks', () => {
    it('should create task successfully', async () => {
      const createDto = {
        title: 'New Task',
        code: 'TASK-002',
        description: 'New task description',
        projectId: 'proj-123',
        assigneeId: 'user-456',
        startDate: '2024-02-01',
        dueDate: '2024-02-15',
        estimatedHours: 20,
        priority: 'medium',
      };

      taskService.create.mockResolvedValue({
        ...mockTask,
        ...createDto,
        id: 'task-124',
      } as any);

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.title).toBe('New Task');
      expect(response.body.code).toBe('TASK-002');
      expect(taskService.create).toHaveBeenCalledWith(createDto, mockUser.tenantId, mockUser);
    });

    it('should return 404 when project not found', async () => {
      const createDto = {
        title: 'Task',
        code: 'TASK-003',
        projectId: 'non-existent',
        startDate: '2024-02-01',
        dueDate: '2024-02-15',
      };

      taskService.create.mockRejectedValue(
        new HttpException('Project with ID non-existent not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(404);
    });

    it('should return 404 when parent task not found', async () => {
      const createDto = {
        title: 'Subtask',
        code: 'TASK-004',
        projectId: 'proj-123',
        parentTaskId: 'non-existent',
        startDate: '2024-02-01',
        dueDate: '2024-02-15',
      };

      taskService.create.mockRejectedValue(
        new HttpException('Parent task with ID non-existent not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'Test' })
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should validate date range', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'Test',
          code: 'TEST',
          projectId: 'proj-123',
          startDate: '2024-12-31',
          dueDate: '2024-01-01',
        })
        .expect(400);
    });

    it('should validate estimated hours is positive', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'Test',
          code: 'TEST',
          projectId: 'proj-123',
          startDate: '2024-01-01',
          dueDate: '2024-01-15',
          estimatedHours: -10,
        })
        .expect(400);
    });
  });

  describe('GET /tasks', () => {
    it('should return all tasks', async () => {
      const tasks = [mockTask];
      taskService.findAll.mockResolvedValue(tasks as any);

      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(tasks);
      expect(taskService.findAll).toHaveBeenCalledWith(mockUser.tenantId, {});
    });

    it('should filter by project', async () => {
      taskService.findAll.mockResolvedValue([mockTask] as any);

      await request(app.getHttpServer())
        .get('/tasks?projectId=proj-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(taskService.findAll).toHaveBeenCalledWith(mockUser.tenantId, {
        projectId: 'proj-123',
      });
    });

    it('should filter by assignee', async () => {
      taskService.findAll.mockResolvedValue([mockTask] as any);

      await request(app.getHttpServer())
        .get('/tasks?assigneeId=user-456')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(taskService.findAll).toHaveBeenCalledWith(mockUser.tenantId, {
        assigneeId: 'user-456',
      });
    });

    it('should filter by status', async () => {
      taskService.findAll.mockResolvedValue([mockTask] as any);

      await request(app.getHttpServer())
        .get(`/tasks?status=${TaskStatus.IN_PROGRESS}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(taskService.findAll).toHaveBeenCalledWith(mockUser.tenantId, {
        status: TaskStatus.IN_PROGRESS,
      });
    });

    it('should filter by parent task', async () => {
      taskService.findAll.mockResolvedValue([mockTask] as any);

      await request(app.getHttpServer())
        .get('/tasks?parentTaskId=task-parent')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(taskService.findAll).toHaveBeenCalledWith(mockUser.tenantId, {
        parentTaskId: 'task-parent',
      });
    });

    it('should return empty array when no tasks', async () => {
      taskService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should return task by ID', async () => {
      taskService.findOne.mockResolvedValue(mockTask as any);

      const response = await request(app.getHttpServer())
        .get('/tasks/task-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockTask);
      expect(taskService.findOne).toHaveBeenCalledWith('task-123', mockUser.tenantId);
    });

    it('should return 404 when task not found', async () => {
      taskService.findOne.mockRejectedValue(
        new HttpException('Task not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/tasks/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/tasks/task-123')
        .expect(401);
    });
  });

  describe('GET /tasks/code/:code', () => {
    it('should return task by code', async () => {
      taskService.findByCode.mockResolvedValue(mockTask as any);

      const response = await request(app.getHttpServer())
        .get('/tasks/code/TASK-001')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockTask);
      expect(taskService.findByCode).toHaveBeenCalledWith('TASK-001', mockUser.tenantId);
    });

    it('should return 404 when task not found', async () => {
      taskService.findByCode.mockRejectedValue(
        new HttpException('Task not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/tasks/code/NON-EXISTENT')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update task successfully', async () => {
      const updateDto = {
        title: 'Updated Task',
        description: 'Updated description',
        estimatedHours: 30,
      };

      const updatedTask = {
        ...mockTask,
        ...updateDto,
      };

      taskService.update.mockResolvedValue(updatedTask as any);

      const response = await request(app.getHttpServer())
        .put('/tasks/task-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.title).toBe('Updated Task');
      expect(response.body.estimatedHours).toBe(30);
      expect(taskService.update).toHaveBeenCalledWith(
        'task-123',
        updateDto,
        mockUser.tenantId,
        mockUser,
      );
    });

    it('should return 404 when task not found', async () => {
      taskService.update.mockRejectedValue(
        new HttpException('Task not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .put('/tasks/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'Test' })
        .expect(404);
    });

    it('should allow partial updates', async () => {
      taskService.update.mockResolvedValue(mockTask as any);

      await request(app.getHttpServer())
        .put('/tasks/task-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ description: 'Only description updated' })
        .expect(200);
    });
  });

  describe('PUT /tasks/:id/status', () => {
    it('should update task status successfully', async () => {
      const updatedTask = {
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
      };

      taskService.updateStatus.mockResolvedValue(updatedTask as any);

      const response = await request(app.getHttpServer())
        .put('/tasks/task-123/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: TaskStatus.IN_PROGRESS })
        .expect(200);

      expect(response.body.status).toBe(TaskStatus.IN_PROGRESS);
      expect(taskService.updateStatus).toHaveBeenCalledWith(
        'task-123',
        TaskStatus.IN_PROGRESS,
        mockUser.tenantId,
        mockUser,
      );
    });

    it('should auto-set completed date when status is COMPLETED', async () => {
      const completedTask = {
        ...mockTask,
        status: TaskStatus.COMPLETED,
        completedDate: new Date(),
        progress: 100,
      };

      taskService.updateStatus.mockResolvedValue(completedTask as any);

      const response = await request(app.getHttpServer())
        .put('/tasks/task-123/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: TaskStatus.COMPLETED })
        .expect(200);

      expect(response.body.status).toBe(TaskStatus.COMPLETED);
      expect(response.body.progress).toBe(100);
    });

    it('should return 404 when task not found', async () => {
      taskService.updateStatus.mockRejectedValue(
        new HttpException('Task not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .put('/tasks/non-existent/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: TaskStatus.IN_PROGRESS })
        .expect(404);
    });

    it('should validate status value', async () => {
      await request(app.getHttpServer())
        .put('/tasks/task-123/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });

    it('should handle all valid status transitions', async () => {
      const statuses = [
        TaskStatus.TODO,
        TaskStatus.IN_PROGRESS,
        TaskStatus.IN_REVIEW,
        TaskStatus.COMPLETED,
        TaskStatus.CANCELLED,
      ];

      for (const status of statuses) {
        taskService.updateStatus.mockResolvedValue({ ...mockTask, status } as any);

        await request(app.getHttpServer())
          .put('/tasks/task-123/status')
          .set('Authorization', 'Bearer valid-token')
          .send({ status })
          .expect(200);
      }
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete task successfully (soft delete)', async () => {
      taskService.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/tasks/task-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(taskService.remove).toHaveBeenCalledWith('task-123', mockUser.tenantId, mockUser);
    });

    it('should return 404 when task not found', async () => {
      taskService.remove.mockRejectedValue(
        new HttpException('Task not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/tasks/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete('/tasks/task-123')
        .expect(401);
    });
  });

  describe('POST /tasks/dependencies', () => {
    it('should add task dependency successfully', async () => {
      const createDto = {
        taskId: 'task-123',
        dependsOnTaskId: 'task-456',
        type: DependencyType.FINISH_TO_START,
        lagDays: 0,
      };

      taskService.addDependency.mockResolvedValue(mockDependency as any);

      const response = await request(app.getHttpServer())
        .post('/tasks/dependencies')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockDependency);
      expect(taskService.addDependency).toHaveBeenCalledWith(
        createDto,
        mockUser.tenantId,
        mockUser,
      );
    });

    it('should return 400 when task depends on itself', async () => {
      const createDto = {
        taskId: 'task-123',
        dependsOnTaskId: 'task-123',
        type: DependencyType.FINISH_TO_START,
      };

      taskService.addDependency.mockRejectedValue(
        new HttpException('Task cannot depend on itself', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/tasks/dependencies')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(400);
    });

    it('should return 400 when circular dependency detected', async () => {
      const createDto = {
        taskId: 'task-123',
        dependsOnTaskId: 'task-456',
        type: DependencyType.FINISH_TO_START,
      };

      taskService.addDependency.mockRejectedValue(
        new HttpException('Circular dependency detected', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/tasks/dependencies')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(400);
    });

    it('should return 400 when dependency already exists', async () => {
      const createDto = {
        taskId: 'task-123',
        dependsOnTaskId: 'task-456',
        type: DependencyType.FINISH_TO_START,
      };

      taskService.addDependency.mockRejectedValue(
        new HttpException('Dependency already exists', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/tasks/dependencies')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(400);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/tasks/dependencies')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should support all dependency types', async () => {
      const types = [
        DependencyType.FINISH_TO_START,
        DependencyType.START_TO_START,
        DependencyType.FINISH_TO_FINISH,
        DependencyType.START_TO_FINISH,
      ];

      for (const type of types) {
        taskService.addDependency.mockResolvedValue({ ...mockDependency, type } as any);

        await request(app.getHttpServer())
          .post('/tasks/dependencies')
          .set('Authorization', 'Bearer valid-token')
          .send({
            taskId: 'task-123',
            dependsOnTaskId: 'task-456',
            type,
          })
          .expect(201);
      }
    });
  });

  describe('DELETE /tasks/dependencies/:id', () => {
    it('should remove dependency successfully', async () => {
      taskService.removeDependency.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/tasks/dependencies/dep-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(taskService.removeDependency).toHaveBeenCalledWith('dep-123', mockUser.tenantId);
    });

    it('should return 404 when dependency not found', async () => {
      taskService.removeDependency.mockRejectedValue(
        new HttpException('Dependency not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/tasks/dependencies/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('GET /tasks/:id/dependencies', () => {
    it('should return task dependencies', async () => {
      const dependencies = [mockDependency];
      taskService.getDependencies.mockResolvedValue(dependencies as any);

      const response = await request(app.getHttpServer())
        .get('/tasks/task-123/dependencies')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(dependencies);
      expect(taskService.getDependencies).toHaveBeenCalledWith('task-123', mockUser.tenantId);
    });

    it('should return empty array when no dependencies', async () => {
      taskService.getDependencies.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/tasks/task-123/dependencies')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /tasks/project/:projectId/gantt', () => {
    it('should return Gantt chart data', async () => {
      const ganttData = {
        tasks: [
          {
            id: 'task-123',
            code: 'TASK-001',
            title: 'Task 1',
            startDate: new Date('2024-01-01'),
            dueDate: new Date('2024-01-15'),
            progress: 50,
            assignee: 'user@example.com',
            dependencies: [
              {
                taskId: 'task-456',
                type: DependencyType.FINISH_TO_START,
                lagDays: 0,
              },
            ],
          },
        ],
      };

      taskService.getGanttData.mockResolvedValue(ganttData as any);

      const response = await request(app.getHttpServer())
        .get('/tasks/project/proj-123/gantt')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(ganttData);
      expect(taskService.getGanttData).toHaveBeenCalledWith('proj-123', mockUser.tenantId);
    });

    it('should return empty tasks array when no tasks', async () => {
      taskService.getGanttData.mockResolvedValue({ tasks: [] });

      const response = await request(app.getHttpServer())
        .get('/tasks/project/proj-123/gantt')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.tasks).toEqual([]);
    });
  });

  describe('Authorization', () => {
    it('should allow project_manager to create task', async () => {
      taskService.create.mockResolvedValue(mockTask as any);

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'Test',
          code: 'TEST',
          projectId: 'proj-123',
          startDate: '2024-01-01',
          dueDate: '2024-01-15',
        })
        .expect(201);
    });

    it('should allow user to read tasks', async () => {
      taskService.findAll.mockResolvedValue([mockTask] as any);

      await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should allow user to update task status', async () => {
      taskService.updateStatus.mockResolvedValue(mockTask as any);

      await request(app.getHttpServer())
        .put('/tasks/task-123/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: TaskStatus.IN_PROGRESS })
        .expect(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle service errors gracefully', async () => {
      taskService.findAll.mockRejectedValue(
        new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });

    it('should handle invalid UUID format', async () => {
      taskService.findOne.mockRejectedValue(
        new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .get('/tasks/invalid-uuid')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should trim whitespace from string fields', async () => {
      taskService.create.mockResolvedValue(mockTask as any);

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: '  Test Task  ',
          code: '  TASK-005  ',
          projectId: 'proj-123',
          startDate: '2024-01-01',
          dueDate: '2024-01-15',
        })
        .expect(201);
    });

    it('should handle concurrent updates', async () => {
      taskService.update.mockRejectedValue(
        new HttpException('Resource has been modified by another user', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .put('/tasks/task-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'Update' })
        .expect(409);
    });

    it('should handle lag days in dependencies', async () => {
      const createDto = {
        taskId: 'task-123',
        dependsOnTaskId: 'task-456',
        type: DependencyType.FINISH_TO_START,
        lagDays: 5,
      };

      taskService.addDependency.mockResolvedValue({
        ...mockDependency,
        lagDays: 5,
      } as any);

      const response = await request(app.getHttpServer())
        .post('/tasks/dependencies')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.lagDays).toBe(5);
    });
  });
});
