import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
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

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockEmployeeId = 'employee-123';

  const mockUser: User = {
    id: mockUserId,
    tenantId: mockTenantId,
    roles: [],
  };

  const mockEmployee = {
    id: mockEmployeeId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    tenantId: mockTenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Employee;

  const mockLeave = {
    id: 'leave-123',
    employeeId: mockEmployeeId,
    employee: mockEmployee,
    leaveType: LeaveType.ANNUAL,
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-03-05'),
    days: 5,
    status: LeaveStatus.PENDING,
    reason: 'Vacation',
    rejectionReason: null,
    approvedBy: null,
    approvedAt: null,
    tenantId: mockTenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
    calculateDays: jest.fn(),
    validateDates: jest.fn(),
  } as unknown as Leave;

  const mockLeaveBalance = {
    id: 'balance-123',
    employeeId: mockEmployeeId,
    employee: mockEmployee,
    leaveType: LeaveType.ANNUAL,
    year: 2024,
    allocated: 20,
    used: 5,
    remaining: 15,
    tenantId: mockTenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as LeaveBalance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveService,
        {
          provide: getRepositoryToken(Leave),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LeaveBalance),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: {
            findOne: jest.fn(),
          },
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
    it('should successfully request leave with sufficient balance', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      leaveBalanceRepository.findOne.mockResolvedValue(mockLeaveBalance);
      leaveRepository.create.mockReturnValue(mockLeave);
      leaveRepository.save.mockResolvedValue(mockLeave);

      const result = await service.requestLeave(
        mockEmployeeId,
        LeaveType.ANNUAL,
        new Date('2024-03-01'),
        new Date('2024-03-05'),
        'Vacation',
        mockUser,
      );

      expect(employeeRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockEmployeeId, tenantId: mockTenantId },
      });
      expect(leaveBalanceRepository.findOne).toHaveBeenCalledWith({
        where: {
          employeeId: mockEmployeeId,
          leaveType: LeaveType.ANNUAL,
          year: 2024,
          tenantId: mockTenantId,
        },
      });
      expect(leaveRepository.create).toHaveBeenCalled();
      expect(leaveRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockLeave);
    });

    it('should throw NotFoundException when employee not found', async () => {
      employeeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.requestLeave(
          mockEmployeeId,
          LeaveType.ANNUAL,
          new Date('2024-03-01'),
          new Date('2024-03-05'),
          'Vacation',
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(employeeRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockEmployeeId, tenantId: mockTenantId },
      });
      expect(leaveBalanceRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when insufficient balance', async () => {
      const insufficientBalance = {
        ...mockLeaveBalance,
        remaining: 2,
      };

      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      leaveBalanceRepository.findOne.mockResolvedValue(insufficientBalance);

      await expect(
        service.requestLeave(
          mockEmployeeId,
          LeaveType.ANNUAL,
          new Date('2024-03-01'),
          new Date('2024-03-05'),
          'Vacation',
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(leaveBalanceRepository.findOne).toHaveBeenCalled();
      expect(leaveRepository.create).not.toHaveBeenCalled();
    });

    it('should allow unpaid leave without checking balance', async () => {
      const unpaidLeave = {
        ...mockLeave,
        leaveType: LeaveType.UNPAID,
        calculateDays: jest.fn(),
        validateDates: jest.fn(),
      };

      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      leaveRepository.create.mockReturnValue(unpaidLeave as unknown as Leave);
      leaveRepository.save.mockResolvedValue(unpaidLeave as unknown as Leave);

      const result = await service.requestLeave(
        mockEmployeeId,
        LeaveType.UNPAID,
        new Date('2024-03-01'),
        new Date('2024-03-05'),
        'Personal reasons',
        mockUser,
      );

      expect(leaveBalanceRepository.findOne).not.toHaveBeenCalled();
      expect(leaveRepository.save).toHaveBeenCalled();
      expect(result.leaveType).toBe(LeaveType.UNPAID);
    });

    it('should create new balance if not exists for paid leave', async () => {
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      leaveBalanceRepository.findOne.mockResolvedValue(null);
      
      const newBalance = {
        ...mockLeaveBalance,
        allocated: 0,
        used: 0,
        remaining: 0,
      };
      
      leaveBalanceRepository.create.mockReturnValue(newBalance);
      leaveBalanceRepository.save.mockResolvedValue(newBalance);

      await expect(
        service.requestLeave(
          mockEmployeeId,
          LeaveType.ANNUAL,
          new Date('2024-03-01'),
          new Date('2024-03-05'),
          'Vacation',
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(leaveBalanceRepository.create).toHaveBeenCalled();
      expect(leaveBalanceRepository.save).toHaveBeenCalled();
    });
  });

  describe('approveLeave', () => {
    it('should successfully approve pending leave', async () => {
      const pendingLeave = {
        ...mockLeave,
        status: LeaveStatus.PENDING,
        calculateDays: jest.fn(),
        validateDates: jest.fn(),
      };
      const approvedLeave = {
        ...pendingLeave,
        status: LeaveStatus.APPROVED,
        approvedBy: mockUserId,
        approvedAt: expect.any(Date),
      };

      leaveRepository.findOne.mockResolvedValue(pendingLeave as unknown as Leave);
      leaveBalanceRepository.increment = jest.fn().mockResolvedValue(undefined);
      leaveBalanceRepository.decrement = jest.fn().mockResolvedValue(undefined);
      leaveRepository.save.mockResolvedValue(approvedLeave as unknown as Leave);

      const result = await service.approveLeave('leave-123', mockUser);

      expect(leaveRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'leave-123', tenantId: mockTenantId },
      });
      expect(result.status).toBe(LeaveStatus.APPROVED);
      expect(result.approvedBy).toBe(mockUserId);
    });

    it('should throw NotFoundException when leave not found', async () => {
      leaveRepository.findOne.mockResolvedValue(null);

      await expect(
        service.approveLeave('leave-123', mockUser),
      ).rejects.toThrow(NotFoundException);

      expect(leaveRepository.findOne).toHaveBeenCalled();
      expect(leaveRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when leave already processed', async () => {
      const approvedLeave = {
        ...mockLeave,
        status: LeaveStatus.APPROVED,
        calculateDays: jest.fn(),
        validateDates: jest.fn(),
      };
      leaveRepository.findOne.mockResolvedValue(approvedLeave as unknown as Leave);

      await expect(
        service.approveLeave('leave-123', mockUser),
      ).rejects.toThrow(BadRequestException);

      expect(leaveRepository.save).not.toHaveBeenCalled();
    });

    it('should update balance when approving paid leave', async () => {
      const pendingLeave = {
        ...mockLeave,
        status: LeaveStatus.PENDING,
        calculateDays: jest.fn(),
        validateDates: jest.fn(),
      };

      leaveRepository.findOne.mockResolvedValue(pendingLeave as unknown as Leave);
      leaveBalanceRepository.increment = jest.fn().mockResolvedValue(undefined);
      leaveBalanceRepository.decrement = jest.fn().mockResolvedValue(undefined);
      leaveRepository.save.mockResolvedValue({
        ...pendingLeave,
        status: LeaveStatus.APPROVED,
      } as unknown as Leave);

      await service.approveLeave('leave-123', mockUser);

      expect(leaveBalanceRepository.increment).toHaveBeenCalledWith(
        {
          employeeId: mockEmployeeId,
          leaveType: LeaveType.ANNUAL,
          year: 2024,
          tenantId: mockTenantId,
        },
        'used',
        5,
      );
      expect(leaveBalanceRepository.decrement).toHaveBeenCalledWith(
        {
          employeeId: mockEmployeeId,
          leaveType: LeaveType.ANNUAL,
          year: 2024,
          tenantId: mockTenantId,
        },
        'remaining',
        5,
      );
    });
  });

  describe('rejectLeave', () => {
    it('should successfully reject pending leave', async () => {
      const pendingLeave = {
        ...mockLeave,
        status: LeaveStatus.PENDING,
        calculateDays: jest.fn(),
        validateDates: jest.fn(),
      };
      const rejectedLeave = {
        ...pendingLeave,
        status: LeaveStatus.REJECTED,
        rejectionReason: 'Not enough coverage',
      };

      leaveRepository.findOne.mockResolvedValue(pendingLeave as unknown as Leave);
      leaveRepository.save.mockResolvedValue(rejectedLeave as unknown as Leave);

      const result = await service.rejectLeave(
        'leave-123',
        'Not enough coverage',
        mockUser,
      );

      expect(leaveRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'leave-123', tenantId: mockTenantId },
      });
      expect(result.status).toBe(LeaveStatus.REJECTED);
      expect(result.rejectionReason).toBe('Not enough coverage');
    });

    it('should throw NotFoundException when leave not found', async () => {
      leaveRepository.findOne.mockResolvedValue(null);

      await expect(
        service.rejectLeave('leave-123', 'Reason', mockUser),
      ).rejects.toThrow(NotFoundException);

      expect(leaveRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when leave already processed', async () => {
      const rejectedLeave = {
        ...mockLeave,
        status: LeaveStatus.REJECTED,
        calculateDays: jest.fn(),
        validateDates: jest.fn(),
      };
      leaveRepository.findOne.mockResolvedValue(rejectedLeave as unknown as Leave);

      await expect(
        service.rejectLeave('leave-123', 'Reason', mockUser),
      ).rejects.toThrow(BadRequestException);

      expect(leaveRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getLeaveBalance', () => {
    it('should return existing leave balance', async () => {
      leaveBalanceRepository.findOne.mockResolvedValue(mockLeaveBalance);

      const result = await service.getLeaveBalance(
        mockEmployeeId,
        LeaveType.ANNUAL,
        2024,
        mockTenantId,
      );

      expect(leaveBalanceRepository.findOne).toHaveBeenCalledWith({
        where: {
          employeeId: mockEmployeeId,
          leaveType: LeaveType.ANNUAL,
          year: 2024,
          tenantId: mockTenantId,
        },
      });
      expect(result).toEqual(mockLeaveBalance);
    });

    it('should create new balance if not exists', async () => {
      leaveBalanceRepository.findOne.mockResolvedValue(null);
      
      const newBalance = {
        ...mockLeaveBalance,
        allocated: 0,
        used: 0,
        remaining: 0,
      };
      
      leaveBalanceRepository.create.mockReturnValue(newBalance);
      leaveBalanceRepository.save.mockResolvedValue(newBalance);

      const result = await service.getLeaveBalance(
        mockEmployeeId,
        LeaveType.ANNUAL,
        2024,
        mockTenantId,
      );

      expect(leaveBalanceRepository.create).toHaveBeenCalledWith({
        employeeId: mockEmployeeId,
        leaveType: LeaveType.ANNUAL,
        year: 2024,
        allocated: 0,
        used: 0,
        remaining: 0,
        tenantId: mockTenantId,
      });
      expect(leaveBalanceRepository.save).toHaveBeenCalled();
      expect(result).toEqual(newBalance);
    });
  });

  describe('allocateLeave', () => {
    it('should allocate leave days correctly', async () => {
      leaveBalanceRepository.findOne.mockResolvedValue(mockLeaveBalance);
      
      const updatedBalance = {
        ...mockLeaveBalance,
        allocated: 25,
        remaining: 20,
      };
      
      leaveBalanceRepository.save.mockResolvedValue(updatedBalance);

      const result = await service.allocateLeave(
        mockEmployeeId,
        LeaveType.ANNUAL,
        2024,
        5,
        mockTenantId,
      );

      expect(leaveBalanceRepository.findOne).toHaveBeenCalled();
      expect(leaveBalanceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          allocated: 25,
          remaining: 20,
        }),
      );
      expect(result.allocated).toBe(25);
    });

    it('should create balance if not exists when allocating', async () => {
      // First call returns null (balance not exists)
      leaveBalanceRepository.findOne.mockResolvedValueOnce(null);
      
      const newBalance = {
        id: 'balance-new',
        employeeId: mockEmployeeId,
        employee: mockEmployee,
        leaveType: LeaveType.ANNUAL,
        year: 2024,
        allocated: 0,
        used: 0,
        remaining: 0,
        tenantId: mockTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      leaveBalanceRepository.create.mockReturnValue(newBalance);
      leaveBalanceRepository.save.mockResolvedValue(newBalance);

      const result = await service.allocateLeave(
        mockEmployeeId,
        LeaveType.ANNUAL,
        2024,
        20,
        mockTenantId,
      );

      expect(leaveBalanceRepository.create).toHaveBeenCalled();
      // After allocating 20 days to a new balance (0 + 20 = 20)
      expect(result.allocated).toBe(20);
      expect(result.remaining).toBe(20);
    });
  });

  describe('getLeavesByEmployee', () => {
    it('should return leaves for employee in date range', async () => {
      const leaves = [mockLeave];
      leaveRepository.find.mockResolvedValue(leaves);

      const result = await service.getLeavesByEmployee(
        mockEmployeeId,
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        mockTenantId,
      );

      expect(leaveRepository.find).toHaveBeenCalledWith({
        where: {
          employeeId: mockEmployeeId,
          startDate: expect.any(Object), // Between operator
          tenantId: mockTenantId,
        },
        order: { startDate: 'DESC' },
      });
      expect(result).toEqual(leaves);
    });

    it('should return empty array when no leaves found', async () => {
      leaveRepository.find.mockResolvedValue([]);

      const result = await service.getLeavesByEmployee(
        mockEmployeeId,
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        mockTenantId,
      );

      expect(result).toEqual([]);
    });
  });

  describe('getPendingLeaves', () => {
    it('should return pending leaves with employee relation', async () => {
      const pendingLeaves = [
        {
          ...mockLeave,
          status: LeaveStatus.PENDING,
          calculateDays: jest.fn(),
          validateDates: jest.fn(),
        },
      ];

      leaveRepository.find.mockResolvedValue(pendingLeaves as unknown as Leave[]);

      const result = await service.getPendingLeaves(mockTenantId);

      expect(leaveRepository.find).toHaveBeenCalledWith({
        where: {
          status: LeaveStatus.PENDING,
          tenantId: mockTenantId,
        },
        relations: ['employee'],
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(pendingLeaves);
    });

    it('should return empty array when no pending leaves', async () => {
      leaveRepository.find.mockResolvedValue([]);

      const result = await service.getPendingLeaves(mockTenantId);

      expect(result).toEqual([]);
    });
  });
});
