import { Test, TestingModule } from '@nestjs/testing';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { createMockUser } from '@/common/test/test-helpers';

describe('HrController', () => {
  let controller: HrController;
  let service: HrService;

  const mockHrService = {
    findAllEmployees: jest.fn(),
    findEmployeeById: jest.fn(),
    createEmployee: jest.fn(),
    updateEmployee: jest.fn(),
    deleteEmployee: jest.fn(),
    findAllAttendance: jest.fn(),
    createAttendance: jest.fn(),
    updateAttendance: jest.fn(),
    findAllLeaves: jest.fn(),
    createLeave: jest.fn(),
    approveLeave: jest.fn(),
    rejectLeave: jest.fn(),
  };

  const mockUser = createMockUser();

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HrController],
      providers: [
        {
          provide: HrService,
          useValue: mockHrService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<HrController>(HrController);
    service = module.get<HrService>(HrService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Employee Endpoints', () => {
    it('should find all employees', async () => {
      const tenantId = 'tenant-1';
      const mockEmployees = [{ id: '1', name: 'John' }];
      mockHrService.findAllEmployees.mockResolvedValue(mockEmployees);

      const result = await controller.findAllEmployees(tenantId);

      expect(result).toEqual(mockEmployees);
      expect(service.findAllEmployees).toHaveBeenCalledWith(tenantId);
    });

    it('should find employee by id', async () => {
      const tenantId = 'tenant-1';
      const employeeId = 'emp-1';
      const mockEmployee = { id: employeeId, name: 'John' };
      mockHrService.findEmployeeById.mockResolvedValue(mockEmployee);

      const result = await controller.findEmployeeById(tenantId, employeeId);

      expect(result).toEqual(mockEmployee);
      expect(service.findEmployeeById).toHaveBeenCalledWith(tenantId, employeeId);
    });

    it('should create employee', async () => {
      const tenantId = 'tenant-1';
      const createDto = { name: 'John', position: 'Developer' };
      const mockEmployee = { id: 'emp-1', ...createDto };
      mockHrService.createEmployee.mockResolvedValue(mockEmployee);

      const result = await controller.createEmployee(tenantId, createDto as any);

      expect(result).toEqual(mockEmployee);
      expect(service.createEmployee).toHaveBeenCalledWith(tenantId, createDto);
    });

    it('should update employee', async () => {
      const tenantId = 'tenant-1';
      const employeeId = 'emp-1';
      const updateDto = { position: 'Senior Developer' };
      const mockEmployee = { id: employeeId, name: 'John', ...updateDto };
      mockHrService.updateEmployee.mockResolvedValue(mockEmployee);

      const result = await controller.updateEmployee(tenantId, employeeId, updateDto as any);

      expect(result).toEqual(mockEmployee);
      expect(service.updateEmployee).toHaveBeenCalledWith(tenantId, employeeId, updateDto);
    });

    it('should delete employee', async () => {
      const tenantId = 'tenant-1';
      const employeeId = 'emp-1';
      mockHrService.deleteEmployee.mockResolvedValue(undefined);

      await controller.deleteEmployee(tenantId, employeeId);

      expect(service.deleteEmployee).toHaveBeenCalledWith(tenantId, employeeId);
    });
  });

  describe('Attendance Endpoints', () => {
    it('should find all attendance with date range', async () => {
      const tenantId = 'tenant-1';
      const mockAttendance = [{ id: '1', date: '2024-01-01' }];
      mockHrService.findAllAttendance.mockResolvedValue(mockAttendance);

      const result = await controller.findAllAttendance(tenantId, '2024-01-01', '2024-01-31');

      expect(result).toEqual(mockAttendance);
      expect(service.findAllAttendance).toHaveBeenCalledWith(
        tenantId,
        undefined,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );
    });

    it('should find attendance by employee', async () => {
      const tenantId = 'tenant-1';
      const employeeId = 'emp-1';
      const mockAttendance = [{ id: '1', employeeId }];
      mockHrService.findAllAttendance.mockResolvedValue(mockAttendance);

      const result = await controller.findAttendanceByEmployee(tenantId, employeeId);

      expect(result).toEqual(mockAttendance);
      expect(service.findAllAttendance).toHaveBeenCalledWith(tenantId, employeeId);
    });

    it('should create attendance', async () => {
      const tenantId = 'tenant-1';
      const createDto = { employeeId: 'emp-1', date: '2024-01-01' };
      const mockAttendance = { id: 'att-1', ...createDto };
      mockHrService.createAttendance.mockResolvedValue(mockAttendance);

      const result = await controller.createAttendance(tenantId, createDto as any);

      expect(result).toEqual(mockAttendance);
      expect(service.createAttendance).toHaveBeenCalledWith(tenantId, createDto);
    });

    it('should update attendance', async () => {
      const tenantId = 'tenant-1';
      const attendanceId = 'att-1';
      const updateDto = { status: 'present' };
      const mockAttendance = { id: attendanceId, ...updateDto };
      mockHrService.updateAttendance.mockResolvedValue(mockAttendance);

      const result = await controller.updateAttendance(tenantId, attendanceId, updateDto as any);

      expect(result).toEqual(mockAttendance);
      expect(service.updateAttendance).toHaveBeenCalledWith(tenantId, attendanceId, updateDto);
    });
  });

  describe('Leave Endpoints', () => {
    it('should find all leaves', async () => {
      const tenantId = 'tenant-1';
      const mockLeaves = [{ id: '1', type: 'annual' }];
      mockHrService.findAllLeaves.mockResolvedValue(mockLeaves);

      const result = await controller.findAllLeaves(tenantId);

      expect(result).toEqual(mockLeaves);
      expect(service.findAllLeaves).toHaveBeenCalledWith(tenantId);
    });

    it('should find leaves by employee', async () => {
      const tenantId = 'tenant-1';
      const employeeId = 'emp-1';
      const mockLeaves = [{ id: '1', employeeId }];
      mockHrService.findAllLeaves.mockResolvedValue(mockLeaves);

      const result = await controller.findLeavesByEmployee(tenantId, employeeId);

      expect(result).toEqual(mockLeaves);
      expect(service.findAllLeaves).toHaveBeenCalledWith(tenantId, employeeId);
    });

    it('should create leave', async () => {
      const tenantId = 'tenant-1';
      const createDto = { employeeId: 'emp-1', type: 'annual' };
      const mockLeave = { id: 'leave-1', ...createDto };
      mockHrService.createLeave.mockResolvedValue(mockLeave);

      const result = await controller.createLeave(tenantId, createDto as any);

      expect(result).toEqual(mockLeave);
      expect(service.createLeave).toHaveBeenCalledWith(tenantId, createDto);
    });

    it('should approve leave', async () => {
      const tenantId = 'tenant-1';
      const leaveId = 'leave-1';
      const approvedBy = 'manager-1';
      const mockLeave = { id: leaveId, status: 'approved', approvedBy };
      mockHrService.approveLeave.mockResolvedValue(mockLeave);

      const result = await controller.approveLeave(tenantId, leaveId, approvedBy);

      expect(result).toEqual(mockLeave);
      expect(service.approveLeave).toHaveBeenCalledWith(tenantId, leaveId, approvedBy);
    });

    it('should reject leave', async () => {
      const tenantId = 'tenant-1';
      const leaveId = 'leave-1';
      const mockLeave = { id: leaveId, status: 'rejected' };
      mockHrService.rejectLeave.mockResolvedValue(mockLeave);

      const result = await controller.rejectLeave(tenantId, leaveId);

      expect(result).toEqual(mockLeave);
      expect(service.rejectLeave).toHaveBeenCalledWith(tenantId, leaveId);
    });
  });
});
