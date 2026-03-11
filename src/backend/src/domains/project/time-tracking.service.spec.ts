import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TimeTrackingService } from './time-tracking.service';
import { TimeEntry } from './entities/time-entry.entity';
import { Task } from './entities/task.entity';
import { Project } from './entities/project.entity';
import { User } from '../../core/user/entities/user.entity';
import { createMockUser } from '@/common/test/test-helpers';

describe('TimeTrackingService', () => {
  let service: TimeTrackingService;
  let timeEntryRepository: Repository<TimeEntry>;
  let taskRepository: Repository<Task>;
  let projectRepository: Repository<Project>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@example.com',
  } as User;

  const mockTask: Task = {
    id: 'task-1',
    tenantId: 'tenant-1',
    projectId: 'project-1',
    project: { id: 'project-1' } as Project,
  } as Task;

  const mockTimeEntry: TimeEntry = {
    id: 'entry-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    taskId: 'task-1',
    projectId: 'project-1',
    date: new Date('2026-03-07'),
    hours: 8,
    isBillable: true,
    hourlyRate: 50,
    cost: 400,
  } as TimeEntry;

  const mockTimeEntryRepository = {
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTaskRepository = {
    find: jest.fn().mockResolvedValue([]),
    save: jest.fn((data) => Promise.resolve({ id: '1', ...data })),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockProjectRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn((data) => Promise.resolve({ id: '1', ...data })),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeTrackingService,
        {
          provide: getRepositoryToken(TimeEntry),
          useValue: mockTimeEntryRepository,
        },
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
      ],
    }).compile();

    service = module.get<TimeTrackingService>(TimeTrackingService);
    timeEntryRepository = module.get<Repository<TimeEntry>>(getRepositoryToken(TimeEntry));
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    projectRepository = module.get<Repository<Project>>(getRepositoryToken(Project));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a time entry and update task/project hours', async () => {
      const dto = {
        taskId: 'task-1',
        date: '2026-03-07',
        hours: 8,
        isBillable: true,
        hourlyRate: 50,
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTimeEntryRepository.create.mockReturnValue({ ...dto, userId: 'user-1' });
      mockTimeEntryRepository.save.mockResolvedValue(mockTimeEntry);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: 8 }),
        addSelect: jest.fn().mockReturnThis(),
      };
      mockTimeEntryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.create(mockUser, dto, mockUser);

      expect(mockTaskRepository.findOne).toHaveBeenCalled();
      expect(mockTimeEntryRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTimeEntry);
    });

    it('should throw NotFoundException if task not found', async () => {
      const dto = { taskId: 'invalid-task', date: '2026-03-07', hours: 8 };
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.create(mockUser, dto, mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a time entry by ID', async () => {
      mockTimeEntryRepository.findOne.mockResolvedValue(mockTimeEntry);

      const result = await service.findOne(mockUser, 'entry-1');

      expect(result).toEqual(mockTimeEntry);
    });

    it('should throw NotFoundException if entry not found', async () => {
      mockTimeEntryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a time entry', async () => {
      mockTimeEntryRepository.findOne.mockResolvedValue(mockTimeEntry);
      mockTimeEntryRepository.save.mockResolvedValue({ ...mockTimeEntry, hours: 6 });

      const result = await service.update('entry-1', 6, 'Updated description', mockUser, mockUser);

      expect(result.hours).toBe(6);
    });

    it('should throw BadRequestException if user tries to update others entry', async () => {
      const otherUserEntry = { ...mockTimeEntry, userId: 'other-user' };
      mockTimeEntryRepository.findOne.mockResolvedValue(otherUserEntry);

      await expect(service.update('entry-1', 6, 'desc', 'tenant-1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if hours invalid', async () => {
      await expect(service.update('entry-1', 30, 'desc', 'tenant-1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a time entry', async () => {
      mockTimeEntryRepository.findOne.mockResolvedValue(mockTimeEntry);
      mockTimeEntryRepository.remove.mockResolvedValue(mockTimeEntry);

      await service.remove(mockUser, 'entry-1', mockUser);

      expect(mockTimeEntryRepository.remove).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user tries to delete others entry', async () => {
      const otherUserEntry = { ...mockTimeEntry, userId: 'other-user' };
      mockTimeEntryRepository.findOne.mockResolvedValue(otherUserEntry);

      await expect(service.remove(mockUser, 'entry-1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getTotalHoursByTask', () => {
    it('should return total hours for a task', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: 40 }),
        addSelect: jest.fn().mockReturnThis(),
      };
      mockTimeEntryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTotalHoursByTask('task-1', mockUser);

      expect(result).toBe(40);
    });
  });

  describe('getBillableHours', () => {
    it('should return billable hours summary', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ totalHours: 40, totalCost: 2000 }]),
        addSelect: jest.fn().mockReturnThis(),
      };
      mockTimeEntryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getBillableHours(mockUser, {
        projectId: 'project-1',
      });

      expect(result.totalHours).toBe(40);
      expect(result.totalCost).toBe(2000);
    });
  });
});
