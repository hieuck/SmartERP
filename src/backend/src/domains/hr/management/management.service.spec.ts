import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ManagementService } from './management.service';
import { Employee } from './entities/employee.entity';
import { Attendance } from './entities/attendance.entity';
import { Leave } from './entities/leave.entity';
import { EmploymentStatus } from './enums/employment-status.enum';
import { AttendanceStatus } from './enums/attendance-status.enum';
import { LeaveStatus } from './enums/leave-status.enum';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';

describe('ManagementService', () => {
  let permissionService: jest.Mocked<PermissionService>;
  let service: ManagementService;
  let employeeRepository: jest.Mocked<Repository<Employee>>;
  let attendanceRepository: jest.Mocked<Repository<Attendance>>;
  let leaveRepository: jest.Mocked<Repository<Leave>>;
  let cacheService: jest.Mocked<CacheService>;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const mockEmployee: Employee = {
    id: 'employee-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    employeeCode: 'EMP001',
    position: 'Software Engineer',
    department: 'Engineering',
    employmentType: 'FULL_TIME' as any,
    status: EmploymentStatus.ACTIVE,
    hireDate: new Date('2024-01-01'),
    salary: 100000,
    managerId: null,
    deletedAt: null,
    tenantId: 'tenant-123',
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Employee;

  const mockAttendance: Attendance = {
    id: 'attendance-123',
    employeeId: 'employee-123',
    date: new Date('2024-03-01'),
    status: AttendanceStatus.PRESENT,
    checkIn: '09:00',
    checkOut: '18:00',
    notes: '',
    tenantId: 'tenant-123',
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Attendance;

  const mockLeave: Leave = {
    id: 'leave-123',
    employeeId: 'employee-123',
    type: 'ANNUAL' as any,
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-03-05'),
    days: 5,
    reason: 'Vacation',
    status: LeaveStatus.PENDING,
    approvedBy: null,
    approvedAt: null,
    tenantId: 'tenant-123',
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Leave;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManagementService,
        {
          provide: getRepositoryToken(Employee),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Attendance),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Leave),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            getOrSet: jest.fn(),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            canRead: jest.fn().mockReturnValue(true),
            canWrite: jest.fn().mockReturnValue(true),
            canDelete: jest.fn().mockReturnValue(true),
            buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
          },
        },
      ],
    }).compile();

    service = module.get<ManagementService>(ManagementService);
    employeeRepository = module.get(getRepositoryToken(Employee));
    attendanceRepository = module.get(getRepositoryToken(Attendance));
    leaveRepository = module.get(getRepositoryToken(Leave));
    cacheService = module.get(CacheService);
    permissionService = module.get(PermissionService);
    void permissionService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Employee Management', () => {
    describe('findAllEmployees', () => {
      it('should return all employees', async () => {
        employeeRepository.find.mockResolvedValue([mockEmployee]);

        const result = await service.findAllEmployees(mockUser);

        expect(employeeRepository.find).toHaveBeenCalled();
        expect(result).toEqual([mockEmployee]);
      });
    });

    describe('findEmployeeById', () => {
      it('should return employee from cache if exists', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        employeeRepository.findOne.mockResolvedValue(mockEmployee);

        const result = await service.findEmployeeById(mockUser, 'employee-123');

        expect(cacheService.getOrSet).toHaveBeenCalled();
        expect(result).toEqual(mockEmployee);
      });

      it('should throw NotFoundException when employee not found', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        employeeRepository.findOne.mockResolvedValue(null);

        await expect(service.findEmployeeById(mockUser, 'employee-123')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('findEmployeeByEmail', () => {
      it('should return employee by email', async () => {
        employeeRepository.findOne.mockResolvedValue(mockEmployee);

        const result = await service.findEmployeeByEmail(mockUser, 'john.doe@example.com');

        expect(employeeRepository.findOne).toHaveBeenCalled();
        expect(result).toEqual(mockEmployee);
      });

      it('should return null when employee not found', async () => {
        employeeRepository.findOne.mockResolvedValue(null);

        const result = await service.findEmployeeByEmail(mockUser, 'notfound@example.com');

        expect(result).toBeNull();
      });
    });

    describe('createEmployee', () => {
      it('should create employee successfully', async () => {
        employeeRepository.findOne.mockResolvedValue(null);
        employeeRepository.save.mockResolvedValue(mockEmployee);

        const result = await service.createEmployee(mockUser, {
          email: 'new@example.com',
          firstName: 'Jane',
        });

        expect(employeeRepository.save).toHaveBeenCalled();
        expect(result).toEqual(mockEmployee);
      });

      it('should throw ConflictException when email already exists', async () => {
        employeeRepository.findOne.mockResolvedValue(mockEmployee);

        await expect(
          service.createEmployee(mockUser, { email: 'john.doe@example.com' }),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('updateEmployee', () => {
      it('should update employee successfully', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        employeeRepository.findOne.mockResolvedValue(mockEmployee);
        employeeRepository.save.mockResolvedValue({ ...mockEmployee, firstName: 'Jane' });

        const result = await service.updateEmployee(mockUser, 'employee-123', {
          firstName: 'Jane',
        });

        expect(employeeRepository.save).toHaveBeenCalled();
        expect(cacheService.del).toHaveBeenCalled();
        expect(result.firstName).toBe('Jane');
      });

      it('should throw ConflictException when updating to existing email', async () => {
        const anotherEmployee = { ...mockEmployee, id: 'employee-456' };
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        employeeRepository.findOne
          .mockResolvedValueOnce(mockEmployee)
          .mockResolvedValueOnce(anotherEmployee);

        await expect(
          service.updateEmployee(mockUser, 'employee-123', { email: 'another@example.com' }),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('deleteEmployee', () => {
      it('should delete employee successfully', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        employeeRepository.findOne.mockResolvedValue(mockEmployee);
        employeeRepository.remove.mockResolvedValue(mockEmployee);

        await service.deleteEmployee(mockUser, 'employee-123');

        expect(employeeRepository.remove).toHaveBeenCalled();
        expect(cacheService.del).toHaveBeenCalled();
      });
    });

    describe('findEmployeesByDepartment', () => {
      it('should return employees by department', async () => {
        employeeRepository.find.mockResolvedValue([mockEmployee]);

        const result = await service.findEmployeesByDepartment(mockUser, 'Engineering');

        expect(employeeRepository.find).toHaveBeenCalled();
        expect(result).toEqual([mockEmployee]);
      });
    });

    describe('findEmployeesByStatus', () => {
      it('should return employees by status', async () => {
        employeeRepository.find.mockResolvedValue([mockEmployee]);

        const result = await service.findEmployeesByStatus(mockUser, EmploymentStatus.ACTIVE);

        expect(employeeRepository.find).toHaveBeenCalled();
        expect(result).toEqual([mockEmployee]);
      });
    });

    describe('countEmployees', () => {
      it('should return employee count', async () => {
        employeeRepository.find.mockResolvedValue([mockEmployee, mockEmployee]);

        const result = await service.countEmployees(mockUser);

        expect(result).toBe(2);
      });
    });
  });

  describe('Attendance Management', () => {
    describe('findAllAttendance', () => {
      it('should return all attendance records', async () => {
        attendanceRepository.find.mockResolvedValue([mockAttendance]);

        const result = await service.findAllAttendance(mockUser);

        expect(attendanceRepository.find).toHaveBeenCalled();
        expect(result).toEqual([mockAttendance]);
      });

      it('should filter by employeeId', async () => {
        attendanceRepository.find.mockResolvedValue([mockAttendance]);

        const result = await service.findAllAttendance(mockUser, 'employee-123');

        expect(attendanceRepository.find).toHaveBeenCalled();
        expect(result).toEqual([mockAttendance]);
      });

      it('should filter by date range', async () => {
        attendanceRepository.find.mockResolvedValue([mockAttendance]);

        const result = await service.findAllAttendance(
          mockUser,
          undefined,
          new Date('2024-03-01'),
          new Date('2024-03-31'),
        );

        expect(attendanceRepository.find).toHaveBeenCalled();
        expect(result).toEqual([mockAttendance]);
      });
    });

    describe('findAttendanceById', () => {
      it('should return attendance from cache', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        attendanceRepository.findOne.mockResolvedValue(mockAttendance);

        const result = await service.findAttendanceById(mockUser, 'attendance-123');

        expect(cacheService.getOrSet).toHaveBeenCalled();
        expect(result).toEqual(mockAttendance);
      });

      it('should throw NotFoundException when attendance not found', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        attendanceRepository.findOne.mockResolvedValue(null);

        await expect(service.findAttendanceById(mockUser, 'attendance-123')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('createAttendance', () => {
      it('should create attendance successfully', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        employeeRepository.findOne.mockResolvedValue(mockEmployee);
        attendanceRepository.save.mockResolvedValue(mockAttendance);

        const result = await service.createAttendance(mockUser, {
          employeeId: 'employee-123',
          date: new Date('2024-03-01'),
        });

        expect(attendanceRepository.save).toHaveBeenCalled();
        expect(result).toEqual(mockAttendance);
      });
    });

    describe('updateAttendance', () => {
      it('should update attendance successfully', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        attendanceRepository.findOne.mockResolvedValue(mockAttendance);
        attendanceRepository.save.mockResolvedValue({
          ...mockAttendance,
          status: AttendanceStatus.LATE,
        });

        const result = await service.updateAttendance(mockUser, 'attendance-123', {
          status: AttendanceStatus.LATE,
        });

        expect(attendanceRepository.save).toHaveBeenCalled();
        expect(cacheService.del).toHaveBeenCalled();
        expect(result.status).toBe(AttendanceStatus.LATE);
      });
    });

    describe('deleteAttendance', () => {
      it('should delete attendance successfully', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        attendanceRepository.findOne.mockResolvedValue(mockAttendance);
        attendanceRepository.remove.mockResolvedValue(mockAttendance);

        await service.deleteAttendance(mockUser, 'attendance-123');

        expect(attendanceRepository.remove).toHaveBeenCalled();
        expect(cacheService.del).toHaveBeenCalled();
      });
    });

    describe('getAttendanceStatistics', () => {
      it('should calculate attendance statistics correctly', async () => {
        const attendanceRecords = [
          { ...mockAttendance, status: AttendanceStatus.PRESENT },
          { ...mockAttendance, status: AttendanceStatus.PRESENT },
          { ...mockAttendance, status: AttendanceStatus.ABSENT },
          { ...mockAttendance, status: AttendanceStatus.LATE },
          { ...mockAttendance, status: AttendanceStatus.HALF_DAY },
        ];
        attendanceRepository.find.mockResolvedValue(attendanceRecords);

        const result = await service.getAttendanceStatistics(
          mockUser,
          'employee-123',
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
        attendanceRepository.find.mockResolvedValue([]);

        const result = await service.getAttendanceStatistics(
          mockUser,
          'employee-123',
          new Date('2024-03-01'),
          new Date('2024-03-31'),
        );

        expect(result.attendanceRate).toBe(0);
      });
    });
  });

  describe('Leave Management', () => {
    describe('findAllLeaves', () => {
      it('should return all leaves', async () => {
        leaveRepository.find.mockResolvedValue([mockLeave]);

        const result = await service.findAllLeaves(mockUser);

        expect(leaveRepository.find).toHaveBeenCalled();
        expect(result).toEqual([mockLeave]);
      });

      it('should filter by employeeId', async () => {
        leaveRepository.find.mockResolvedValue([mockLeave]);

        const result = await service.findAllLeaves(mockUser, 'employee-123');

        expect(leaveRepository.find).toHaveBeenCalled();
        expect(result).toEqual([mockLeave]);
      });

      it('should filter by status', async () => {
        leaveRepository.find.mockResolvedValue([mockLeave]);

        const result = await service.findAllLeaves(mockUser, undefined, LeaveStatus.PENDING);

        expect(leaveRepository.find).toHaveBeenCalled();
        expect(result).toEqual([mockLeave]);
      });
    });

    describe('findLeaveById', () => {
      it('should return leave from cache', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        leaveRepository.findOne.mockResolvedValue(mockLeave);

        const result = await service.findLeaveById(mockUser, 'leave-123');

        expect(cacheService.getOrSet).toHaveBeenCalled();
        expect(result).toEqual(mockLeave);
      });

      it('should throw NotFoundException when leave not found', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        leaveRepository.findOne.mockResolvedValue(null);

        await expect(service.findLeaveById(mockUser, 'leave-123')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('createLeave', () => {
      it('should create leave successfully', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        employeeRepository.findOne.mockResolvedValue(mockEmployee);
        leaveRepository.save.mockResolvedValue(mockLeave);

        const result = await service.createLeave(mockUser, {
          employeeId: 'employee-123',
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-05'),
        });

        expect(leaveRepository.save).toHaveBeenCalled();
        expect(result).toEqual(mockLeave);
      });

      it('should calculate days if not provided', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        employeeRepository.findOne.mockResolvedValue(mockEmployee);
        leaveRepository.save.mockResolvedValue(mockLeave);

        await service.createLeave(mockUser, {
          employeeId: 'employee-123',
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-05'),
        });

        // SecureRepository.save() calls repository.save() with modified entity
        expect(leaveRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            employeeId: 'employee-123',
            days: 5,
            tenantId: mockUser.tenantId,
            createdBy: mockUser.id,
          }),
        );
      });
    });

    describe('updateLeave', () => {
      it('should update leave successfully', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        leaveRepository.findOne.mockResolvedValue(mockLeave);
        leaveRepository.save.mockResolvedValue({
          ...mockLeave,
          status: LeaveStatus.APPROVED,
        });

        const result = await service.updateLeave(mockUser, 'leave-123', {
          status: LeaveStatus.APPROVED,
        });

        expect(leaveRepository.save).toHaveBeenCalled();
        expect(cacheService.del).toHaveBeenCalled();
        expect(result.status).toBe(LeaveStatus.APPROVED);
      });
    });

    describe('deleteLeave', () => {
      it('should delete leave successfully', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        leaveRepository.findOne.mockResolvedValue(mockLeave);
        leaveRepository.remove.mockResolvedValue(mockLeave);

        await service.deleteLeave(mockUser, 'leave-123');

        expect(leaveRepository.remove).toHaveBeenCalled();
        expect(cacheService.del).toHaveBeenCalled();
      });
    });

    describe('approveLeave', () => {
      it('should approve pending leave successfully', async () => {
        const pendingLeave = { ...mockLeave, status: LeaveStatus.PENDING };
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        leaveRepository.findOne.mockResolvedValue(pendingLeave);
        leaveRepository.save.mockResolvedValue({
          ...pendingLeave,
          status: LeaveStatus.APPROVED,
        });

        const result = await service.approveLeave(mockUser, 'leave-123', 'approver-123');

        expect(leaveRepository.save).toHaveBeenCalled();
        expect(cacheService.del).toHaveBeenCalled();
        expect(result.status).toBe(LeaveStatus.APPROVED);
      });

      it('should throw BadRequestException when leave is not pending', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        leaveRepository.findOne.mockResolvedValue({
          ...mockLeave,
          status: LeaveStatus.APPROVED,
        });

        await expect(service.approveLeave(mockUser, 'leave-123', 'approver-123')).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('rejectLeave', () => {
      it('should reject pending leave successfully', async () => {
        const pendingLeave = { ...mockLeave, status: LeaveStatus.PENDING };
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        leaveRepository.findOne.mockResolvedValue(pendingLeave);
        leaveRepository.save.mockResolvedValue({
          ...pendingLeave,
          status: LeaveStatus.REJECTED,
        });

        const result = await service.rejectLeave(mockUser, 'leave-123');

        expect(leaveRepository.save).toHaveBeenCalled();
        expect(cacheService.del).toHaveBeenCalled();
        expect(result.status).toBe(LeaveStatus.REJECTED);
      });

      it('should throw BadRequestException when leave is not pending', async () => {
        cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
        leaveRepository.findOne.mockResolvedValue({
          ...mockLeave,
          status: LeaveStatus.REJECTED,
        });

        await expect(service.rejectLeave(mockUser, 'leave-123')).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('getLeaveBalance', () => {
      it('should calculate leave balance correctly', async () => {
        const approvedLeaves = [
          {
            ...mockLeave,
            status: LeaveStatus.APPROVED,
            days: 5,
            startDate: new Date('2024-03-01'),
          },
          {
            ...mockLeave,
            status: LeaveStatus.APPROVED,
            days: 3,
            startDate: new Date('2024-06-01'),
          },
        ];
        leaveRepository.find.mockResolvedValue(approvedLeaves);

        const result = await service.getLeaveBalance(mockUser, 'employee-123', 2024);

        expect(result).toEqual({
          year: 2024,
          totalDaysTaken: 8,
          annualLeaveAllowance: 12,
          remainingDays: 4,
        });
      });

      it('should only count approved leaves in the specified year', async () => {
        // Service queries with status=APPROVED, so mock should only return approved leaves
        const approvedLeaves = [
          {
            ...mockLeave,
            status: LeaveStatus.APPROVED,
            days: 5,
            startDate: new Date('2024-03-01'),
          },
          {
            ...mockLeave,
            status: LeaveStatus.APPROVED,
            days: 3,
            startDate: new Date('2024-06-01'),
          },
          {
            ...mockLeave,
            status: LeaveStatus.APPROVED,
            days: 2,
            startDate: new Date('2023-12-01'),
          },
        ];
        leaveRepository.find.mockResolvedValue(approvedLeaves);

        const result = await service.getLeaveBalance(mockUser, 'employee-123', 2024);

        // Only approved leaves in 2024 should be counted (5+3 = 8 days)
        // The 2023 leave (2 days) should be filtered out
        expect(result.totalDaysTaken).toBe(8);
        expect(result.remainingDays).toBe(4);
      });
    });
  });
});
