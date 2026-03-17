/**
 * AttendanceController Integration Tests
 * Coverage target: 90%+
 *
 * Test cases:
 * 1. POST /attendance/check-in - Success, unauthorized, validation errors
 * 2. POST /attendance/check-out - Success, unauthorized, validation errors
 * 3. GET /attendance/employee - Success, unauthorized, invalid date range
 * 4. GET /attendance/report - Success, unauthorized, forbidden (non-manager)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

describe('AttendanceController (Integration)', () => {
  let app: INestApplication;
  let attendanceService: jest.Mocked<AttendanceService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    tenantId: 'tenant-123',
    role: 'employee',
  };

  const mockManagerUser = {
    id: 'manager-123',
    email: 'manager@example.com',
    tenantId: 'tenant-123',
    role: 'manager',
  };

  const mockAttendanceRecord = {
    id: 'attendance-123',
    employeeId: 'employee-123',
    employee: null,
    date: new Date('2024-01-15'),
    checkIn: '09:00:00',
    checkOut: null,
    hoursWorked: 0,
    notes: null,
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockAttendanceReport = {
    totalHours: 160,
    totalDays: 20,
    averageHours: 8,
    attendances: [mockAttendanceRecord],
  } as any;

  beforeAll(async () => {
    const mockAttendanceService = {
      checkIn: jest.fn(),
      checkOut: jest.fn(),
      getAttendanceByEmployee: jest.fn(),
      getAttendanceReport: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          if (token === 'valid-token') {
            request.user = mockUser;
            return true;
          } else if (token === 'manager-token') {
            request.user = mockManagerUser;
            return true;
          }
        }

        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const mockRolesGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
          throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        // Check route-specific role requirements
        const handler = context.getHandler();
        const handlerName = handler.name;

        // Report endpoint requires manager/admin/hr_manager
        if (handlerName === 'getReport') {
          if (['manager', 'admin', 'hr_manager'].includes(user.role)) {
            return true;
          }
          throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        return true;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        {
          provide: AttendanceService,
          useValue: mockAttendanceService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    attendanceService = moduleFixture.get(AttendanceService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /attendance/check-in', () => {
    it('should check-in successfully', async () => {
      const checkInDto = {
        employeeId: '550e8400-e29b-41d4-a716-446655440000',
        date: '2024-01-15',
        checkInTime: '09:00:00',
      };

      attendanceService.checkIn.mockResolvedValue(mockAttendanceRecord);

      const response = await request(app.getHttpServer())
        .post('/attendance/check-in')
        .set('Authorization', 'Bearer valid-token')
        .send(checkInDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: mockAttendanceRecord.id,
        employeeId: mockAttendanceRecord.employeeId,
      });
      expect(attendanceService.checkIn).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
        new Date('2024-01-15'),
        '09:00:00',
        expect.objectContaining({
          id: 'user-123',
          tenantId: 'tenant-123',
        }),
      );
    });

    it('should return 401 when not authenticated', async () => {
      const checkInDto = {
        employeeId: 'employee-123',
        date: '2024-01-15',
        checkInTime: '09:00:00',
      };

      await request(app.getHttpServer()).post('/attendance/check-in').send(checkInDto).expect(401);

      expect(attendanceService.checkIn).not.toHaveBeenCalled();
    });

    it('should return 400 with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/attendance/check-in')
        .set('Authorization', 'Bearer valid-token')
        .send({
          employeeId: 'employee-123',
        })
        .expect(400);
    });

    it('should handle service errors', async () => {
      const checkInDto = {
        employeeId: 'employee-123',
        date: '2024-01-15',
        checkInTime: '09:00:00',
      };

      attendanceService.checkIn.mockRejectedValue(
        new HttpException('Already checked in today', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/attendance/check-in')
        .set('Authorization', 'Bearer valid-token')
        .send(checkInDto)
        .expect(400);
    });
  });

  describe('POST /attendance/check-out', () => {
    it('should check-out successfully', async () => {
      const checkOutDto = {
        employeeId: '550e8400-e29b-41d4-a716-446655440000',
        date: '2024-01-15',
        checkOutTime: '18:00:00',
      };

      const updatedRecord = {
        ...mockAttendanceRecord,
        checkOut: '18:00:00',
        hoursWorked: 9,
      } as any;

      attendanceService.checkOut.mockResolvedValue(updatedRecord);

      const response = await request(app.getHttpServer())
        .post('/attendance/check-out')
        .set('Authorization', 'Bearer valid-token')
        .send(checkOutDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: updatedRecord.id,
        checkOut: '18:00:00',
      });
      expect(attendanceService.checkOut).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
        new Date('2024-01-15'),
        '18:00:00',
        expect.objectContaining({
          id: 'user-123',
          tenantId: 'tenant-123',
        }),
      );
    });

    it('should return 401 when not authenticated', async () => {
      const checkOutDto = {
        employeeId: 'employee-123',
        date: '2024-01-15',
        checkOutTime: '18:00:00',
      };

      await request(app.getHttpServer())
        .post('/attendance/check-out')
        .send(checkOutDto)
        .expect(401);

      expect(attendanceService.checkOut).not.toHaveBeenCalled();
    });

    it('should return 400 with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/attendance/check-out')
        .set('Authorization', 'Bearer valid-token')
        .send({
          employeeId: 'employee-123',
        })
        .expect(400);
    });

    it('should handle service errors', async () => {
      const checkOutDto = {
        employeeId: '550e8400-e29b-41d4-a716-446655440000',
        date: '2024-01-15',
        checkOutTime: '18:00:00',
      };

      attendanceService.checkOut.mockRejectedValue(
        new HttpException('No check-in record found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/attendance/check-out')
        .set('Authorization', 'Bearer valid-token')
        .send(checkOutDto)
        .expect(404);
    });
  });

  describe('GET /attendance/employee', () => {
    it('should get attendance records for employee', async () => {
      const records = [mockAttendanceRecord];
      attendanceService.getAttendanceByEmployee.mockResolvedValue(records);

      const response = await request(app.getHttpServer())
        .get('/attendance/employee')
        .query({
          employeeId: '550e8400-e29b-41d4-a716-446655440000',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(attendanceService.getAttendanceByEmployee).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'tenant-123',
      );
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/attendance/employee')
        .query({
          employeeId: 'employee-123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .expect(401);

      expect(attendanceService.getAttendanceByEmployee).not.toHaveBeenCalled();
    });

    it('should handle missing query parameters', async () => {
      attendanceService.getAttendanceByEmployee.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/attendance/employee')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle invalid date format', async () => {
      attendanceService.getAttendanceByEmployee.mockRejectedValue(
        new HttpException('Invalid date format', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .get('/attendance/employee')
        .query({
          employeeId: 'employee-123',
          startDate: 'invalid-date',
          endDate: '2024-01-31',
        })
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });

  describe('GET /attendance/report', () => {
    it('should get attendance report for manager', async () => {
      attendanceService.getAttendanceReport.mockResolvedValue(mockAttendanceReport);

      const response = await request(app.getHttpServer())
        .get('/attendance/report')
        .query({
          employeeId: '550e8400-e29b-41d4-a716-446655440000',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body).toMatchObject({
        totalHours: 160,
        totalDays: 20,
        averageHours: 8,
      });
      expect(attendanceService.getAttendanceReport).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'tenant-123',
      );
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/attendance/report')
        .query({
          employeeId: 'employee-123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .expect(401);

      expect(attendanceService.getAttendanceReport).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not manager/admin/hr_manager', async () => {
      await request(app.getHttpServer())
        .get('/attendance/report')
        .query({
          employeeId: 'employee-123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(attendanceService.getAttendanceReport).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      attendanceService.getAttendanceReport.mockRejectedValue(
        new HttpException('Employee not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/attendance/report')
        .query({
          employeeId: 'invalid-id',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .set('Authorization', 'Bearer manager-token')
        .expect(404);
    });
  });
});
