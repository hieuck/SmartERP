import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { Leave } from './entities/leave.entity';
import { LeaveBalance } from './entities/leave-balance.entity';
import { LeaveType } from './enums/leave-type.enum';
import { LeaveStatus } from './enums/leave-status.enum';
import { Employee } from '../employee/entities/employee.entity';
import { User } from '@/common/security/permission.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('LeaveService', () => {
  let service: LeaveService;
  let leaveRepository: Repository<Leave>;
  let leaveBalanceRepository: Repository<LeaveBalance>;
  let employeeRepository: Repository<Employee>;

  const mockEmployee: Employee = {
    id: 'emp-1',
    tenantId: 'tenant-1',
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Employee;

  const mockLeaveRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockLeaveBalanceRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
  };

  const mockEmployeeRepository = {
    findOne: jest.fn(),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveService,
        {
          provide: getRepositoryToken(Leave),
          useValue: mockLeaveRepository,
        },
        {
          provide: getRepositoryToken(LeaveBalance),
          useValue: mockLeaveBalanceRepository,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: mockEmployeeRepository,
        },
      ],
    }).compile();

    service = module.get<LeaveService>(LeaveService);
    leaveRepository = module.get<Repository<Leave>>(getRepositoryToken(Leave));
    leaveBalanceRepository = module.get<Repository<LeaveBalance>>(
      getRepositoryToken(LeaveBalance),
    );
    employeeRepository = module.get<Repository<Employee>>(
      getRepositoryToken(Employee),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestLeave', () => {
    it('should create leave request successfully', async () => {
      const startDate = new Date('2026-03-10');
      const endDate = new Date('2026-03-12');

      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      mockLeaveBalanceRepository.findOne.mockResolvedValue({
        id: 'balance-1',
        employeeId: mockEmployee.id,
        leaveType: LeaveType.ANNUAL,
        year: 2026,
        allocated: 20,
        used: 5,
        remaining: 15,
      });
      mockLeaveRepository.create.mockReturnValue({
        employeeId: mockEmployee.id,
        leaveType: LeaveType.ANNUAL,
        startDate,
        endDate,
        days: 3,
        status: LeaveStatus.PENDING,
        tenantId: mockUser.tenantId,
      });
      mockLeaveRepository.save.mockResolvedValue({
        id: 'leave-1',
        employeeId: mockEmployee.id,
        leaveType: LeaveType.ANNUAL,
        startDate,
        endDate,
        days: 3,
        status: LeaveStatus.PENDING,
        tenantId: mockUser.tenantId,
      });

      const result = await service.requestLeave(
        mockEmployee.id,
        LeaveType.ANNUAL,
        startDate,
        endDate,
        'Vacation',
        mockUser,
      );

      expect(result.status).toBe(LeaveStatus.PENDING);
      expect(mockLeaveRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if employee not found', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.requestLeave(
          'invalid-emp',
          LeaveType.ANNUAL,
          new Date(),
          new Date(),
          'Vacation',
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if insufficient leave balance', async () => {
      const startDate = new Date('2026-03-10');
      const endDate = new Date('2026-03-20'); // 11 days

      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      mockLeaveBalanceRepository.findOne.mockResolvedValue({
        id: 'balance-1',
        employeeId: mockEmployee.id,
        leaveType: LeaveType.ANNUAL,
        year: 2026,
        allocated: 20,
        used: 15,
        remaining: 5, // Only 5 days remaining
      });

      await expect(
        service.requestLeave(
          mockEmployee.id,
          LeaveType.ANNUAL,
          startDate,
          endDate,
          'Vacation',
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveLeave', () => {
    it('should approve leave request and update balance', async () => {
      const leave = {
        id: 'leave-1',
        employeeId: mockEmployee.id,
        leaveType: LeaveType.ANNUAL,
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-12'),
        days: 3,
        status: LeaveStatus.PENDING,
        tenantId: mockUser.tenantId,
      };

      mockLeaveRepository.findOne.mockResolvedValue(leave);
      mockLeaveRepository.save.mockResolvedValue({
        ...leave,
        status: LeaveStatus.APPROVED,
        approvedBy: mockUser.id,
        approvedAt: new Date(),
      });

      const result = await service.approveLeave('leave-1', mockUser);

      expect(result.status).toBe(LeaveStatus.APPROVED);
      expect(mockLeaveBalanceRepository.increment).toHaveBeenCalled();
      expect(mockLeaveBalanceRepository.decrement).toHaveBeenCalled();
    });

    it('should throw NotFoundException if leave not found', async () => {
      mockLeaveRepository.findOne.mockResolvedValue(null);

      await expect(service.approveLeave('invalid-leave', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if leave already processed', async () => {
      mockLeaveRepository.findOne.mockResolvedValue({
        id: 'leave-1',
        status: LeaveStatus.APPROVED,
      });

      await expect(service.approveLeave('leave-1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('rejectLeave', () => {
    it('should reject leave request', async () => {
      const leave = {
        id: 'leave-1',
        employeeId: mockEmployee.id,
        status: LeaveStatus.PENDING,
        tenantId: mockUser.tenantId,
      };

      mockLeaveRepository.findOne.mockResolvedValue(leave);
      mockLeaveRepository.save.mockResolvedValue({
        ...leave,
        status: LeaveStatus.REJECTED,
        rejectionReason: 'Insufficient coverage',
      });

      const result = await service.rejectLeave(
        'leave-1',
        'Insufficient coverage',
        mockUser,
      );

      expect(result.status).toBe(LeaveStatus.REJECTED);
      expect(result.rejectionReason).toBe('Insufficient coverage');
    });
  });

  describe('getLeaveBalance', () => {
    it('should return leave balance for employee', async () => {
      const balance = {
        id: 'balance-1',
        employeeId: mockEmployee.id,
        leaveType: LeaveType.ANNUAL,
        year: 2026,
        allocated: 20,
        used: 5,
        remaining: 15,
      };

      mockLeaveBalanceRepository.findOne.mockResolvedValue(balance);

      const result = await service.getLeaveBalance(
        mockEmployee.id,
        LeaveType.ANNUAL,
        2026,
        mockUser.tenantId,
      );

      expect(result).toEqual(balance);
    });

    it('should create new balance if not exists', async () => {
      const newBalance = {
        id: 'balance-1',
        employeeId: mockEmployee.id,
        leaveType: LeaveType.ANNUAL,
        year: 2026,
        allocated: 0,
        used: 0,
        remaining: 0,
      };

      mockLeaveBalanceRepository.findOne.mockResolvedValue(null);
      mockLeaveBalanceRepository.create.mockReturnValue(newBalance);
      mockLeaveBalanceRepository.save.mockResolvedValue(newBalance);

      const result = await service.getLeaveBalance(
        mockEmployee.id,
        LeaveType.ANNUAL,
        2026,
        mockUser.tenantId,
      );

      expect(result.allocated).toBe(0);
      expect(mockLeaveBalanceRepository.save).toHaveBeenCalled();
    });
  });

  describe('allocateLeave', () => {
    it('should allocate leave days to employee', async () => {
      const balance = {
        id: 'balance-1',
        employeeId: mockEmployee.id,
        leaveType: LeaveType.ANNUAL,
        year: 2026,
        allocated: 20,
        used: 5,
        remaining: 15,
      };

      mockLeaveBalanceRepository.findOne.mockResolvedValue(balance);
      mockLeaveBalanceRepository.save.mockResolvedValue({
        ...balance,
        allocated: 25,
        remaining: 20,
      });

      const result = await service.allocateLeave(
        mockEmployee.id,
        LeaveType.ANNUAL,
        2026,
        5,
        mockUser.tenantId,
      );

      expect(result.allocated).toBe(25);
      expect(result.remaining).toBe(20);
    });
  });
});
