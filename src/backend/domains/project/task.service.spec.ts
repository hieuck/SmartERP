import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TaskService } from './task.service';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { TaskDependency, DependencyType } from './entities/task-dependency.entity';
import { Project } from './entities/project.entity';
import { User } from '../../core/user/entities/user.entity';
import { createMockUser } from '@/common/test/test-helpers';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: Repository<Task>;
  let dependencyRepository: Repository<TaskDependency>;
  let projectRepository: Repository<Project>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@example.com',
  } as User;

  const mockProject: Project = {
    id: 'project-1',
    tenantId: 'tenant-1',
    code: 'PRJ-2026-0001',
  } as Project;

  const mockTask: Task = {
    id: 'task-1',
    tenantId: 'tenant-1',
    code: 'TSK-2026-0001',
    title: 'Test Task',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    projectId: 'project-1',
    progress: 0,
    actualHours: 0,
  } as Task;

  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDependencyRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockProjectRepository = {
    findOne: jest.fn(),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(TaskDependency),
          useValue: mockDependencyRepository,
        },
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    dependencyRepository = module.get<Repository<TaskDependency>>(getRepositoryToken(TaskDependency));
    projectRepository = module.get<Repository<Project>>(getRepositoryToken(Project));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const dto = {
        title: 'New Task',
        projectId: 'project-1',
        status: TaskStatus.TODO,
      };

      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockTaskRepository.create.mockReturnValue({ ...dto, tenantId: 'tenant-1' });
      mockTaskRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(dto, mockUser, mockUser);

      expect(mockProjectRepository.findOne).toHaveBeenCalled();
      expect(mockTaskRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if project not found', async () => {
      const dto = { title: 'New Task', projectId: 'invalid-project' };
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto, mockUser, mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a task by ID', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('task-1', mockUser);

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update task status to COMPLETED and set completedDate', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.save.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.COMPLETED,
        completedDate: expect.any(Date),
        progress: 100,
      });

      const result = await service.updateStatus('task-1', TaskStatus.COMPLETED, mockUser, mockUser);

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.progress).toBe(100);
    });
  });

  describe('addDependency', () => {
    it('should add a task dependency', async () => {
      const dto = {
        taskId: 'task-1',
        dependsOnTaskId: 'task-2',
        type: DependencyType.FINISH_TO_START,
      };

      const task1 = { ...mockTask, id: 'task-1' };
      const task2 = { ...mockTask, id: 'task-2' };

      mockTaskRepository.findOne
        .mockResolvedValueOnce(task1)
        .mockResolvedValueOnce(task2);
      mockDependencyRepository.find.mockResolvedValue([]);
      mockDependencyRepository.findOne.mockResolvedValue(null);
      mockDependencyRepository.create.mockReturnValue(dto);
      mockDependencyRepository.save.mockResolvedValue({ id: 'dep-1', ...dto });

      const result = await service.addDependency(dto, mockUser, mockUser);

      expect(mockDependencyRepository.save).toHaveBeenCalled();
      expect(result.taskId).toBe('task-1');
    });

    it('should throw BadRequestException for self-dependency', async () => {
      const dto = {
        taskId: 'task-1',
        dependsOnTaskId: 'task-1',
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      await expect(service.addDependency(dto, mockUser, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if dependency already exists', async () => {
      const dto = {
        taskId: 'task-1',
        dependsOnTaskId: 'task-2',
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockDependencyRepository.find.mockResolvedValue([]);
      mockDependencyRepository.findOne.mockResolvedValue({ id: 'existing-dep' });

      await expect(service.addDependency(dto, mockUser, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeDependency', () => {
    it('should remove a task dependency', async () => {
      const dependency = { id: 'dep-1', taskId: 'task-1', dependsOnTaskId: 'task-2' };
      mockDependencyRepository.findOne.mockResolvedValue(dependency);
      mockDependencyRepository.remove.mockResolvedValue(dependency);

      await service.removeDependency('dep-1', mockUser);

      expect(mockDependencyRepository.remove).toHaveBeenCalledWith(dependency);
    });

    it('should throw NotFoundException if dependency not found', async () => {
      mockDependencyRepository.findOne.mockResolvedValue(null);

      await expect(service.removeDependency('invalid-id', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getGanttData', () => {
    it('should return Gantt chart data', async () => {
      const tasks = [
        {
          ...mockTask,
          startDate: new Date('2026-01-01'),
          dueDate: new Date('2026-01-10'),
          assignee: { email: 'user@example.com' },
          dependencies: [
            {
              dependsOnTaskId: 'task-2',
              type: DependencyType.FINISH_TO_START,
              lagDays: 0,
            },
          ],
        },
      ];

      mockTaskRepository.find.mockResolvedValue(tasks);

      const result = await service.getGanttData('project-1', mockUser);

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].id).toBe('task-1');
      expect(result.tasks[0].dependencies).toHaveLength(1);
    });
  });
});
