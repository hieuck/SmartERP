import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Attendance } from './entities/attendance.entity';
import { Employee } from '../employee/entities/employee.entity';
import { User } from '../user/entities/user.entity';
import { createMockUser } from '@/common/test/test-helpers';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceRepository: Repository<Attendance>;
  let employeeRepository: Repository<Employee>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@example.com',
  } as User;

  const mockEmployee: Employee = {
    id: 'emp-1',
    tenantId: 'tenant-1',
    firstName: 'John',
    lastName: 'Doe',
  } as Employee;

  const mockAttendanceRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockEmployeeRepository = {
    findOne: jest.fn(),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getRepositoryToken(Attendance),
          useValue: mockAttendanceRepository,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: mockEmployeeRepository,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    attendanceRepository = module.get<Repository<Attendance>>(
      getRepositoryToken(Attendance),
    );
    employeeRepository = module.get<Repository<Employee>>(
      getRepositoryToken(Employee),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkIn', () => {
    it('should create check-in record successfully', async () => {
      const date = new Date('2026-03-07');
      const checkInTime = '09:00:00';

      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      mockAttendanceRepository.findOne.mockResolvedValue(null);
      mockAttendanceRepository.create.mockReturnValue({
        employeeId: mockEmployee.id,
        date,
        checkIn: checkInTime,
        tenantId: mockUser.tenantId,
      });
      mockAttendanceRepository.save.mockResolvedValue({
        id: 'att-1',
        employeeId: mockEmployee.id,
        date,
        checkIn: checkInTime,
        tenantId: mockUser.tenantId,
      });

      const result = await service.checkIn(mockEmployee.id, date, checkInTime, mockUser);

      expect(result.checkIn).toBe(checkInTime);
      expect(mockEmployeeRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockEmployee.id, tenantId: mockUser.tenantId },
      });
      expect(mockAttendanceRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if employee not found', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.checkIn('invalid-emp', new Date(), '09:00:00', mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already checked in', async () => {
      const date = new Date('2026-03-07');

      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      mockAttendanceRepository.findOne.mockResolvedValue({
        id: 'att-1',
        employeeId: mockEmployee.id,
        date,
        checkIn: '09:00:00',
      });

      await expect(
        service.checkIn(mockEmployee.id, date, '09:30:00', mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkOut', () => {
    it('should update check-out time successfully', async () => {
      const date = new Date('2026-03-07');
      const checkInTime = '09:00:00';
      const checkOutTime = '18:00:00';

      const existingAttendance = {
        id: 'att-1',
        employeeId: mockEmployee.id,
        date,
        checkIn: checkInTime,
        checkOut: null,
        tenantId: mockUser.tenantId,
      };

      mockAttendanceRepository.findOne.mockResolvedValue(existingAttendance);
      mockAttendanceRepository.save.mockResolvedValue({
        ...existingAttendance,
        checkOut: checkOutTime,
        hoursWorked: 9,
      });

      const result = await service.checkOut(mockEmployee.id, date, checkOutTime, mockUser);

      expect(result.checkOut).toBe(checkOutTime);
      expect(mockAttendanceRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if no check-in record found', async () => {
      mockAttendanceRepository.findOne.mockResolvedValue(null);

      await expect(
        service.checkOut(mockEmployee.id, new Date(), '18:00:00', mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already checked out', async () => {
      const date = new Date('2026-03-07');

      mockAttendanceRepository.findOne.mockResolvedValue({
        id: 'att-1',
        employeeId: mockEmployee.id,
        date,
        checkIn: '09:00:00',
        checkOut: '18:00:00',
      });

      await expect(
        service.checkOut(mockEmployee.id, date, '18:30:00', mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAttendanceByEmployee', () => {
    it('should return attendance records for employee', async () => {
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-31');

      const mockAttendances = [
        {
          id: 'att-1',
          employeeId: mockEmployee.id,
          date: new Date('2026-03-07'),
          checkIn: '09:00:00',
          checkOut: '18:00:00',
          hoursWorked: 9,
        },
      ];

      mockAttendanceRepository.find.mockResolvedValue(mockAttendances);

      const result = await service.getAttendanceByEmployee(
        mockEmployee.id,
        startDate,
        endDate,
        mockUser.tenantId,
      );

      expect(result).toEqual(mockAttendances);
      expect(mockAttendanceRepository.find).toHaveBeenCalled();
    });
  });

  describe('getAttendanceReport', () => {
    it('should calculate total hours worked', async () => {
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-31');

      const mockAttendances = [
        { hoursWorked: 8 },
        { hoursWorked: 9 },
        { hoursWorked: 7.5 },
      ];

      mockAttendanceRepository.find.mockResolvedValue(mockAttendances);

      const result = await service.getAttendanceReport(
        mockEmployee.id,
        startDate,
        endDate,
        mockUser.tenantId,
      );

      expect(result.totalHours).toBe(24.5);
      expect(result.totalDays).toBe(3);
      expect(result.averageHours).toBe(8.17);
    });
  });
});
