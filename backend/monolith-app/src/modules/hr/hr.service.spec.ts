import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HrService } from './hr.service';
import { Employee, EmploymentStatus } from './entities/employee.entity';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { Leave, LeaveStatus } from './entities/leave.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';

describe('HrService', () => {
  let service: HrService;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockEmployeeRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockAttendanceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockLeaveRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrService,
        {
          provide: getRepositoryToken(Employee),
          useValue: mockEmployeeRepository,
        },
        {
          provide: getRepositoryToken(Attendance),
          useValue: mockAttendanceRepository,
        },
        {
          provide: getRepositoryToken(Leave),
          useValue: mockLeaveRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<HrService>(HrService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Employees Management', () => {
    it('should find all employees', async () => {
      const mockEmployees = [{ id: '1', email: 'emp@test.com' }];
      mockQueryBuilder.getMany.mockResolvedValue(mockEmployees);

      const result = await service.findAllEmployees('tenant-1');

      expect(result).toEqual(mockEmployees);
      expect(mockEmployeeRepository.createQueryBuilder).toHaveBeenCalledWith('employee');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'employee.id',
        'employee.firstName',
        'employee.lastName',
        'employee.email',
        'employee.phone',
        'employee.department',
        'employee.position',
        'employee.status',
        'employee.hireDate',
        'employee.createdAt',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('employee.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('employee.createdAt', 'DESC');
    });

    it('should find employee by id', async () => {
      const mockEmployee = { id: '1', email: 'emp@test.com' };
      mockCacheService.getOrSet.mockResolvedValue(mockEmployee);

      const result = await service.findEmployeeById('tenant-1', '1');

      expect(result).toEqual(mockEmployee);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if employee not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockEmployeeRepository.findOne.mockResolvedValue(null);

      await expect(service.findEmployeeById('tenant-1', '999')).rejects.toThrow(NotFoundException);
    });

    it('should create employee', async () => {
      const employeeData = { email: 'new@emp.com', firstName: 'John' };
      mockEmployeeRepository.findOne.mockResolvedValue(null);
      mockEmployeeRepository.create.mockReturnValue(employeeData);
      mockEmployeeRepository.save.mockResolvedValue(employeeData);

      const result = await service.createEmployee('tenant-1', employeeData);

      expect(result).toEqual(employeeData);
    });

    it('should throw ConflictException if email exists', async () => {
      const employeeData = { email: 'existing@emp.com' };
      mockEmployeeRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.createEmployee('tenant-1', employeeData)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should update employee', async () => {
      const mockEmployee = { id: '1', email: 'emp@test.com' };
      mockCacheService.getOrSet.mockResolvedValue(mockEmployee);
      mockCacheService.del.mockResolvedValue(undefined);
      mockEmployeeRepository.save.mockResolvedValue({
        ...mockEmployee,
        firstName: 'Updated',
      });

      const result = await service.updateEmployee('tenant-1', '1', {
        firstName: 'Updated',
      });

      expect(result.firstName).toBe('Updated');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should find employees by department', async () => {
      const mockEmployees = [{ id: '1', department: 'IT' }];
      mockQueryBuilder.getMany.mockResolvedValue(mockEmployees);

      const result = await service.findEmployeesByDepartment('tenant-1', 'IT');

      expect(result).toEqual(mockEmployees);
      expect(mockEmployeeRepository.createQueryBuilder).toHaveBeenCalledWith('employee');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'employee.id',
        'employee.firstName',
        'employee.lastName',
        'employee.email',
        'employee.position',
        'employee.status',
        'employee.hireDate',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('employee.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('employee.department = :department', {
        department: 'IT',
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('employee.lastName', 'ASC');
    });

    it('should find employees by status', async () => {
      const mockEmployees = [{ id: '1', status: EmploymentStatus.ACTIVE }];
      mockQueryBuilder.getMany.mockResolvedValue(mockEmployees);

      const result = await service.findEmployeesByStatus('tenant-1', EmploymentStatus.ACTIVE);

      expect(result).toEqual(mockEmployees);
      expect(mockEmployeeRepository.createQueryBuilder).toHaveBeenCalledWith('employee');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'employee.id',
        'employee.firstName',
        'employee.lastName',
        'employee.email',
        'employee.department',
        'employee.position',
        'employee.status',
        'employee.hireDate',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('employee.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('employee.status = :status', {
        status: EmploymentStatus.ACTIVE,
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('employee.lastName', 'ASC');
    });
  });

  describe('Attendance Management', () => {
    it('should find all attendance', async () => {
      const mockAttendance = [{ id: '1', employeeId: 'emp-1' }];
      mockAttendanceRepository.find.mockResolvedValue(mockAttendance);

      const result = await service.findAllAttendance('tenant-1');

      expect(result).toEqual(mockAttendance);
    });

    it('should find attendance by id', async () => {
      const mockAttendance = { id: '1', employeeId: 'emp-1' };
      mockCacheService.getOrSet.mockResolvedValue(mockAttendance);

      const result = await service.findAttendanceById('tenant-1', '1');

      expect(result).toEqual(mockAttendance);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if attendance not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockAttendanceRepository.findOne.mockResolvedValue(null);

      await expect(service.findAttendanceById('tenant-1', '999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create attendance', async () => {
      const attendanceData = {
        employeeId: 'emp-1',
        date: new Date(),
        status: AttendanceStatus.PRESENT,
      };
      mockCacheService.getOrSet.mockResolvedValue({ id: 'emp-1' });
      mockAttendanceRepository.create.mockReturnValue(attendanceData);
      mockAttendanceRepository.save.mockResolvedValue(attendanceData);

      const result = await service.createAttendance('tenant-1', attendanceData);

      expect(result).toEqual(attendanceData);
    });

    it('should get attendance statistics', async () => {
      const mockAttendance = [
        { id: '1', status: AttendanceStatus.PRESENT },
        { id: '2', status: AttendanceStatus.PRESENT },
        { id: '3', status: AttendanceStatus.ABSENT },
        { id: '4', status: AttendanceStatus.LATE },
        { id: '5', status: AttendanceStatus.HALF_DAY },
      ];
      mockAttendanceRepository.find.mockResolvedValue(mockAttendance);

      const result = await service.getAttendanceStatistics(
        'tenant-1',
        'emp-1',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result.total).toBe(5);
      expect(result.present).toBe(2);
      expect(result.absent).toBe(1);
      expect(result.late).toBe(1);
      expect(result.halfDay).toBe(1);
      expect(result.attendanceRate).toBe(40);
    });
  });

  describe('Leave Management', () => {
    it('should find all leaves', async () => {
      const mockLeaves = [{ id: '1', employeeId: 'emp-1' }];
      mockLeaveRepository.find.mockResolvedValue(mockLeaves);

      const result = await service.findAllLeaves('tenant-1');

      expect(result).toEqual(mockLeaves);
    });

    it('should find leave by id', async () => {
      const mockLeave = { id: '1', employeeId: 'emp-1' };
      mockCacheService.getOrSet.mockResolvedValue(mockLeave);

      const result = await service.findLeaveById('tenant-1', '1');

      expect(result).toEqual(mockLeave);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if leave not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockLeaveRepository.findOne.mockResolvedValue(null);

      await expect(service.findLeaveById('tenant-1', '999')).rejects.toThrow(NotFoundException);
    });

    it('should create leave with calculated days', async () => {
      const leaveData = {
        employeeId: 'emp-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
      };
      mockCacheService.getOrSet.mockResolvedValue({ id: 'emp-1' });
      mockLeaveRepository.create.mockReturnValue({
        ...leaveData,
        days: 5,
      });
      mockLeaveRepository.save.mockResolvedValue({
        ...leaveData,
        days: 5,
      });

      const result = await service.createLeave('tenant-1', leaveData);

      expect(result.days).toBe(5);
    });

    it('should approve leave', async () => {
      const mockLeave = { id: '1', status: LeaveStatus.PENDING };
      mockCacheService.getOrSet.mockResolvedValue(mockLeave);
      mockCacheService.del.mockResolvedValue(undefined);
      mockLeaveRepository.save.mockResolvedValue({
        ...mockLeave,
        status: LeaveStatus.APPROVED,
        approvedBy: 'manager-1',
        approvedAt: expect.any(Date),
      });

      const result = await service.approveLeave('tenant-1', '1', 'manager-1');

      expect(result.status).toBe(LeaveStatus.APPROVED);
      expect(result.approvedBy).toBe('manager-1');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw error if leave not pending', async () => {
      const mockLeave = { id: '1', status: LeaveStatus.APPROVED };
      mockCacheService.getOrSet.mockResolvedValue(mockLeave);

      await expect(service.approveLeave('tenant-1', '1', 'manager-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject leave', async () => {
      const mockLeave = { id: '1', status: LeaveStatus.PENDING };
      mockCacheService.getOrSet.mockResolvedValue(mockLeave);
      mockCacheService.del.mockResolvedValue(undefined);
      mockLeaveRepository.save.mockResolvedValue({
        ...mockLeave,
        status: LeaveStatus.REJECTED,
      });

      const result = await service.rejectLeave('tenant-1', '1');

      expect(result.status).toBe(LeaveStatus.REJECTED);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should get leave balance', async () => {
      const mockLeaves = [
        {
          id: '1',
          employeeId: 'emp-1',
          status: LeaveStatus.APPROVED,
          startDate: new Date('2024-03-01'),
          days: 3,
        },
        {
          id: '2',
          employeeId: 'emp-1',
          status: LeaveStatus.APPROVED,
          startDate: new Date('2024-06-01'),
          days: 5,
        },
      ];
      mockLeaveRepository.find.mockResolvedValue(mockLeaves);

      const result = await service.getLeaveBalance('tenant-1', 'emp-1', 2024);

      expect(result.year).toBe(2024);
      expect(result.totalDaysTaken).toBe(8);
      expect(result.annualLeaveAllowance).toBe(12);
      expect(result.remainingDays).toBe(4);
    });
  });
});
