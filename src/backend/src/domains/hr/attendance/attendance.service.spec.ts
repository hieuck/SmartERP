import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Attendance } from './entities/attendance.entity';
import { Employee } from '../employee/entities/employee.entity';
import { User } from '@/common/security/permission.service';
import { EmploymentStatus, EmploymentType } from '../enums/hr.enum';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceRepository: jest.Mocked<Repository<Attendance>>;
  let employeeRepository: jest.Mocked<Repository<Employee>>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@example.com',
    roles: ['admin'],
  } as User;

  const mockEmployee = {
    id: 'emp-1',
    employeeCode: 'EMP-001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    status: EmploymentStatus.ACTIVE,
    employmentType: EmploymentType.FULL_TIME,
    tenantId: 'tenant-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Employee;

  const mockAttendance = {
    id: 'att-1',
    employeeId: 'emp-1',
    date: new Date('2024-01-15'),
    checkIn: '09:00',
    checkOut: null,
    hoursWorked: null,
    tenantId: 'tenant-1',
    calculateHoursWorked: jest.fn(),
    parseTime: jest.fn(),
  } as unknown as Attendance;

  beforeEach(async () => {
    const mockAttendanceRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockEmployeeRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: getRepositoryToken(Attendance), useValue: mockAttendanceRepo },
        { provide: getRepositoryToken(Employee), useValue: mockEmployeeRepo },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    attendanceRepository = module.get(getRepositoryToken(Attendance));
    employeeRepository = module.get(getRepositoryToken(Employee));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkIn', () => {
    it('should check in employee successfully', async () => {
      // Arrange
      const date = new Date('2024-01-15');
      const checkInTime = '09:00';
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      attendanceRepository.findOne.mockResolvedValue(null);
      attendanceRepository.create.mockReturnValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance);

      // Act
      const result = await service.checkIn('emp-1', date, checkInTime, mockUser);

      // Assert
      expect(result).toEqual(mockAttendance);
      expect(employeeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'emp-1', tenantId: 'tenant-1' },
      });
      expect(attendanceRepository.findOne).toHaveBeenCalledWith({
        where: { employeeId: 'emp-1', date, tenantId: 'tenant-1' },
      });
      expect(attendanceRepository.create).toHaveBeenCalledWith({
        employeeId: 'emp-1',
        date,
        checkIn: checkInTime,
        tenantId: 'tenant-1',
      });
    });

    it('should throw NotFoundException when employee not found', async () => {
      // Arrange
      employeeRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.checkIn('invalid-id', new Date(), '09:00', mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.checkIn('invalid-id', new Date(), '09:00', mockUser)).rejects.toThrow(
        'Employee invalid-id not found',
      );
    });

    it('should throw BadRequestException when already checked in', async () => {
      // Arrange
      const date = new Date('2024-01-15');
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);

      // Act & Assert
      await expect(service.checkIn('emp-1', date, '09:00', mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.checkIn('emp-1', date, '09:00', mockUser)).rejects.toThrow(
        'Employee already checked in on 2024-01-15',
      );
    });

    it('should handle different check-in times', async () => {
      // Arrange
      employeeRepository.findOne.mockResolvedValue(mockEmployee);
      attendanceRepository.findOne.mockResolvedValue(null);
      attendanceRepository.create.mockReturnValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance);

      // Act
      await service.checkIn('emp-1', new Date(), '08:30', mockUser);

      // Assert
      expect(attendanceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ checkIn: '08:30' }),
      );
    });
  });

  describe('checkOut', () => {
    it('should check out employee successfully', async () => {
      // Arrange
      const date = new Date('2024-01-15');
      const checkOutTime = '18:00';
      const attendanceWithCheckOut = {
        ...mockAttendance,
        checkOut: checkOutTime,
        calculateHoursWorked: jest.fn(),
        parseTime: jest.fn(),
      } as unknown as Attendance;
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(attendanceWithCheckOut);

      // Act
      const result = await service.checkOut('emp-1', date, checkOutTime, mockUser);

      // Assert
      expect(result.checkOut).toBe(checkOutTime);
      expect(attendanceRepository.findOne).toHaveBeenCalledWith({
        where: { employeeId: 'emp-1', date, tenantId: 'tenant-1' },
      });
      expect(attendanceRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when no check-in record found', async () => {
      // Arrange
      const date = new Date('2024-01-15');
      attendanceRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.checkOut('emp-1', date, '18:00', mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.checkOut('emp-1', date, '18:00', mockUser)).rejects.toThrow(
        'No check-in record found for employee emp-1 on 2024-01-15',
      );
    });

    it('should throw BadRequestException when already checked out', async () => {
      // Arrange
      const date = new Date('2024-01-15');
      const alreadyCheckedOut = {
        ...mockAttendance,
        checkOut: '17:00',
        calculateHoursWorked: jest.fn(),
        parseTime: jest.fn(),
      } as unknown as Attendance;
      attendanceRepository.findOne.mockResolvedValue(alreadyCheckedOut);

      // Act & Assert
      await expect(service.checkOut('emp-1', date, '18:00', mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.checkOut('emp-1', date, '18:00', mockUser)).rejects.toThrow(
        'Employee already checked out at 17:00',
      );
    });

    it('should update check-out time correctly', async () => {
      // Arrange
      const date = new Date('2024-01-15');
      const attendanceWithoutCheckout = {
        ...mockAttendance,
        checkOut: null,
        calculateHoursWorked: jest.fn(),
        parseTime: jest.fn(),
      } as unknown as Attendance;
      attendanceRepository.findOne.mockResolvedValue(attendanceWithoutCheckout);
      attendanceRepository.save.mockImplementation((att) => Promise.resolve(att as Attendance));

      // Act
      await service.checkOut('emp-1', date, '17:30', mockUser);

      // Assert
      expect(attendanceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ checkOut: '17:30' }),
      );
    });
  });

  describe('getAttendanceByEmployee', () => {
    it('should return attendance records for employee within date range', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const attendances = [mockAttendance];
      attendanceRepository.find.mockResolvedValue(attendances);

      // Act
      const result = await service.getAttendanceByEmployee('emp-1', startDate, endDate, 'tenant-1');

      // Assert
      expect(result).toEqual(attendances);
      expect(attendanceRepository.find).toHaveBeenCalledWith({
        where: {
          employeeId: 'emp-1',
          date: Between(startDate, endDate),
          tenantId: 'tenant-1',
        },
        order: { date: 'DESC' },
      });
    });

    it('should return empty array when no attendance records found', async () => {
      // Arrange
      attendanceRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getAttendanceByEmployee(
        'emp-1',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'tenant-1',
      );

      // Assert
      expect(result).toEqual([]);
    });

    it('should order results by date DESC', async () => {
      // Arrange
      const att1 = {
        ...mockAttendance,
        date: new Date('2024-01-15'),
        calculateHoursWorked: jest.fn(),
        parseTime: jest.fn(),
      } as unknown as Attendance;
      const att2 = {
        ...mockAttendance,
        date: new Date('2024-01-16'),
        calculateHoursWorked: jest.fn(),
        parseTime: jest.fn(),
      } as unknown as Attendance;
      attendanceRepository.find.mockResolvedValue([att2, att1]);

      // Act
      await service.getAttendanceByEmployee(
        'emp-1',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'tenant-1',
      );

      // Assert
      expect(attendanceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ order: { date: 'DESC' } }),
      );
    });
  });

  describe('getAttendanceReport', () => {
    it('should return attendance report with statistics', async () => {
      // Arrange
      const att1 = {
        ...mockAttendance,
        hoursWorked: 8,
        calculateHoursWorked: jest.fn(),
        parseTime: jest.fn(),
      } as unknown as Attendance;
      const att2 = {
        ...mockAttendance,
        hoursWorked: 7.5,
        calculateHoursWorked: jest.fn(),
        parseTime: jest.fn(),
      } as unknown as Attendance;
      const att3 = {
        ...mockAttendance,
        hoursWorked: 8.5,
        calculateHoursWorked: jest.fn(),
        parseTime: jest.fn(),
      } as unknown as Attendance;
      attendanceRepository.find.mockResolvedValue([att1, att2, att3]);

      // Act
      const result = await service.getAttendanceReport(
        'emp-1',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'tenant-1',
      );

      // Assert
      expect(result.totalHours).toBe(24);
      expect(result.totalDays).toBe(3);
      expect(result.averageHours).toBe(8);
      expect(result.attendances).toHaveLength(3);
    });

    it('should return zero statistics when no attendance records', async () => {
      // Arrange
      attendanceRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getAttendanceReport(
        'emp-1',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'tenant-1',
      );

      // Assert
      expect(result.totalHours).toBe(0);
      expect(result.totalDays).toBe(0);
      expect(result.averageHours).toBe(0);
      expect(result.attendances).toEqual([]);
    });

    it('should handle null hoursWorked values', async () => {
      // Arrange
      const att1 = {
        ...mockAttendance,
        hoursWorked: null,
        calculateHoursWorked: jest.fn(),
        parseTime: jest.fn(),
      } as unknown as Attendance;
      const att2 = {
        ...mockAttendance,
        hoursWorked: 8,
        calculateHoursWorked: jest.fn(),
        parseTime: jest.fn(),
      } as unknown as Attendance;
      attendanceRepository.find.mockResolvedValue([att1, att2]);

      // Act
      const result = await service.getAttendanceReport(
        'emp-1',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'tenant-1',
      );

      // Assert
      expect(result.totalHours).toBe(8);
      expect(result.totalDays).toBe(2);
      expect(result.averageHours).toBe(4);
    });

    it('should round average hours to 2 decimal places', async () => {
      // Arrange
      const att1 = {
        ...mockAttendance,
        hoursWorked: 8.333,
        calculateHoursWorked: jest.fn(),
        parseTime: jest.fn(),
      } as unknown as Attendance;
      const att2 = {
        ...mockAttendance,
        hoursWorked: 7.666,
        calculateHoursWorked: jest.fn(),
        parseTime: jest.fn(),
      } as unknown as Attendance;
      const att3 = {
        ...mockAttendance,
        hoursWorked: 8.111,
        calculateHoursWorked: jest.fn(),
        parseTime: jest.fn(),
      } as unknown as Attendance;
      attendanceRepository.find.mockResolvedValue([att1, att2, att3]);

      // Act
      const result = await service.getAttendanceReport(
        'emp-1',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'tenant-1',
      );

      // Assert
      expect(result.averageHours).toBe(8.04); // (24.11 / 3) = 8.0366... rounded to 8.04
    });

    it('should calculate total hours correctly with decimal values', async () => {
      // Arrange
      const att1 = {
        ...mockAttendance,
        hoursWorked: 8.25,
        calculateHoursWorked: jest.fn(),
        parseTime: jest.fn(),
      } as unknown as Attendance;
      const att2 = {
        ...mockAttendance,
        hoursWorked: 7.75,
        calculateHoursWorked: jest.fn(),
        parseTime: jest.fn(),
      } as unknown as Attendance;
      attendanceRepository.find.mockResolvedValue([att1, att2]);

      // Act
      const result = await service.getAttendanceReport(
        'emp-1',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'tenant-1',
      );

      // Assert
      expect(result.totalHours).toBe(16);
      expect(result.averageHours).toBe(8);
    });
  });
});
