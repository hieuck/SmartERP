import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance, AttendanceStatus } from '../enums/hr.enum';
import { Employee, EmploymentStatus } from '../enums/hr.enum';
import { Leave, LeaveStatus, LeaveType } from '../enums/hr.enum';
import { HrService } from './hr.service';

const mockUser = {
  id: 'user1',
  tenantId: 'tenant1',
  roles: ['admin'],
};

describe('HrService', () => {
  let service: HrService;
  let employeeRepository: Repository<Employee>;
  let attendanceRepository: Repository<Attendance>;
  let leaveRepository: Repository<Leave>;
  let cacheService: CacheService;

  const mockEmployee: Partial<Employee> = {
    id: 'employee-1',
    tenantId: 'tenant1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    department: 'Engineering',
    position: 'Software Engineer',
    status: EmploymentStatus.ACTIVE,
    hireDate: new Date('2024-01-01'),
  };

  const mockAttendance: Partial<Attendance> = {
    id: 'attendance-1',
    tenantId: 'tenant1',
    employeeId: 'employee-1',
    date: new Date('2024-03-01'),
    status: AttendanceStatus.PRESENT,
    checkIn: '09:00:00',
    checkOut: '18:00:00',
  };

  const mockLeave: Partial<Leave> = {
    id: 'leave-1',
    tenantId: 'tenant1',
    employeeId: 'employee-1',
    type: LeaveType.ANNUAL,
    startDate: new Date('2024-03-15'),
    endDate: new Date('2024-03-17'),
    days: 3,
    status: LeaveStatus.PENDING,
    reason: 'Vacation',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrService,
        {
          provide: getRepositoryToken(Employee),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Attendance),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Leave),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            canRead: jest.fn().mockReturnValue(true),
            canWrite: jest.fn().mockReturnValue(true),
            canDelete: jest.fn().mockReturnValue(true),
            buildSecureQuery: jest.fn((user, baseWhere) => ({
              ...baseWhere,
              tenantId: user.tenantId,
            })),
          },
        },
      ],
    }).compile();

    service = module.get<HrService>(HrService);
    employeeRepository = module.get<Repository<Employee>>(getRepositoryToken(Employee));
    attendanceRepository = module.get<Repository<Attendance>>(getRepositoryToken(Attendance));
    leaveRepository = module.get<Repository<Leave>>(getRepositoryToken(Leave));
    cacheService = module.get<CacheService>(CacheService);

    // Setup SecureRepository spies
    jest
      .spyOn(service['secureEmployeeRepo'], 'find')
      .mockImplementation(async () => [mockEmployee] as Employee[]);
    jest
      .spyOn(service['secureEmployeeRepo'], 'findOne')
      .mockImplementation(async () => mockEmployee as Employee);
    jest
      .spyOn(service['secureEmployeeRepo'], 'save')
      .mockImplementation(async (_user, data) => ({ ...mockEmployee, ...data }) as Employee);
    jest.spyOn(service['secureEmployeeRepo'], 'remove').mockImplementation(async () => undefined);

    jest
      .spyOn(service['secureAttendanceRepo'], 'find')
      .mockImplementation(async () => [mockAttendance] as Attendance[]);
    jest
      .spyOn(service['secureAttendanceRepo'], 'findOne')
      .mockImplementation(async () => mockAttendance as Attendance);
    jest
      .spyOn(service['secureAttendanceRepo'], 'save')
      .mockImplementation(async (_user, data) => ({ ...mockAttendance, ...data }) as Attendance);
    jest.spyOn(service['secureAttendanceRepo'], 'remove').mockImplementation(async () => undefined);

    jest
      .spyOn(service['secureLeaveRepo'], 'find')
      .mockImplementation(async () => [mockLeave] as Leave[]);
    jest
      .spyOn(service['secureLeaveRepo'], 'findOne')
      .mockImplementation(async () => mockLeave as Leave);
    jest
      .spyOn(service['secureLeaveRepo'], 'save')
      .mockImplementation(async (_user, data) => ({ ...mockLeave, ...data }) as Leave);
    jest.spyOn(service['secureLeaveRepo'], 'remove').mockImplementation(async () => undefined);
  });

  afterEach(() => {
    // Don't clear mocks - SecureRepository spies are set up in beforeEach
  });

  // ==================== EMPLOYEE TESTS ====================

  describe('findAllEmployees', () => {
    it('should return all employees for tenant', async () => {
      jest
        .spyOn(service['secureEmployeeRepo'], 'find')
        .mockResolvedValue([mockEmployee] as Employee[]);

      const result = await service.findAllEmployees(mockUser);

      expect(result).toEqual([mockEmployee]);
    });
  });

  describe('findEmployeeById', () => {
    it('should return employee from cache if exists', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockEmployee as Employee);

      const result = await service.findEmployeeById(mockUser, 'employee-1');

      expect(result).toEqual(mockEmployee);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException when employee not found', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (_key, fn) => fn());
      jest.spyOn(service['secureEmployeeRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.findEmployeeById(mockUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findEmployeeByEmail', () => {
    it('should return employee when found', async () => {
      jest
        .spyOn(service['secureEmployeeRepo'], 'findOne')
        .mockResolvedValue(mockEmployee as Employee);

      const result = await service.findEmployeeByEmail(mockUser, 'john.doe@example.com');

      expect(result).toEqual(mockEmployee);
    });

    it('should return null when employee not found', async () => {
      jest.spyOn(service['secureEmployeeRepo'], 'findOne').mockResolvedValue(null);

      const result = await service.findEmployeeByEmail(mockUser, 'nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('createEmployee', () => {
    it('should create and save employee', async () => {
      jest.spyOn(service['secureEmployeeRepo'], 'findOne').mockResolvedValue(null);
      jest.spyOn(service['secureEmployeeRepo'], 'save').mockResolvedValue(mockEmployee as Employee);

      const result = await service.createEmployee(mockUser, {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      });

      expect(result).toEqual(mockEmployee);
    });

    it('should throw ConflictException when email already exists', async () => {
      jest
        .spyOn(service['secureEmployeeRepo'], 'findOne')
        .mockResolvedValue(mockEmployee as Employee);

      await expect(
        service.createEmployee(mockUser, { email: 'john.doe@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateEmployee', () => {
    it('should update employee and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockEmployee as Employee);
      jest
        .spyOn(service['secureEmployeeRepo'], 'save')
        .mockResolvedValue({ ...mockEmployee, firstName: 'Jane' } as Employee);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.updateEmployee(mockUser, 'employee-1', { firstName: 'Jane' });

      expect(result.firstName).toBe('Jane');
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw ConflictException when updating to existing email', async () => {
      const existingEmployee = { ...mockEmployee, id: 'employee-2' };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockEmployee as Employee);
      jest
        .spyOn(service['secureEmployeeRepo'], 'findOne')
        .mockResolvedValue(existingEmployee as Employee);

      await expect(
        service.updateEmployee(mockUser, 'employee-1', { email: 'existing@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteEmployee', () => {
    it('should soft delete employee and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockEmployee as Employee);
      jest.spyOn(service['secureEmployeeRepo'], 'remove').mockResolvedValue(undefined);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      await service.deleteEmployee(mockUser, 'employee-1');

      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('findEmployeesByDepartment', () => {
    it('should return employees in department', async () => {
      jest
        .spyOn(service['secureEmployeeRepo'], 'find')
        .mockResolvedValue([mockEmployee] as Employee[]);

      const result = await service.findEmployeesByDepartment(mockUser, 'Engineering');

      expect(result).toEqual([mockEmployee]);
    });
  });

  describe('findEmployeesByStatus', () => {
    it('should return employees with status', async () => {
      jest
        .spyOn(service['secureEmployeeRepo'], 'find')
        .mockResolvedValue([mockEmployee] as Employee[]);

      const result = await service.findEmployeesByStatus(mockUser, EmploymentStatus.ACTIVE);

      expect(result).toEqual([mockEmployee]);
    });
  });

  describe('countEmployees', () => {
    it('should return employee count', async () => {
      const employees = Array(10).fill(mockEmployee);
      jest.spyOn(service['secureEmployeeRepo'], 'find').mockResolvedValue(employees as Employee[]);

      const result = await service.countEmployees(mockUser);

      expect(result).toBe(10);
    });
  });

  // ==================== ATTENDANCE TESTS ====================

  describe('findAllAttendance', () => {
    it('should return all attendance records for tenant', async () => {
      jest
        .spyOn(service['secureAttendanceRepo'], 'find')
        .mockResolvedValue([mockAttendance] as Attendance[]);

      const result = await service.findAllAttendance(mockUser);

      expect(result).toEqual([mockAttendance]);
    });

    it('should filter by employeeId when provided', async () => {
      jest
        .spyOn(service['secureAttendanceRepo'], 'find')
        .mockResolvedValue([mockAttendance] as Attendance[]);

      const result = await service.findAllAttendance(mockUser, 'employee-1');

      expect(result).toEqual([mockAttendance]);
    });

    it('should filter by date range when provided', async () => {
      const startDate = new Date('2024-03-01');
      const endDate = new Date('2024-03-31');
      jest
        .spyOn(service['secureAttendanceRepo'], 'find')
        .mockResolvedValue([mockAttendance] as Attendance[]);

      const result = await service.findAllAttendance(mockUser, undefined, startDate, endDate);

      expect(result).toEqual([mockAttendance]);
    });
  });

  describe('findAttendanceById', () => {
    it('should return attendance from cache if exists', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockAttendance as Attendance);

      const result = await service.findAttendanceById(mockUser, 'attendance-1');

      expect(result).toEqual(mockAttendance);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException when attendance not found', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (_key, fn) => fn());
      jest.spyOn(service['secureAttendanceRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.findAttendanceById(mockUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createAttendance', () => {
    it('should create and save attendance', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockEmployee as Employee);
      jest
        .spyOn(service['secureAttendanceRepo'], 'save')
        .mockResolvedValue(mockAttendance as Attendance);

      const result = await service.createAttendance(mockUser, {
        employeeId: 'employee-1',
        date: new Date('2024-03-01'),
        status: AttendanceStatus.PRESENT,
      });

      expect(result).toEqual(mockAttendance);
    });
  });

  describe('updateAttendance', () => {
    it('should update attendance and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockAttendance as Attendance);
      jest
        .spyOn(service['secureAttendanceRepo'], 'save')
        .mockResolvedValue({ ...mockAttendance, status: AttendanceStatus.LATE } as Attendance);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.updateAttendance(mockUser, 'attendance-1', {
        status: AttendanceStatus.LATE,
      });

      expect(result.status).toBe(AttendanceStatus.LATE);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('deleteAttendance', () => {
    it('should delete attendance and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockAttendance as Attendance);
      jest.spyOn(service['secureAttendanceRepo'], 'remove').mockResolvedValue(undefined);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      await service.deleteAttendance(mockUser, 'attendance-1');

      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('getAttendanceStatistics', () => {
    it('should calculate attendance statistics correctly', async () => {
      const attendanceRecords = [
        { ...mockAttendance, status: AttendanceStatus.PRESENT },
        { ...mockAttendance, id: 'attendance-2', status: AttendanceStatus.PRESENT },
        { ...mockAttendance, id: 'attendance-3', status: AttendanceStatus.ABSENT },
        { ...mockAttendance, id: 'attendance-4', status: AttendanceStatus.LATE },
        { ...mockAttendance, id: 'attendance-5', status: AttendanceStatus.HALF_DAY },
      ];
      jest
        .spyOn(service['secureAttendanceRepo'], 'find')
        .mockResolvedValue(attendanceRecords as Attendance[]);

      const result = await service.getAttendanceStatistics(
        mockUser,
        'employee-1',
        new Date('2024-03-01'),
        new Date('2024-03-31'),
      );

      expect(result).toEqual({
        total: 5,
        present: 2,
        absent: 1,
        late: 1,
        halfDay: 1,
        attendanceRate: 40,
      });
    });

    it('should return 0 attendance rate when no records', async () => {
      jest.spyOn(service['secureAttendanceRepo'], 'find').mockResolvedValue([]);

      const result = await service.getAttendanceStatistics(
        mockUser,
        'employee-1',
        new Date('2024-03-01'),
        new Date('2024-03-31'),
      );

      expect(result.attendanceRate).toBe(0);
    });
  });

  // ==================== LEAVE TESTS ====================

  describe('findAllLeaves', () => {
    it('should return all leave records for tenant', async () => {
      jest.spyOn(service['secureLeaveRepo'], 'find').mockResolvedValue([mockLeave] as Leave[]);

      const result = await service.findAllLeaves(mockUser);

      expect(result).toEqual([mockLeave]);
    });

    it('should filter by employeeId when provided', async () => {
      jest.spyOn(service['secureLeaveRepo'], 'find').mockResolvedValue([mockLeave] as Leave[]);

      const result = await service.findAllLeaves(mockUser, 'employee-1');

      expect(result).toEqual([mockLeave]);
    });

    it('should filter by status when provided', async () => {
      jest.spyOn(service['secureLeaveRepo'], 'find').mockResolvedValue([mockLeave] as Leave[]);

      const result = await service.findAllLeaves(mockUser, undefined, LeaveStatus.PENDING);

      expect(result).toEqual([mockLeave]);
    });
  });

  describe('findLeaveById', () => {
    it('should return leave from cache if exists', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockLeave as Leave);

      const result = await service.findLeaveById(mockUser, 'leave-1');

      expect(result).toEqual(mockLeave);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException when leave not found', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (_key, fn) => fn());
      jest.spyOn(service['secureLeaveRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.findLeaveById(mockUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createLeave', () => {
    it('should create and save leave', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockEmployee as Employee);
      jest.spyOn(service['secureLeaveRepo'], 'save').mockResolvedValue(mockLeave as Leave);

      const result = await service.createLeave(mockUser, {
        employeeId: 'employee-1',
        type: LeaveType.ANNUAL,
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-17'),
        days: 3,
      });

      expect(result).toEqual(mockLeave);
    });

    it('should calculate days when not provided', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockEmployee as Employee);
      jest.spyOn(service['secureLeaveRepo'], 'save').mockResolvedValue(mockLeave as Leave);

      const result = await service.createLeave(mockUser, {
        employeeId: 'employee-1',
        type: LeaveType.ANNUAL,
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-17'),
      });

      expect(result.days).toBe(3);
    });
  });

  describe('updateLeave', () => {
    it('should update leave and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockLeave as Leave);
      jest
        .spyOn(service['secureLeaveRepo'], 'save')
        .mockResolvedValue({ ...mockLeave, reason: 'Updated reason' } as Leave);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.updateLeave(mockUser, 'leave-1', { reason: 'Updated reason' });

      expect(result.reason).toBe('Updated reason');
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('deleteLeave', () => {
    it('should delete leave and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockLeave as Leave);
      jest.spyOn(service['secureLeaveRepo'], 'remove').mockResolvedValue(undefined);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      await service.deleteLeave(mockUser, 'leave-1');

      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('approveLeave', () => {
    it('should approve pending leave', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockLeave as Leave);
      jest.spyOn(service['secureLeaveRepo'], 'save').mockResolvedValue({
        ...mockLeave,
        status: LeaveStatus.APPROVED,
        approvedBy: 'manager-1',
      } as Leave);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.approveLeave(mockUser, 'leave-1', 'manager-1');

      expect(result.status).toBe(LeaveStatus.APPROVED);
      expect(result.approvedBy).toBe('manager-1');
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException when leave is not pending', async () => {
      const approvedLeave = { ...mockLeave, status: LeaveStatus.APPROVED };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(approvedLeave as Leave);

      await expect(service.approveLeave(mockUser, 'leave-1', 'manager-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('rejectLeave', () => {
    it('should reject pending leave', async () => {
      const pendingLeave = { ...mockLeave, status: LeaveStatus.PENDING };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(pendingLeave as Leave);
      jest.spyOn(service['secureLeaveRepo'], 'save').mockResolvedValue({
        ...pendingLeave,
        status: LeaveStatus.REJECTED,
      } as Leave);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.rejectLeave(mockUser, 'leave-1');

      expect(result.status).toBe(LeaveStatus.REJECTED);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException when leave is not pending', async () => {
      const approvedLeave = { ...mockLeave, status: LeaveStatus.APPROVED };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(approvedLeave as Leave);

      await expect(service.rejectLeave(mockUser, 'leave-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLeaveBalance', () => {
    it('should calculate leave balance correctly', async () => {
      const approvedLeaves = [
        { ...mockLeave, days: 3, status: LeaveStatus.APPROVED, startDate: new Date('2024-03-15') },
        {
          ...mockLeave,
          id: 'leave-2',
          days: 2,
          status: LeaveStatus.APPROVED,
          startDate: new Date('2024-06-10'),
        },
      ];
      jest.spyOn(service['secureLeaveRepo'], 'find').mockResolvedValue(approvedLeaves as Leave[]);

      const result = await service.getLeaveBalance(mockUser, 'employee-1', 2024);

      expect(result).toEqual({
        year: 2024,
        totalDaysTaken: 5,
        annualLeaveAllowance: 12,
        remainingDays: 7,
      });
    });

    it('should only count approved leaves in year range', async () => {
      const approvedLeaves = [
        { ...mockLeave, days: 3, status: LeaveStatus.APPROVED, startDate: new Date('2024-03-15') },
      ];
      jest.spyOn(service['secureLeaveRepo'], 'find').mockResolvedValue(approvedLeaves as Leave[]);

      const result = await service.getLeaveBalance(mockUser, 'employee-1', 2024);

      expect(result.totalDaysTaken).toBe(3);
      expect(result.remainingDays).toBe(9);
    });
  });
});
