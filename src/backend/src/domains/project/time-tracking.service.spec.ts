import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TimeTrackingService } from './time-tracking.service';
import { TimeEntry } from './entities/time-entry.entity';
import { Task } from './entities/task.entity';
import { Project } from './entities/project.entity';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { User } from '@/common/security/permission.service';

describe('TimeTrackingService', () => {
  let service: TimeTrackingService;
  let timeEntryRepository: jest.Mocked<Repository<TimeEntry>>;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let projectRepository: jest.Mocked<Repository<Project>>;

  const tenantId = 'tenant-123';
  const userId = 'user-123';
  const taskId = 'task-123';
  const projectId = 'project-123';
  const entryId = 'entry-123';

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

  const mockTask = {
    id: taskId,
    tenantId,
    projectId,
    project: mockProject,
    code: 'TSK-001',
    title: 'Test Task',
  } as Task;

  const mockTimeEntry: TimeEntry = {
    id: entryId,
    tenantId,
    userId,
    user: null,
    taskId,
    task: mockTask,
    projectId,
    project: mockProject,
    date: new Date('2026-03-07'),
    hours: 8,
    description: 'Test work',
    isBillable: true,
    hourlyRate: 50,
    cost: 400,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId,
    updatedBy: userId,
    validateHours: jest.fn(),
    calculateCost: jest.fn(),
  } as unknown as TimeEntry;

  const createMockQueryBuilder = () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn() as jest.Mock,
      getRawOne: jest.fn() as jest.Mock,
    };
    return qb as unknown as SelectQueryBuilder<TimeEntry>;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeTrackingService,
        {
          provide: getRepositoryToken(TimeEntry),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Task),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Project),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TimeTrackingService>(TimeTrackingService);
    timeEntryRepository = module.get(getRepositoryToken(TimeEntry));
    taskRepository = module.get(getRepositoryToken(Task));
    projectRepository = module.get(getRepositoryToken(Project));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateTimeEntryDto = {
      taskId,
      date: '2026-03-07',
      hours: 8,
      description: 'Test work',
      isBillable: true,
      hourlyRate: 50,
    };

    it('should create time entry successfully', async () => {
      const freshMockEntry = { ...mockTimeEntry } as unknown as TimeEntry;
      taskRepository.findOne.mockResolvedValue(mockTask);
      timeEntryRepository.create.mockReturnValue(freshMockEntry);
      timeEntryRepository.save.mockResolvedValue(freshMockEntry);
      taskRepository.update.mockResolvedValue({ affected: 1 } as any);
      projectRepository.update.mockResolvedValue({ affected: 1 } as any);

      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue({ total: 8 });
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.create(createDto, tenantId, mockUser);

      expect(result).toEqual(freshMockEntry);
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId, tenantId },
        relations: ['project'],
      });
      expect(timeEntryRepository.create).toHaveBeenCalledWith({
        ...createDto,
        userId: mockUser.id,
        projectId: mockTask.projectId,
        tenantId,
        createdBy: mockUser.id,
        updatedBy: mockUser.id,
      });
      expect(timeEntryRepository.save).toHaveBeenCalledWith(freshMockEntry);
      expect(taskRepository.update).toHaveBeenCalled();
      expect(projectRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, tenantId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createDto, tenantId, mockUser)).rejects.toThrow(
        `Task with ID ${taskId} not found`,
      );
    });

    it('should update task actual hours after creation', async () => {
      const freshMockEntry = { ...mockTimeEntry } as unknown as TimeEntry;
      taskRepository.findOne.mockResolvedValue(mockTask);
      timeEntryRepository.create.mockReturnValue(freshMockEntry);
      timeEntryRepository.save.mockResolvedValue(freshMockEntry);
      taskRepository.update.mockResolvedValue({ affected: 1 } as any);
      projectRepository.update.mockResolvedValue({ affected: 1 } as any);

      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue({ total: 16 });
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.create(createDto, tenantId, mockUser);

      expect(taskRepository.update).toHaveBeenCalledWith(
        { id: taskId, tenantId },
        { actualHours: 16 },
      );
    });

    it('should update project actual hours and cost after creation', async () => {
      const freshMockEntry = { ...mockTimeEntry } as unknown as TimeEntry;
      taskRepository.findOne.mockResolvedValue(mockTask);
      timeEntryRepository.create.mockReturnValue(freshMockEntry);
      timeEntryRepository.save.mockResolvedValue(freshMockEntry);
      taskRepository.update.mockResolvedValue({ affected: 1 } as any);
      projectRepository.update.mockResolvedValue({ affected: 1 } as any);

      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock)
        .mockResolvedValueOnce({ total: 16 }) // getTotalHoursByTask
        .mockResolvedValueOnce({ total: 40 }) // getTotalHoursByProject
        .mockResolvedValueOnce({ totalCost: 2000 }); // project cost
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.create(createDto, tenantId, mockUser);

      expect(projectRepository.update).toHaveBeenCalledWith(
        { id: projectId, tenantId },
        { actualHours: 40, actualCost: 2000 },
      );
    });
  });

  describe('findOne', () => {
    it('should find time entry by ID', async () => {
      const freshMockEntry = { ...mockTimeEntry } as unknown as TimeEntry;
      timeEntryRepository.findOne.mockResolvedValue(freshMockEntry);

      const result = await service.findOne(entryId, tenantId);

      expect(result).toEqual(freshMockEntry);
      expect(timeEntryRepository.findOne).toHaveBeenCalledWith({
        where: { id: entryId, tenantId },
        relations: ['user', 'task', 'project'],
      });
    });

    it('should throw NotFoundException when entry not found', async () => {
      timeEntryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(entryId, tenantId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(entryId, tenantId)).rejects.toThrow(
        `Time entry with ID ${entryId} not found`,
      );
    });
  });

  describe('findAll', () => {
    it('should find all time entries without filters', async () => {
      const entries = [{ ...mockTimeEntry }, { ...mockTimeEntry, id: 'entry-456' }];
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue(entries);
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(tenantId);

      expect(result).toEqual(entries);
      expect(qb.where).toHaveBeenCalledWith('entry.tenantId = :tenantId', { tenantId });
      expect(qb.orderBy).toHaveBeenCalledWith('entry.date', 'DESC');
    });

    it('should filter by userId', async () => {
      const entries = [{ ...mockTimeEntry }];
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue(entries);
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(tenantId, { userId });

      expect(qb.andWhere).toHaveBeenCalledWith('entry.userId = :userId', { userId });
    });

    it('should filter by taskId', async () => {
      const entries = [{ ...mockTimeEntry }];
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue(entries);
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(tenantId, { taskId });

      expect(qb.andWhere).toHaveBeenCalledWith('entry.taskId = :taskId', { taskId });
    });

    it('should filter by projectId', async () => {
      const entries = [{ ...mockTimeEntry }];
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue(entries);
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(tenantId, { projectId });

      expect(qb.andWhere).toHaveBeenCalledWith('entry.projectId = :projectId', { projectId });
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-31');
      const entries = [{ ...mockTimeEntry }];
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue(entries);
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(tenantId, { startDate, endDate });

      expect(qb.andWhere).toHaveBeenCalledWith('entry.date >= :startDate', { startDate });
      expect(qb.andWhere).toHaveBeenCalledWith('entry.date <= :endDate', { endDate });
    });

    it('should filter by isBillable', async () => {
      const entries = [{ ...mockTimeEntry }];
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue(entries);
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(tenantId, { isBillable: true });

      expect(qb.andWhere).toHaveBeenCalledWith('entry.isBillable = :isBillable', {
        isBillable: true,
      });
    });

    it('should apply multiple filters', async () => {
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-31');
      const entries = [{ ...mockTimeEntry }];
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue(entries);
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(tenantId, {
        userId,
        projectId,
        startDate,
        endDate,
        isBillable: true,
      });

      expect(qb.andWhere).toHaveBeenCalledTimes(5);
    });
  });

  describe('update', () => {
    it('should update time entry successfully', async () => {
      const freshMockEntry = { ...mockTimeEntry } as unknown as TimeEntry;
      const updatedEntry = {
        ...freshMockEntry,
        hours: 6,
        description: 'Updated work',
      } as unknown as TimeEntry;
      timeEntryRepository.findOne.mockResolvedValue(freshMockEntry);
      timeEntryRepository.save.mockResolvedValue(updatedEntry);
      taskRepository.update.mockResolvedValue({ affected: 1 } as any);
      projectRepository.update.mockResolvedValue({ affected: 1 } as any);

      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue({ total: 14 });
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.update(entryId, 6, 'Updated work', tenantId, mockUser);

      expect(result.hours).toBe(6);
      expect(result.description).toBe('Updated work');
      expect(timeEntryRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid hours (zero)', async () => {
      await expect(service.update(entryId, 0, 'Test', tenantId, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(entryId, 0, 'Test', tenantId, mockUser)).rejects.toThrow(
        'Hours must be between 0.1 and 24',
      );
    });

    it('should throw BadRequestException for invalid hours (negative)', async () => {
      await expect(service.update(entryId, -5, 'Test', tenantId, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid hours (over 24)', async () => {
      await expect(service.update(entryId, 25, 'Test', tenantId, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when user tries to update another user entry', async () => {
      const otherUserEntry = { ...mockTimeEntry, userId: 'other-user-123' } as unknown as TimeEntry;
      timeEntryRepository.findOne.mockResolvedValue(otherUserEntry);

      await expect(service.update(entryId, 6, 'Updated work', tenantId, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(entryId, 6, 'Updated work', tenantId, mockUser)).rejects.toThrow(
        'You can only update your own time entries',
      );
    });

    it('should recalculate task and project hours after update', async () => {
      const freshMockEntry = { ...mockTimeEntry } as unknown as TimeEntry;
      timeEntryRepository.findOne.mockResolvedValue(freshMockEntry);
      timeEntryRepository.save.mockResolvedValue(freshMockEntry);
      taskRepository.update.mockResolvedValue({ affected: 1 } as any);
      projectRepository.update.mockResolvedValue({ affected: 1 } as any);

      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue({ total: 10 });
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.update(entryId, 6, 'Updated work', tenantId, mockUser);

      expect(taskRepository.update).toHaveBeenCalled();
      expect(projectRepository.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove time entry successfully', async () => {
      const freshMockEntry = { ...mockTimeEntry } as unknown as TimeEntry;
      timeEntryRepository.findOne.mockResolvedValue(freshMockEntry);
      timeEntryRepository.remove.mockResolvedValue(freshMockEntry);
      taskRepository.update.mockResolvedValue({ affected: 1 } as any);
      projectRepository.update.mockResolvedValue({ affected: 1 } as any);

      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue({ total: 0 });
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.remove(entryId, tenantId, mockUser);

      expect(timeEntryRepository.remove).toHaveBeenCalledWith(freshMockEntry);
    });

    it('should throw BadRequestException when user tries to delete another user entry', async () => {
      const otherUserEntry = { ...mockTimeEntry, userId: 'other-user-123' } as unknown as TimeEntry;
      timeEntryRepository.findOne.mockResolvedValue(otherUserEntry);

      await expect(service.remove(entryId, tenantId, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove(entryId, tenantId, mockUser)).rejects.toThrow(
        'You can only delete your own time entries',
      );
    });

    it('should recalculate task and project hours after deletion', async () => {
      const freshMockEntry = { ...mockTimeEntry } as unknown as TimeEntry;
      timeEntryRepository.findOne.mockResolvedValue(freshMockEntry);
      timeEntryRepository.remove.mockResolvedValue(freshMockEntry);
      taskRepository.update.mockResolvedValue({ affected: 1 } as any);
      projectRepository.update.mockResolvedValue({ affected: 1 } as any);

      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue({ total: 0 });
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.remove(entryId, tenantId, mockUser);

      expect(taskRepository.update).toHaveBeenCalledWith(
        { id: taskId, tenantId },
        { actualHours: 0 },
      );
      expect(projectRepository.update).toHaveBeenCalled();
    });
  });

  describe('getTotalHoursByTask', () => {
    it('should return total hours for task', async () => {
      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue({ total: 24 });
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTotalHoursByTask(taskId, tenantId);

      expect(result).toBe(24);
      expect(qb.select).toHaveBeenCalledWith('SUM(entry.hours)', 'total');
      expect(qb.where).toHaveBeenCalledWith('entry.taskId = :taskId', { taskId });
      expect(qb.andWhere).toHaveBeenCalledWith('entry.tenantId = :tenantId', { tenantId });
    });

    it('should return 0 when no entries found', async () => {
      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue(null);
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTotalHoursByTask(taskId, tenantId);

      expect(result).toBe(0);
    });

    it('should return 0 when total is null', async () => {
      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue({ total: null });
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTotalHoursByTask(taskId, tenantId);

      expect(result).toBe(0);
    });
  });

  describe('getTotalHoursByProject', () => {
    it('should return total hours for project', async () => {
      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue({ total: 120 });
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTotalHoursByProject(projectId, tenantId);

      expect(result).toBe(120);
      expect(qb.select).toHaveBeenCalledWith('SUM(entry.hours)', 'total');
      expect(qb.where).toHaveBeenCalledWith('entry.projectId = :projectId', { projectId });
      expect(qb.andWhere).toHaveBeenCalledWith('entry.tenantId = :tenantId', { tenantId });
    });

    it('should return 0 when no entries found', async () => {
      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue(null);
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTotalHoursByProject(projectId, tenantId);

      expect(result).toBe(0);
    });
  });

  describe('getTotalHoursByUser', () => {
    it('should return total hours for user without date range', async () => {
      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue({ total: 160 });
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTotalHoursByUser(userId, tenantId);

      expect(result).toBe(160);
      expect(qb.select).toHaveBeenCalledWith('SUM(entry.hours)', 'total');
      expect(qb.where).toHaveBeenCalledWith('entry.userId = :userId', { userId });
      expect(qb.andWhere).toHaveBeenCalledWith('entry.tenantId = :tenantId', { tenantId });
    });

    it('should return total hours for user with date range', async () => {
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-31');
      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue({ total: 80 });
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTotalHoursByUser(userId, tenantId, startDate, endDate);

      expect(result).toBe(80);
      expect(qb.andWhere).toHaveBeenCalledWith('entry.date >= :startDate', { startDate });
      expect(qb.andWhere).toHaveBeenCalledWith('entry.date <= :endDate', { endDate });
    });

    it('should return 0 when no entries found', async () => {
      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue(null);
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTotalHoursByUser(userId, tenantId);

      expect(result).toBe(0);
    });
  });

  describe('getBillableHours', () => {
    it('should return billable hours and cost without filters', async () => {
      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue({ totalHours: 100, totalCost: 5000 });
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getBillableHours(tenantId);

      expect(result).toEqual({ totalHours: 100, totalCost: 5000 });
      expect(qb.select).toHaveBeenCalledWith('SUM(entry.hours)', 'totalHours');
      expect(qb.addSelect).toHaveBeenCalledWith('SUM(entry.cost)', 'totalCost');
      expect(qb.andWhere).toHaveBeenCalledWith('entry.isBillable = :isBillable', {
        isBillable: true,
      });
    });

    it('should filter by userId', async () => {
      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue({ totalHours: 40, totalCost: 2000 });
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.getBillableHours(tenantId, { userId });

      expect(qb.andWhere).toHaveBeenCalledWith('entry.userId = :userId', { userId });
    });

    it('should filter by projectId', async () => {
      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue({ totalHours: 60, totalCost: 3000 });
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.getBillableHours(tenantId, { projectId });

      expect(qb.andWhere).toHaveBeenCalledWith('entry.projectId = :projectId', { projectId });
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-31');
      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue({ totalHours: 80, totalCost: 4000 });
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.getBillableHours(tenantId, { startDate, endDate });

      expect(qb.andWhere).toHaveBeenCalledWith('entry.date >= :startDate', { startDate });
      expect(qb.andWhere).toHaveBeenCalledWith('entry.date <= :endDate', { endDate });
    });

    it('should return 0 when no billable entries found', async () => {
      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue(null);
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getBillableHours(tenantId);

      expect(result).toEqual({ totalHours: 0, totalCost: 0 });
    });

    it('should apply multiple filters', async () => {
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-31');
      const qb = createMockQueryBuilder();
      (qb.getRawOne as jest.Mock).mockResolvedValue({ totalHours: 40, totalCost: 2000 });
      timeEntryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.getBillableHours(tenantId, { userId, projectId, startDate, endDate });

      expect(qb.andWhere).toHaveBeenCalledTimes(5); // isBillable + userId + projectId + startDate + endDate
    });
  });
});
