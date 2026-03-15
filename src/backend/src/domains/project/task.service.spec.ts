import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TaskService } from './task.service';
import { Task } from './entities/task.entity';
import { TaskDependency } from './entities/task-dependency.entity';
import { Project } from './entities/project.entity';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';
import { DependencyType } from './enums/dependency-type.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskDependencyDto } from './dto/create-task-dependency.dto';
import { User } from '@/common/security/permission.service';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let dependencyRepository: jest.Mocked<Repository<TaskDependency>>;
  let projectRepository: jest.Mocked<Repository<Project>>;

  const tenantId = 'tenant-123';
  const taskId = 'task-123';
  const projectId = 'project-123';
  const userId = 'user-123';

  const mockUser: User = {
    id: userId,
    tenantId,
    roles: ['user'],
  };

  const mockProject = {
    id: projectId,
    tenantId,
    code: 'PRJ-001',
    name: 'Test Project',
  } as Project;

  const mockTask: Task = {
    id: taskId,
    tenantId,
    code: 'TSK-2026-0001',
    title: 'Test Task',
    description: 'Test description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    projectId,
    project: mockProject,
    parentTaskId: null,
    parentTask: null,
    assigneeId: userId,
    assignee: null,
    startDate: new Date('2026-03-10'),
    dueDate: new Date('2026-03-20'),
    completedDate: null,
    estimatedHours: 40,
    actualHours: 0,
    progress: 0,
    blockedReason: null,
    dependencies: [],
    dependentTasks: [],
    timeEntries: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId,
    updatedBy: userId,
    generateCode: jest.fn(),
    validateDates: jest.fn(),
    validateProgress: jest.fn(),
    updateCompletedDate: jest.fn(),
    get isOverdue() {
      return false;
    },
    get daysRemaining() {
      return 10;
    },
    get isOverEstimate() {
      return false;
    },
  } as unknown as Task;

  const createMockQueryBuilder = () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn() as jest.Mock,
    };
    return qb as unknown as SelectQueryBuilder<Task>;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TaskDependency),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Project),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get(getRepositoryToken(Task));
    dependencyRepository = module.get(getRepositoryToken(TaskDependency));
    projectRepository = module.get(getRepositoryToken(Project));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateTaskDto = {
      title: 'Test Task',
      description: 'Test description',
      projectId,
      assigneeId: userId,
      startDate: '2026-03-10',
      dueDate: '2026-03-20',
      estimatedHours: 40,
    };

    it('should create task successfully', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);
      taskRepository.create.mockReturnValue(mockTask);
      taskRepository.save.mockResolvedValue(mockTask);

      const _result = await service.create(createDto, tenantId, mockUser);

      expect(projectRepository.findOne).toHaveBeenCalledWith({
        where: { id: projectId, tenantId },
      });
      expect(taskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          tenantId,
          createdBy: userId,
          updatedBy: userId,
        }),
      );
      expect(_result).toEqual(mockTask);
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, tenantId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create task with parent task', async () => {
      const parentTask = { ...mockTask, id: 'parent-123' };
      const dtoWithParent = { ...createDto, parentTaskId: 'parent-123' };

      projectRepository.findOne.mockResolvedValue(mockProject);
      taskRepository.findOne.mockResolvedValue(parentTask as Task);
      taskRepository.create.mockReturnValue(mockTask);
      taskRepository.save.mockResolvedValue(mockTask);

      await service.create(dtoWithParent, tenantId, mockUser);

      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'parent-123', tenantId },
      });
    });

    it('should throw NotFoundException when parent task not found', async () => {
      const dtoWithParent = { ...createDto, parentTaskId: 'invalid-parent' };

      projectRepository.findOne.mockResolvedValue(mockProject);
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dtoWithParent, tenantId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('should return task by id', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);

      const _result = await service.findOne(taskId, tenantId);

      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId, tenantId },
        relations: ['project', 'assignee', 'parentTask', 'dependencies', 'dependentTasks'],
      });
      expect(_result).toEqual(mockTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return task by code', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);

      const _result = await service.findByCode('TSK-2026-0001', tenantId);

      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'TSK-2026-0001', tenantId },
        relations: ['project', 'assignee', 'parentTask'],
      });
      expect(_result).toEqual(mockTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCode('INVALID-CODE', tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all tasks without filters', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockTask]);
      taskRepository.createQueryBuilder.mockReturnValue(qb);

      const _result = await service.findAll(tenantId);

      expect(qb.where).toHaveBeenCalledWith('task.tenantId = :tenantId', { tenantId });
      expect(qb.orderBy).toHaveBeenCalledWith('task.createdAt', 'DESC');
      expect(_result).toEqual([mockTask]);
    });

    it('should filter by projectId', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockTask]);
      taskRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(tenantId, { projectId });

      expect(qb.andWhere).toHaveBeenCalledWith('task.projectId = :projectId', { projectId });
    });

    it('should filter by assigneeId', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockTask]);
      taskRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(tenantId, { assigneeId: userId });

      expect(qb.andWhere).toHaveBeenCalledWith('task.assigneeId = :assigneeId', {
        assigneeId: userId,
      });
    });

    it('should filter by status', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockTask]);
      taskRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(tenantId, { status: TaskStatus.IN_PROGRESS });

      expect(qb.andWhere).toHaveBeenCalledWith('task.status = :status', {
        status: TaskStatus.IN_PROGRESS,
      });
    });

    it('should filter by parentTaskId', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockTask]);
      taskRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(tenantId, { parentTaskId: 'parent-123' });

      expect(qb.andWhere).toHaveBeenCalledWith('task.parentTaskId = :parentTaskId', {
        parentTaskId: 'parent-123',
      });
    });

    it('should apply multiple filters', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockTask]);
      taskRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(tenantId, {
        projectId,
        assigneeId: userId,
        status: TaskStatus.TODO,
      });

      expect(qb.andWhere).toHaveBeenCalledTimes(3);
    });
  });

  describe('update', () => {
    const updateDto: UpdateTaskDto = {
      title: 'Updated Task',
      progress: 50,
    };

    it('should update task', async () => {
      const updatedTask = { ...mockTask, ...updateDto, updatedBy: userId };
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.save.mockResolvedValue(updatedTask as Task);

      const _result = await service.update(taskId, updateDto, tenantId, mockUser);

      expect(taskRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateDto,
          updatedBy: userId,
        }),
      );
      expect(result.title).toBe('Updated Task');
      expect(result.progress).toBe(50);
    });

    it('should throw NotFoundException when task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.update('invalid-id', updateDto, tenantId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update task status', async () => {
      const updatedTask = { ...mockTask, status: TaskStatus.IN_PROGRESS };
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.save.mockResolvedValue(updatedTask as Task);

      const _result = await service.updateStatus(
        taskId,
        TaskStatus.IN_PROGRESS,
        tenantId,
        mockUser,
      );

      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should set completed date when status is COMPLETED', async () => {
      const completedTask = {
        ...mockTask,
        status: TaskStatus.COMPLETED,
        completedDate: expect.any(Date),
        progress: 100,
      };
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.save.mockResolvedValue(completedTask as Task);

      const _result = await service.updateStatus(taskId, TaskStatus.COMPLETED, tenantId, mockUser);

      expect(taskRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TaskStatus.COMPLETED,
          completedDate: expect.any(Date),
          progress: 100,
        }),
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('invalid-id', TaskStatus.COMPLETED, tenantId, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete task by setting status to CANCELLED', async () => {
      const cancelledTask = { ...mockTask, status: TaskStatus.CANCELLED };
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.save.mockResolvedValue(cancelledTask as Task);

      await service.remove(taskId, tenantId, mockUser);

      expect(taskRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TaskStatus.CANCELLED,
          updatedBy: userId,
        }),
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id', tenantId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addDependency', () => {
    const dependencyDto: CreateTaskDependencyDto = {
      taskId,
      dependsOnTaskId: 'task-456',
      type: DependencyType.FINISH_TO_START,
      lagDays: 0,
    };

    const mockDependency = {
      id: 'dep-123',
      taskId,
      dependsOnTaskId: 'task-456',
      type: DependencyType.FINISH_TO_START,
      lagDays: 0,
      tenantId,
    } as TaskDependency;

    it('should add dependency successfully', async () => {
      const dependsOnTask = { ...mockTask, id: 'task-456' };
      taskRepository.findOne
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(dependsOnTask as Task);
      dependencyRepository.findOne.mockResolvedValue(null);
      dependencyRepository.find.mockResolvedValue([]);
      dependencyRepository.create.mockReturnValue(mockDependency);
      dependencyRepository.save.mockResolvedValue(mockDependency);

      const _result = await service.addDependency(dependencyDto, tenantId, mockUser);

      expect(_result).toEqual(mockDependency);
    });

    it('should throw NotFoundException when task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.addDependency(dependencyDto, tenantId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when depends-on task not found', async () => {
      taskRepository.findOne.mockResolvedValueOnce(mockTask).mockResolvedValueOnce(null);

      await expect(service.addDependency(dependencyDto, tenantId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for self-dependency', async () => {
      const selfDependencyDto = { ...dependencyDto, dependsOnTaskId: taskId };

      taskRepository.findOne.mockResolvedValue(mockTask);

      await expect(service.addDependency(selfDependencyDto, tenantId, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when dependency already exists', async () => {
      const dependsOnTask = { ...mockTask, id: 'task-456' };
      taskRepository.findOne
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(dependsOnTask as Task);
      dependencyRepository.find.mockResolvedValue([]);
      dependencyRepository.findOne.mockResolvedValue(mockDependency);

      await expect(service.addDependency(dependencyDto, tenantId, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for circular dependency', async () => {
      const dependsOnTask = { ...mockTask, id: 'task-456' };
      taskRepository.findOne
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(dependsOnTask as Task);
      dependencyRepository.findOne.mockResolvedValue(null);
      // Mock circular dependency: task-456 depends on task-123
      dependencyRepository.find.mockResolvedValue([
        { taskId: 'task-456', dependsOnTaskId: taskId } as TaskDependency,
      ]);

      await expect(service.addDependency(dependencyDto, tenantId, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeDependency', () => {
    const mockDependency = {
      id: 'dep-123',
      taskId,
      dependsOnTaskId: 'task-456',
      tenantId,
    } as TaskDependency;

    it('should remove dependency', async () => {
      dependencyRepository.findOne.mockResolvedValue(mockDependency);
      dependencyRepository.remove.mockResolvedValue(mockDependency);

      await service.removeDependency('dep-123', tenantId);

      expect(dependencyRepository.remove).toHaveBeenCalledWith(mockDependency);
    });

    it('should throw NotFoundException when dependency not found', async () => {
      dependencyRepository.findOne.mockResolvedValue(null);

      await expect(service.removeDependency('invalid-id', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDependencies', () => {
    it('should return task dependencies', async () => {
      const dependencies = [
        {
          id: 'dep-123',
          taskId,
          dependsOnTaskId: 'task-456',
          tenantId,
        } as TaskDependency,
      ];
      dependencyRepository.find.mockResolvedValue(dependencies);

      const _result = await service.getDependencies(taskId, tenantId);

      expect(dependencyRepository.find).toHaveBeenCalledWith({
        where: { taskId, tenantId },
        relations: ['task', 'dependsOnTask'],
      });
      expect(_result).toEqual(dependencies);
    });

    it('should return empty array when no dependencies', async () => {
      dependencyRepository.find.mockResolvedValue([]);

      const _result = await service.getDependencies(taskId, tenantId);

      expect(_result).toEqual([]);
    });
  });

  describe('getGanttData', () => {
    it('should return Gantt chart data', async () => {
      const freshTask = {
        id: taskId,
        code: 'TSK-2026-0001',
        title: 'Test Task',
        startDate: new Date('2026-03-10'),
        dueDate: new Date('2026-03-20'),
        progress: 0,
        dependencies: [
          {
            id: 'dep-123',
            taskId,
            dependsOnTaskId: 'task-456',
            type: DependencyType.FINISH_TO_START,
            lagDays: 2,
          } as TaskDependency,
        ],
        assignee: { email: 'user@example.com' } as any,
      } as Task;
      taskRepository.find.mockResolvedValue([freshTask]);

      const _result = await service.getGanttData(projectId, tenantId);

      expect(taskRepository.find).toHaveBeenCalledWith({
        where: { projectId, tenantId },
        relations: ['assignee', 'dependencies', 'dependencies.dependsOnTask'],
        order: { startDate: 'ASC' },
      });
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0]).toEqual({
        id: taskId,
        code: 'TSK-2026-0001',
        title: 'Test Task',
        startDate: freshTask.startDate,
        dueDate: freshTask.dueDate,
        progress: 0,
        assignee: 'user@example.com',
        dependencies: [
          {
            taskId: 'task-456',
            type: DependencyType.FINISH_TO_START,
            lagDays: 2,
          },
        ],
      });
    });

    it('should handle tasks without assignee', async () => {
      const taskWithoutAssignee = { ...mockTask, assignee: null };
      taskRepository.find.mockResolvedValue([taskWithoutAssignee as Task]);

      const _result = await service.getGanttData(projectId, tenantId);

      expect(result.tasks[0].assignee).toBeNull();
    });

    it('should return empty array when no tasks', async () => {
      taskRepository.find.mockResolvedValue([]);

      const _result = await service.getGanttData(projectId, tenantId);

      expect(result.tasks).toEqual([]);
    });
  });
});
