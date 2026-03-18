import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmploymentType } from '../enums/hr.enum';

const mockUser = { id: 'user-1', tenantId: 'tenant-1', role: 'admin' };

const mockEmployee = {
  id: 'emp-1',
  employeeCode: 'EMP001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  status: 'active',
  employmentType: EmploymentType.FULL_TIME,
  tenantId: 'tenant-1',
};

const mockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  search: jest.fn(),
  findByStatus: jest.fn(),
  getStatistics: jest.fn(),
};

describe('EmployeeController', () => {
  let controller: EmployeeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [{ provide: EmployeeService, useValue: mockService }],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated employees', async () => {
      const result = { data: [mockEmployee], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } };
      mockService.findAll.mockResolvedValue(result);

      const response = await controller.findAll(mockUser as any, 1, 20);

      expect(mockService.findAll).toHaveBeenCalledWith(mockUser, 1, 20);
      expect(response).toEqual(result);
    });
  });

  describe('findOne', () => {
    it('should return a single employee', async () => {
      mockService.findOne.mockResolvedValue(mockEmployee);

      const response = await controller.findOne(mockUser as any, 'emp-1');

      expect(mockService.findOne).toHaveBeenCalledWith(mockUser, 'emp-1');
      expect(response).toEqual(mockEmployee);
    });
  });

  describe('create', () => {
    it('should create and return employee', async () => {
      const dto: CreateEmployeeDto = {
        employeeCode: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        employmentType: EmploymentType.FULL_TIME,
      };
      mockService.create.mockResolvedValue(mockEmployee);

      const response = await controller.create(mockUser as any, dto);

      expect(mockService.create).toHaveBeenCalledWith(mockUser, dto);
      expect(response).toEqual(mockEmployee);
    });
  });

  describe('update', () => {
    it('should update and return employee', async () => {
      const dto: UpdateEmployeeDto = { firstName: 'Jane' };
      const updated = { ...mockEmployee, firstName: 'Jane' };
      mockService.update.mockResolvedValue(updated);

      const response = await controller.update(mockUser as any, 'emp-1', dto);

      expect(mockService.update).toHaveBeenCalledWith(mockUser, 'emp-1', dto);
      expect(response).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should delete employee and return message', async () => {
      mockService.remove.mockResolvedValue(undefined);

      const response = await controller.remove(mockUser as any, 'emp-1');

      expect(mockService.remove).toHaveBeenCalledWith(mockUser, 'emp-1');
      expect(response).toEqual({ message: 'Employee deleted successfully' });
    });
  });

  describe('search', () => {
    it('should return matching employees', async () => {
      mockService.search.mockResolvedValue([mockEmployee]);

      const response = await controller.search(mockUser as any, 'john');

      expect(mockService.search).toHaveBeenCalledWith(mockUser, 'john');
      expect(response).toEqual([mockEmployee]);
    });
  });

  describe('findByStatus', () => {
    it('should return employees by status', async () => {
      mockService.findByStatus.mockResolvedValue([mockEmployee]);

      const response = await controller.findByStatus(mockUser as any, 'active');

      expect(mockService.findByStatus).toHaveBeenCalledWith(mockUser, 'active');
      expect(response).toEqual([mockEmployee]);
    });
  });

  describe('getStatistics', () => {
    it('should return employee statistics', async () => {
      const stats = { totalEmployees: 10, activeEmployees: 8, inactiveEmployees: 2 };
      mockService.getStatistics.mockResolvedValue(stats);

      const response = await controller.getStatistics(mockUser as any);

      expect(mockService.getStatistics).toHaveBeenCalledWith(mockUser);
      expect(response).toEqual(stats);
    });
  });
});
