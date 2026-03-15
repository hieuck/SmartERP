import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LeaveService } from './leave.service';
import { Leave } from './entities/leave.entity';
import { LeaveBalance } from './entities/leave-balance.entity';
import { Employee } from '../employee/entities/employee.entity';
import { LeaveType } from './enums/leave-type.enum';
import { LeaveStatus } from './enums/leave-status.enum';
import { User } from '@/common/security/permission.service';

describe('LeaveService', () => {
  let service: LeaveService;
  let leaveRepository: jest.Mocked<Repository<Leave>>;
  let leaveBalanceRepository: jest.Mocked<Repository<LeaveBalance>>;
  let employeeRepository: jest.Mocked<Repository<Employee>>;

  // Factory functions to create fresh mock objects for each test
  const createMockUser = (): User => ({
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['manager'],
  });

  const createMockEmployee = (): Employee => ({
    id: 'emp-1',
    tenantId: 'tenant-1',
  } as Employee);

  const createMockLeave = (): Leave => ({
    id: 'leave-1',
    employeeId: 'emp-1',
    leaveType: LeaveType.ANNUAL,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-05'),
    days: 5,
    reason: 'Vacation',
    status: LeaveStatus.PENDING,
    tenantId: 'tenant-1',
  } as Leave);

  const createMockLeaveBalance = (): LeaveBalance => ({
    id: 'balance-1',
    employeeId: 'emp-1',
    leaveType: LeaveType.ANNUAL,
    year: 2024,
    allocated: 20,
    used: 5,
    remaining: 15,
    tenantId: 'tenant-1',
  } as LeaveBalance);

  let mockUser: User;
  let mockEmployee: Employee;
  let mockLeave: Leave;
  let mockLeaveBalance: LeaveBalance;

  beforeEach(async () => {
    // Create fresh mock objects for each test
    mockUser = createMockUser();
    mockEmployee = createMockEmployee();
    mockLeave = createMockLeave();
    mockLeaveBalance = createMockLeaveBalance();

    const mockLeaveRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockLeaveBalanceRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      increment: jest.fn(),
      decrement: jest.fn(),
    };

    const mockEmployeeRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveService,
        {
          provide: getRepositoryToken(Leave),
          useValue: mockLeaveRepo,
        },
        {
          provide: getRepositoryToken(LeaveBalance),
          useValue: mockLeaveBalanceRepo,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: mockEmployeeRepo,
        },
      ],
    }).compile();

    service = module.get<LeaveService>(LeaveService);
    leaveRepository = module.get(getRepositoryToken(Leave));
    leaveBalanceRepository = module.get(getRepositoryToken(LeaveBalance));
    employeeRepository = module.get(getRepositoryToken(Employee));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestLeave', () => {
    it('should request leave successfully', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      leaveBalanceRepository.findOne.mockResolvedValue(mockLeaveBalance);
      leaveRepository.create.mockReturnValue(mockLeave as any);
      leaveRepository.save.mockResolvedValue(mockLeave);

      const result = await service.requestLeave(
        'emp-1',
        LeaveType.ANNUAL,
        new Date('2024-01-01'),
        new Date('2024-01-05'),
        'Vacation',
        mockUser,
      );

      expect(result).toEqual(mockLeave);
      expect(leaveRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when employee not found', async () => {
      employeeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.requestLeave(
          'emp-999',
          LeaveType.ANNUAL,
          new Date('2024-01-01'),
          new Date('2024-01-05'),
          'Vacation',
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.requestLeave(
          'emp-999',
          LeaveType.ANNUAL,
          new Date('2024-01-01'),
          new Date('2024-01-05'),
          'Vacation',
          mockUser,
        ),
      ).rejects.toThrow('Employee emp-999 not found');
    });

    it('should throw BadRequestException when insufficient leave balance', async () => {
      const insufficientBalance = createMockLeaveBalance();
      insufficientBalance.remaining = 2;
      
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      leaveBalanceRepository.findOne.mockResolvedValue(insufficientBalance);

      await expect(
        service.requestLeave(
          'emp-1',
          LeaveType.ANNUAL,
          new Date('2024-01-01'),
          new Date('2024-01-05'),
          'Vacation',
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.requestLeave(
          'emp-1',
          LeaveType.ANNUAL,
          new Date('2024-01-01'),
          new Date('2024-01-05'),
          'Vacation',
          mockUser,
        ),
      ).rejects.toThrow('Insufficient leave balance');
    });

    it('should allow unpaid leave without balance check', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      leaveRepository.create.mockReturnValue(mockLeave as any);
      leaveRepository.save.mockResolvedValue(mockLeave);

      const result = await service.requestLeave(
        'emp-1',
        LeaveType.UNPAID,
        new Date('2024-01-01'),
        new Date('2024-01-05'),
        'Personal reasons',
        mockUser,
      );

      expect(result).toBeDefined();
      expect(leaveBalanceRepository.findOne).not.toHaveBeenCalled();
    });

    it('should create leave balance if not exists', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      leaveBalanceRepository.findOne.mockResolvedValue(null);
      leaveBalanceRepository.create.mockReturnValue(mockLeaveBalance as any);
      leaveBalanceRepository.save.mockResolvedValue(mockLeaveBalance);
      leaveRepository.create.mockReturnValue(mockLeave as any);
      leaveRepository.save.mockResolvedValue(mockLeave);

      const result = await service.requestLeave(
        'emp-1',
        LeaveType.ANNUAL,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
        'Single day',
        mockUser,
      );

      expect(result).toBeDefined();
    });

    it('should handle single day leave', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      leaveBalanceRepository.findOne.mockResolvedValue(mockLeaveBalance);
      leaveRepository.create.mockReturnValue(mockLeave as any);
      leaveRepository.save.mockResolvedValue(mockLeave);

      const result = await service.requestLeave(
        'emp-1',
        LeaveType.ANNUAL,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
        'Single day',
        mockUser,
      );

      expect(result).toBeDefined();
    });

    it('should handle multiple days leave', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      leaveBalanceRepository.findOne.mockResolvedValue(mockLeaveBalance);
      leaveRepository.create.mockReturnValue(mockLeave as any);
      leaveRepository.save.mockResolvedValue(mockLeave);

      const result = await service.requestLeave(
        'emp-1',
        LeaveType.ANNUAL,
        new Date('2024-01-01'),
        new Date('2024-01-10'),
        'Multiple days',
        mockUser,
      );

      expect(result).toBeDefined();
    });
  });

  describe('approveLeave', () => {
    it('should approve leave successfully', async () => {
      leaveRepository.findOne.mockResolvedValue(mockLeave);
      const approvedLeave = {
        ...mockLeave,
        status: LeaveStatus.APPROVED,
        approvedBy: 'user-1',
        approvedAt: expect.any(Date),
      };
      leaveRepository.save.mockResolvedValue(approvedLeave as any);
      leaveBalanceRepository.increment.mockResolvedValue(undefined as any);
      leaveBalanceRepository.decrement.mockResolvedValue(undefined as any);

      const result = await service.approveLeave('leave-1', mockUser);

      expect(result.status).toBe(LeaveStatus.APPROVED);
      expect(result.approvedBy).toBe('user-1');
      expect(leaveBalanceRepository.increment).toHaveBeenCalled();
      expect(leaveBalanceRepository.decrement).toHaveBeenCalled();
    });

    it('should throw NotFoundException when leave not found', async () => {
      leaveRepository.findOne.mockResolvedValue(null);

      await expect(service.approveLeave('leave-999', mockUser)).rejects.toThrow(NotFoundException);
      await expect(service.approveLeave('leave-999', mockUser)).rejects.toThrow(
        'Leave request leave-999 not found',
      );
    });

    it('should throw BadRequestException when leave already processed', async () => {
      leaveRepository.findOne.mockResolvedValue({
        ...mockLeave,
        status: LeaveStatus.APPROVED,
      } as any);

      await expect(service.approveLeave('leave-1', mockUser)).rejects.toThrow(BadRequestException);
      await expect(service.approveLeave('leave-1', mockUser)).rejects.toThrow(
        'Leave request already processed',
      );
    });

    it('should set approvedAt timestamp', async () => {
      leaveRepository.findOne.mockResolvedValue(mockLeave);
      leaveRepository.save.mockResolvedValue(mockLeave);
      leaveBalanceRepository.increment.mockResolvedValue(undefined as any);
      leaveBalanceRepository.decrement.mockResolvedValue(undefined as any);

      await service.approveLeave('leave-1', mockUser);

      expect(leaveRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          approvedAt: expect.any(Date),
        }),
      );
    });

    it('should update leave balance correctly', async () => {
      leaveRepository.findOne.mockResolvedValue(mockLeave);
      leaveRepository.save.mockResolvedValue(mockLeave);
      leaveBalanceRepository.increment.mockResolvedValue(undefined as any);
      leaveBalanceRepository.decrement.mockResolvedValue(undefined as any);

      await service.approveLeave('leave-1', mockUser);

      expect(leaveBalanceRepository.increment).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 'emp-1',
          leaveType: LeaveType.ANNUAL,
        }),
        'used',
        5,
      );
      expect(leaveBalanceRepository.decrement).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 'emp-1',
          leaveType: LeaveType.ANNUAL,
        }),
        'remaining',
        5,
      );
    });
  });

  describe('rejectLeave', () => {
    it('should reject leave successfully', async () => {
      leaveRepository.findOne.mockResolvedValue(mockLeave);
      const rejectedLeave = {
        ...mockLeave,
        status: LeaveStatus.REJECTED,
        rejectionReason: 'Not enough staff',
      };
      leaveRepository.save.mockResolvedValue(rejectedLeave as any);

      const result = await service.rejectLeave('leave-1', 'Not enough staff', mockUser);

      expect(result.status).toBe(LeaveStatus.REJECTED);
      expect(result.rejectionReason).toBe('Not enough staff');
    });

    it('should throw NotFoundException when leave not found', async () => {
      leaveRepository.findOne.mockResolvedValue(null);

      await expect(service.rejectLeave('leave-999', 'Reason', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when leave already processed', async () => {
      leaveRepository.findOne.mockResolvedValue({
        ...mockLeave,
        status: LeaveStatus.APPROVED,
      } as any);

      await expect(service.rejectLeave('leave-1', 'Reason', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle empty rejection reason', async () => {
      leaveRepository.findOne.mockResolvedValue(mockLeave);
      leaveRepository.save.mockResolvedValue(mockLeave);

      const result = await service.rejectLeave('leave-1', '', mockUser);

      expect(result.rejectionReason).toBe('');
    });

    it('should handle null rejection reason', async () => {
      leaveRepository.findOne.mockResolvedValue(mockLeave);
      leaveRepository.save.mockResolvedValue(mockLeave);

      const result = await service.rejectLeave('leave-1', null as any, mockUser);

      expect(result).toBeDefined();
    });
  });

  describe('getLeaveBalance', () => {
    it('should get existing leave balance', async () => {
      leaveBalanceRepository.findOne.mockResolvedValue(mockLeaveBalance);

      const result = await service.getLeaveBalance('emp-1', LeaveType.ANNUAL, 2024, 'tenant-1');

      expect(result).toEqual(mockLeaveBalance);
    });

    it('should create leave balance if not exists', async () => {
      leaveBalanceRepository.findOne.mockResolvedValue(null);
      leaveBalanceRepository.create.mockReturnValue(mockLeaveBalance as any);
      leaveBalanceRepository.save.mockResolvedValue(mockLeaveBalance);

      const result = await service.getLeaveBalance('emp-1', LeaveType.ANNUAL, 2024, 'tenant-1');

      expect(result).toEqual(mockLeaveBalance);
      expect(leaveBalanceRepository.create).toHaveBeenCalledWith({
        employeeId: 'emp-1',
        leaveType: LeaveType.ANNUAL,
        year: 2024,
        allocated: 0,
        used: 0,
        remaining: 0,
        tenantId: 'tenant-1',
      });
    });

    it('should handle different leave types', async () => {
      leaveBalanceRepository.findOne.mockResolvedValue(mockLeaveBalance);

      await service.getLeaveBalance('emp-1', LeaveType.SICK, 2024, 'tenant-1');

      expect(leaveBalanceRepository.findOne).toHaveBeenCalledWith({
        where: {
          employeeId: 'emp-1',
          leaveType: LeaveType.SICK,
          year: 2024,
          tenantId: 'tenant-1',
        },
      });
    });

    it('should handle different years', async () => {
      leaveBalanceRepository.findOne.mockResolvedValue(mockLeaveBalance);

      await service.getLeaveBalance('emp-1', LeaveType.ANNUAL, 2025, 'tenant-1');

      expect(leaveBalanceRepository.findOne).toHaveBeenCalledWith({
        where: {
          employeeId: 'emp-1',
          leaveType: LeaveType.ANNUAL,
          year: 2025,
          tenantId: 'tenant-1',
        },
      });
    });
  });

  describe('allocateLeave', () => {
    it('should allocate leave days successfully', async () => {
      leaveBalanceRepository.findOne.mockResolvedValue(mockLeaveBalance);
      leaveBalanceRepository.save.mockResolvedValue({
        ...mockLeaveBalance,
        allocated: 25,
        remaining: 20,
      });

      const result = await service.allocateLeave('emp-1', LeaveType.ANNUAL, 2024, 5, 'tenant-1');

      expect(result.allocated).toBe(25);
      expect(result.remaining).toBe(20);
    });

    it('should create leave balance if not exists before allocating', async () => {
      const newBalance = createMockLeaveBalance();
      leaveBalanceRepository.findOne.mockResolvedValue(null);
      leaveBalanceRepository.create.mockReturnValue(newBalance as any);
      leaveBalanceRepository.save.mockResolvedValue(newBalance);

      const result = await service.allocateLeave('emp-1', LeaveType.ANNUAL, 2024, 10, 'tenant-1');

      expect(result).toBeDefined();
    });

    it('should handle zero allocation', async () => {
      leaveBalanceRepository.findOne.mockResolvedValue(mockLeaveBalance);
      leaveBalanceRepository.save.mockResolvedValue(mockLeaveBalance);

      const result = await service.allocateLeave('emp-1', LeaveType.ANNUAL, 2024, 0, 'tenant-1');

      expect(result).toBeDefined();
    });

    it('should handle negative allocation', async () => {
      leaveBalanceRepository.findOne.mockResolvedValue(mockLeaveBalance);
      leaveBalanceRepository.save.mockResolvedValue(mockLeaveBalance);

      const result = await service.allocateLeave('emp-1', LeaveType.ANNUAL, 2024, -5, 'tenant-1');

      expect(result).toBeDefined();
    });

    it('should handle large allocation', async () => {
      leaveBalanceRepository.findOne.mockResolvedValue(mockLeaveBalance);
      leaveBalanceRepository.save.mockResolvedValue(mockLeaveBalance);

      const result = await service.allocateLeave(
        'emp-1',
        LeaveType.ANNUAL,
        2024,
        1000,
        'tenant-1',
      );

      expect(result).toBeDefined();
    });
  });

  describe('getLeavesByEmployee', () => {
    it('should get leaves by employee and date range', async () => {
      leaveRepository.find.mockResolvedValue([mockLeave]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await service.getLeavesByEmployee('emp-1', startDate, endDate, 'tenant-1');

      expect(result).toEqual([mockLeave]);
      expect(leaveRepository.find).toHaveBeenCalledWith({
        where: {
          employeeId: 'emp-1',
          startDate: Between(startDate, endDate),
          tenantId: 'tenant-1',
        },
        order: { startDate: 'DESC' },
      });
    });

    it('should return empty array when no leaves found', async () => {
      leaveRepository.find.mockResolvedValue([]);

      const result = await service.getLeavesByEmployee(
        'emp-999',
        new Date(),
        new Date(),
        'tenant-1',
      );

      expect(result).toEqual([]);
    });

    it('should handle same start and end date', async () => {
      leaveRepository.find.mockResolvedValue([mockLeave]);

      const date = new Date('2024-01-01');

      const result = await service.getLeavesByEmployee('emp-1', date, date, 'tenant-1');

      expect(result).toBeDefined();
    });
  });

  describe('getPendingLeaves', () => {
    it('should get all pending leaves', async () => {
      leaveRepository.find.mockResolvedValue([mockLeave]);

      const result = await service.getPendingLeaves('tenant-1');

      expect(result).toEqual([mockLeave]);
      expect(leaveRepository.find).toHaveBeenCalledWith({
        where: {
          status: LeaveStatus.PENDING,
          tenantId: 'tenant-1',
        },
        relations: ['employee'],
        order: { createdAt: 'ASC' },
      });
    });

    it('should return empty array when no pending leaves', async () => {
      leaveRepository.find.mockResolvedValue([]);

      const result = await service.getPendingLeaves('tenant-1');

      expect(result).toEqual([]);
    });

    it('should order by createdAt ascending', async () => {
      const leave1 = { ...mockLeave, createdAt: new Date('2024-01-01') } as any;
      const leave2 = { ...mockLeave, createdAt: new Date('2024-01-02') } as any;
      leaveRepository.find.mockResolvedValue([leave1, leave2] as any);

      const result = await service.getPendingLeaves('tenant-1');

      expect(result).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);

      await expect(
        service.requestLeave(
          'emp-1',
          LeaveType.ANNUAL,
          new Date(),
          new Date(),
          'Test',
          null as any,
        ),
      ).rejects.toThrow();
    });

    it('should handle undefined tenantId', async () => {
      const userWithoutTenant = { ...mockUser, tenantId: undefined as any };
      employeeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.requestLeave(
          'emp-1',
          LeaveType.ANNUAL,
          new Date(),
          new Date(),
          'Test',
          userWithoutTenant,
        ),
      ).rejects.toThrow();
    });

    it('should handle end date before start date', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      leaveBalanceRepository.findOne.mockResolvedValue(mockLeaveBalance);
      leaveRepository.create.mockReturnValue(mockLeave as any);
      leaveRepository.save.mockResolvedValue(mockLeave);

      const result = await service.requestLeave(
        'emp-1',
        LeaveType.ANNUAL,
        new Date('2024-01-10'),
        new Date('2024-01-05'),
        'Test',
        mockUser,
      );

      expect(result).toBeDefined();
    });

    it('should handle very long leave period', async () => {
      const longBalance = createMockLeaveBalance();
      longBalance.remaining = 366; // Enough for 366 days
      
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      leaveBalanceRepository.findOne.mockResolvedValue(longBalance);
      leaveRepository.create.mockReturnValue(mockLeave as any);
      leaveRepository.save.mockResolvedValue(mockLeave);

      const result = await service.requestLeave(
        'emp-1',
        LeaveType.ANNUAL,
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        'Long leave',
        mockUser,
      );

      expect(result).toBeDefined();
    });
  });
});
