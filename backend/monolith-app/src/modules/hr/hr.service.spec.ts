import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { HrService } from './hr.service';
import { Employee, EmploymentStatus } from './entities/employee.entity';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { Leave, LeaveStatus, LeaveType } from './entities/leave.entity';
import { CacheService } from '@/common/cache/cache.service';

describe('HrService', () => {
  let service: HrService;
  let employeeRepository: Repository<Employee>;
  let attendanceRepository: Repository<Attendance>;
  let leaveRepository: Repository<Leave>;
  let cacheService: CacheService;

  const mockEmployee: Partial<Employee> = {
    id: 'employee-1',
    tenantId: 'tenant-1',
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
    tenantId: 'tenant-1',
    employeeId: 'employee-1',
    date: new Date('2024-03-01'),
    status: AttendanceStatus.PRESENT,
    checkIn: '09:00:00',
    checkOut: '18:00:00',
  };

  const mockLeave: Partial<Leave> = {
    id: 'leave-1',
    tenantId: 'tenant-1',
    employeeId: 'employee-1',
    type: LeaveType.ANNUAL,
    startDate: new Date('2024-03-15'),
    endDate: new Date('2024-03-17'),
    days: 3,
    status: LeaveStatus.PENDING,
    reason: 'Vacation',
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
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
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
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
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
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
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HrService>(HrService);
    employeeRepository = module.get<Repository<Employee>>(getRepositoryToken(Employee));
    attendanceRepository = module.get<Repository<Attendance>>(getRepositoryToken(Attendance));
    leaveRepository = module.get<Repository<Leave>>(getRepositoryToken(Leave));
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== EMPLOYEE TESTS ====================

  describe('findAllEmployees', () => {
    it('should return all employees for tenant', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockEmployee]);

      const result = await service.findAllEmployees('tenant-1');

      expect(result).toEqual([mockEmployee]);
      expect(employeeRepository.createQueryBuilder).toHaveBeenCalledWith('employee');
    });
  });

  describe('findEmployeeById', () => {
    it('should return employee from cache if exists', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockEmployee as Employee);

      const result = await service.findEmployeeById('tenant-1', 'employee-1');

      expect(result).toEqual(mockEmployee);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException when employee not found', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (_key, fn) => fn());
      jest.spyOn(employeeRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findEmployeeById('tenant-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findEmployeeByEmail', () => {
    it('should return employee when found', async () => {
      jest.spyOn(employeeRepository, 'findOne').mockResolvedValue(mockEmployee as Employee);

      const result = await service.findEmployeeByEmail('tenant-1', 'john.doe@example.com');

      expect(result).toEqual(mockEmployee);
      expect(employeeRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john.doe@example.com', tenantId: 'tenant-1' },
      });
    });

    it('should return null when employee not found', async () => {
      jest.spyOn(employeeRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findEmployeeByEmail('tenant-1', 'nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('createEmployee', () => {
    it('should create and save employee', async () => {
      jest.spyOn(employeeRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(employeeRepository, 'create').mockReturnValue(mockEmployee as Employee);
      jest.spyOn(employeeRepository, 'save').mockResolvedValue(mockEmployee as Employee);

      const result = await service.createEmployee('tenant-1', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      });

      expect(result).toEqual(mockEmployee);
      expect(employeeRepository.create).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        tenantId: 'tenant-1',
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      jest.spyOn(employeeRepository, 'findOne').mockResolvedValue(mockEmployee as Employee);

      await expect(
        service.createEmployee('tenant-1', { email: 'john.doe@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateEmployee', () => {
    it('should update employee and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockEmployee as Employee);
      jest.spyOn(employeeRepository, 'save').mockResolvedValue({ ...mockEmployee, firstName: 'Jane' } as Employee);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.updateEmployee('tenant-1', 'employee-1', { firstName: 'Jane' });

      expect(result.firstName).toBe('Jane');
      expect(employeeRepository.save).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw ConflictException when updating to existing email', async () => {
      const existingEmployee = { ...mockEmployee, id: 'employee-2' };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockEmployee as Employee);
      jest.spyOn(employeeRepository, 'findOne').mockResolvedValue(existingEmployee as Employee);

      await expect(
        service.updateEmployee('tenant-1', 'employee-1', { email: 'existing@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteEmployee', () => {
    it('should soft delete employee and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockEmployee as Employee);
      jest.spyOn(employeeRepository, 'softDelete').mockResolvedValue(undefined);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      await service.deleteEmployee('tenant-1', 'employee-1');

      expect(employeeRepository.softDelete).toHaveBeenCalledWith('employee-1');
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('findEmployeesByDepartment', () => {
    it('should return employees in department', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockEmployee]);

      const result = await service.findEmployeesByDepartment('tenant-1', 'Engineering');

      expect(result).toEqual([mockEmployee]);
      expect(employeeRepository.createQueryBuilder).toHaveBeenCalledWith('employee');
    });
  });

  describe('findEmployeesByStatus', () => {
    it('should return employees with status', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockEmployee]);

      const result = await service.findEmployeesByStatus('tenant-1', EmploymentStatus.ACTIVE);

      expect(result).toEqual([mockEmployee]);
      expect(employeeRepository.createQueryBuilder).toHaveBeenCalledWith('employee');
    });
  });

  describe('countEmployees', () => {
    it('should return employee count', async () => {
      jest.spyOn(employeeRepository, 'count').mockResolvedValue(10);

      const result = await service.countEmployees('tenant-1');

      expect(result).toBe(10);
      expect(employeeRepository.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1' } });
    });
  });

  // ==================== ATTENDANCE TESTS ====================

  describe('findAllAttendance', () => {
    it('should return all attendance records for tenant', async () => {
      jest.spyOn(attendanceRepository, 'find').mockResolvedValue([mockAttendance] as Attendance[]);

      const result = await service.findAllAttendance('tenant-1');

      expect(result).toEqual([mockAttendance]);
      expect(attendanceRepository.find).toHaveBeenCalled();
    });

    it('should filter by employeeId when provided', async () => {
      jest.spyOn(attendanceRepository, 'find').mockResolvedValue([mockAttendance] as Attendance[]);

      const result = await service.findAllAttendance('tenant-1', 'employee-1');

      expect(result).toEqual([mockAttendance]);
      expect(attendanceRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', employeeId: 'employee-1' },
        order: { date: 'DESC' },
      });
    });

    it('should filter by date range when provided', async () => {
      const startDate = new Date('2024-03-01');
      const endDate = new Date('2024-03-31');
      jest.spyOn(attendanceRepository, 'find').mockResolvedValue([mockAttendance] as Attendance[]);

      const result = await service.findAllAttendance('tenant-1', undefined, startDate, endDate);

      expect(result).toEqual([mockAttendance]);
    });
  });

  describe('findAttendanceById', () => {
    it('should return attendance from cache if exists', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockAttendance as Attendance);

      const result = await service.findAttendanceById('tenant-1', 'attendance-1');

      expect(result).toEqual(mockAttendance);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException when attendance not found', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (_key, fn) => fn());
      jest.spyOn(attendanceRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findAttendanceById('tenant-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createAttendance', () => {
    it('should create and save attendance', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockEmployee as Employee);
      jest.spyOn(attendanceRepository, 'create').mockReturnValue(mockAttendance as Attendance);
      jest.spyOn(attendanceRepository, 'save').mockResolvedValue(mockAttendance as Attendance);

      const result = await service.createAttendance('tenant-1', {
        employeeId: 'employee-1',
        date: new Date('2024-03-01'),
        status: AttendanceStatus.PRESENT,
      });

      expect(result).toEqual(mockAttendance);
      expect(attendanceRepository.create).toHaveBeenCalled();
    });
  });

  describe('updateAttendance', () => {
    it('should update attendance and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockAttendance as Attendance);
      jest.spyOn(attendanceRepository, 'save').mockResolvedValue({ ...mockAttendance, status: AttendanceStatus.LATE } as Attendance);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.updateAttendance('tenant-1', 'attendance-1', { status: AttendanceStatus.LATE });

      expect(result.status).toBe(AttendanceStatus.LATE);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('deleteAttendance', () => {
    it('should delete attendance and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockAttendance as Attendance);
      jest.spyOn(attendanceRepository, 'delete').mockResolvedValue(undefined);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      await service.deleteAttendance('tenant-1', 'attendance-1');

      expect(attendanceRepository.delete).toHaveBeenCalledWith('attendance-1');
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
      jest.spyOn(attendanceRepository, 'find').mockResolvedValue(attendanceRecords as Attendance[]);

      const result = await service.getAttendanceStatistics(
        'tenant-1',
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
      jest.spyOn(attendanceRepository, 'find').mockResolvedValue([]);

      const result = await service.getAttendanceStatistics(
        'tenant-1',
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
      jest.spyOn(leaveRepository, 'find').mockResolvedValue([mockLeave] as Leave[]);

      const result = await service.findAllLeaves('tenant-1');

      expect(result).toEqual([mockLeave]);
      expect(leaveRepository.find).toHaveBeenCalled();
    });

    it('should filter by employeeId when provided', async () => {
      jest.spyOn(leaveRepository, 'find').mockResolvedValue([mockLeave] as Leave[]);

      const result = await service.findAllLeaves('tenant-1', 'employee-1');

      expect(result).toEqual([mockLeave]);
    });

    it('should filter by status when provided', async () => {
      jest.spyOn(leaveRepository, 'find').mockResolvedValue([mockLeave] as Leave[]);

      const result = await service.findAllLeaves('tenant-1', undefined, LeaveStatus.PENDING);

      expect(result).toEqual([mockLeave]);
    });
  });

  describe('findLeaveById', () => {
    it('should return leave from cache if exists', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockLeave as Leave);

      const result = await service.findLeaveById('tenant-1', 'leave-1');

      expect(result).toEqual(mockLeave);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException when leave not found', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (_key, fn) => fn());
      jest.spyOn(leaveRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findLeaveById('tenant-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createLeave', () => {
    it('should create and save leave', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockEmployee as Employee);
      jest.spyOn(leaveRepository, 'create').mockReturnValue(mockLeave as Leave);
      jest.spyOn(leaveRepository, 'save').mockResolvedValue(mockLeave as Leave);

      const result = await service.createLeave('tenant-1', {
        employeeId: 'employee-1',
        type: LeaveType.ANNUAL,
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-17'),
        days: 3,
      });

      expect(result).toEqual(mockLeave);
      expect(leaveRepository.create).toHaveBeenCalled();
    });

    it('should calculate days when not provided', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockEmployee as Employee);
      jest.spyOn(leaveRepository, 'create').mockReturnValue(mockLeave as Leave);
      jest.spyOn(leaveRepository, 'save').mockResolvedValue(mockLeave as Leave);

      await service.createLeave('tenant-1', {
        employeeId: 'employee-1',
        type: LeaveType.ANNUAL,
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-17'),
      });

      expect(leaveRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          days: 3,
        }),
      );
    });
  });

  describe('updateLeave', () => {
    it('should update leave and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockLeave as Leave);
      jest.spyOn(leaveRepository, 'save').mockResolvedValue({ ...mockLeave, reason: 'Updated reason' } as Leave);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.updateLeave('tenant-1', 'leave-1', { reason: 'Updated reason' });

      expect(result.reason).toBe('Updated reason');
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('deleteLeave', () => {
    it('should delete leave and invalidate cache', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockLeave as Leave);
      jest.spyOn(leaveRepository, 'delete').mockResolvedValue(undefined);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      await service.deleteLeave('tenant-1', 'leave-1');

      expect(leaveRepository.delete).toHaveBeenCalledWith('leave-1');
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('approveLeave', () => {
    it('should approve pending leave', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockLeave as Leave);
      jest.spyOn(leaveRepository, 'save').mockResolvedValue({
        ...mockLeave,
        status: LeaveStatus.APPROVED,
        approvedBy: 'manager-1',
      } as Leave);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.approveLeave('tenant-1', 'leave-1', 'manager-1');

      expect(result.status).toBe(LeaveStatus.APPROVED);
      expect(result.approvedBy).toBe('manager-1');
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException when leave is not pending', async () => {
      const approvedLeave = { ...mockLeave, status: LeaveStatus.APPROVED };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(approvedLeave as Leave);

      await expect(service.approveLeave('tenant-1', 'leave-1', 'manager-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectLeave', () => {
    it('should reject pending leave', async () => {
      const pendingLeave = { ...mockLeave, status: LeaveStatus.PENDING };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(pendingLeave as Leave);
      jest.spyOn(leaveRepository, 'save').mockResolvedValue({
        ...pendingLeave,
        status: LeaveStatus.REJECTED,
      } as Leave);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.rejectLeave('tenant-1', 'leave-1');

      expect(result.status).toBe(LeaveStatus.REJECTED);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException when leave is not pending', async () => {
      const approvedLeave = { ...mockLeave, status: LeaveStatus.APPROVED };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(approvedLeave as Leave);

      await expect(service.rejectLeave('tenant-1', 'leave-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLeaveBalance', () => {
    it('should calculate leave balance correctly', async () => {
      const approvedLeaves = [
        { ...mockLeave, days: 3, status: LeaveStatus.APPROVED, startDate: new Date('2024-03-15') },
        { ...mockLeave, id: 'leave-2', days: 2, status: LeaveStatus.APPROVED, startDate: new Date('2024-06-10') },
      ];
      jest.spyOn(leaveRepository, 'find').mockResolvedValue(approvedLeaves as Leave[]);

      const result = await service.getLeaveBalance('tenant-1', 'employee-1', 2024);

      expect(result).toEqual({
        year: 2024,
        totalDaysTaken: 5,
        annualLeaveAllowance: 12,
        remainingDays: 7,
      });
      expect(leaveRepository.find).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          employeeId: 'employee-1',
          status: LeaveStatus.APPROVED,
        },
      });
    });

    it('should only count approved leaves in year range', async () => {
      const approvedLeaves = [
        { ...mockLeave, days: 3, status: LeaveStatus.APPROVED, startDate: new Date('2024-03-15') },
      ];
      jest.spyOn(leaveRepository, 'find').mockResolvedValue(approvedLeaves as Leave[]);

      const result = await service.getLeaveBalance('tenant-1', 'employee-1', 2024);

      expect(result.totalDaysTaken).toBe(3);
      expect(result.remainingDays).toBe(9);
    });
  });
});
