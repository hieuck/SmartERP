/**
 * ManagementController Integration Tests
 * Coverage target: 90%+
 * 
 * Test cases:
 * 1. Employee endpoints: GET, POST, PUT, DELETE
 * 2. Attendance endpoints: GET, POST, PUT
 * 3. Leave endpoints: GET, POST, approve, reject
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { ManagementController } from './management.controller';
import { ManagementService } from './management.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';

describe('ManagementController (Integration)', () => {
  let app: INestApplication;
  let managementService: jest.Mocked<ManagementService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    tenantId: 'tenant-123',
    role: 'admin',
  };

  const mockEmployee = {
    id: 'employee-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    position: 'Developer',
    department: 'Engineering',
    tenantId: 'tenant-123',
    version: 1,
    syncStatus: 'synced',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAttendance = {
    id: 'attendance-123',
    employeeId: 'employee-123',
    date: new Date('2024-01-15'),
    checkInTime: '09:00:00',
    checkOutTime: '18:00:00',
    status: 'present',
    version: 1,
    syncStatus: 'synced',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLeave = {
    id: 'leave-123',
    employeeId: 'employee-123',
    leaveType: 'annual',
    startDate: new Date('2024-01-20'),
    endDate: new Date('2024-01-22'),
    status: 'pending',
    version: 1,
    syncStatus: 'synced',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const mockManagementService = {
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

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer valid-token')) {
          request.user = mockUser;
          return true;
        }
        
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ManagementController],
      providers: [
        {
          provide: ManagementService,
          useValue: mockManagementService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    managementService = moduleFixture.get(ManagementService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /hr/employees', () => {
    it('should return all employees', async () => {
      const employees = [mockEmployee];
      managementService.findAllEmployees.mockResolvedValue(employees as any);

      const response = await request(app.getHttpServer())
        .get('/hr/employees')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(employees);
      expect(managementService.findAllEmployees).toHaveBeenCalledWith(mockUser);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/hr/employees')
        .expect(401);

      expect(managementService.findAllEmployees).not.toHaveBeenCalled();
    });

    it('should return empty array when no employees', async () => {
      managementService.findAllEmployees.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/hr/employees')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /hr/employees/:id', () => {
    it('should return employee by id', async () => {
      managementService.findEmployeeById.mockResolvedValue(mockEmployee as any);

      const response = await request(app.getHttpServer())
        .get('/hr/employees/employee-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockEmployee);
      expect(managementService.findEmployeeById).toHaveBeenCalledWith(mockUser, 'employee-123');
    });

    it('should return 404 when employee not found', async () => {
      managementService.findEmployeeById.mockRejectedValue(
        new HttpException('Employee not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/hr/employees/invalid-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('POST /hr/employees', () => {
    it('should create employee successfully', async () => {
      const createDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        position: 'Developer',
        department: 'Engineering',
      };

      managementService.createEmployee.mockResolvedValue(mockEmployee as any);

      const response = await request(app.getHttpServer())
        .post('/hr/employees')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockEmployee);
      expect(managementService.createEmployee).toHaveBeenCalledWith(mockUser, createDto);
    });

    it('should return 400 with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/hr/employees')
        .set('Authorization', 'Bearer valid-token')
        .send({
          firstName: 'John',
        })
        .expect(400);
    });
  });

  describe('PUT /hr/employees/:id', () => {
    it('should update employee successfully', async () => {
      const updateDto = {
        position: 'Senior Developer',
      };

      const updatedEmployee = {
        ...mockEmployee,
        position: 'Senior Developer',
      };

      managementService.updateEmployee.mockResolvedValue(updatedEmployee as any);

      const response = await request(app.getHttpServer())
        .put('/hr/employees/employee-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body).toEqual(updatedEmployee);
      expect(managementService.updateEmployee).toHaveBeenCalledWith(
        mockUser,
        'employee-123',
        updateDto,
      );
    });

    it('should return 404 when employee not found', async () => {
      managementService.updateEmployee.mockRejectedValue(
        new HttpException('Employee not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .put('/hr/employees/invalid-id')
        .set('Authorization', 'Bearer valid-token')
        .send({ position: 'Manager' })
        .expect(404);
    });
  });

  describe('DELETE /hr/employees/:id', () => {
    it('should delete employee successfully', async () => {
      managementService.deleteEmployee.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/hr/employees/employee-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(managementService.deleteEmployee).toHaveBeenCalledWith(mockUser, 'employee-123');
    });

    it('should return 404 when employee not found', async () => {
      managementService.deleteEmployee.mockRejectedValue(
        new HttpException('Employee not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/hr/employees/invalid-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('GET /hr/attendance', () => {
    it('should return all attendance records', async () => {
      const records = [mockAttendance];
      managementService.findAllAttendance.mockResolvedValue(records as any);

      const response = await request(app.getHttpServer())
        .get('/hr/attendance')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(records);
      expect(managementService.findAllAttendance).toHaveBeenCalledWith(
        mockUser,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should filter by date range', async () => {
      const records = [mockAttendance];
      managementService.findAllAttendance.mockResolvedValue(records as any);

      await request(app.getHttpServer())
        .get('/hr/attendance')
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(managementService.findAllAttendance).toHaveBeenCalledWith(
        mockUser,
        undefined,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );
    });
  });

  describe('GET /hr/attendance/employee/:employeeId', () => {
    it('should return attendance by employee', async () => {
      const records = [mockAttendance];
      managementService.findAllAttendance.mockResolvedValue(records as any);

      const response = await request(app.getHttpServer())
        .get('/hr/attendance/employee/employee-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(records);
      expect(managementService.findAllAttendance).toHaveBeenCalledWith(mockUser, 'employee-123');
    });
  });

  describe('POST /hr/attendance', () => {
    it('should create attendance record', async () => {
      const createDto = {
        employeeId: 'employee-123',
        date: '2024-01-15',
        checkInTime: '09:00:00',
        checkOutTime: '18:00:00',
      };

      managementService.createAttendance.mockResolvedValue(mockAttendance as any);

      const response = await request(app.getHttpServer())
        .post('/hr/attendance')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockAttendance);
      expect(managementService.createAttendance).toHaveBeenCalledWith(mockUser, createDto);
    });
  });

  describe('PUT /hr/attendance/:id', () => {
    it('should update attendance record', async () => {
      const updateDto = {
        checkOutTime: '19:00:00',
      };

      const updated = {
        ...mockAttendance,
        checkOutTime: '19:00:00',
      };

      managementService.updateAttendance.mockResolvedValue(updated as any);

      const response = await request(app.getHttpServer())
        .put('/hr/attendance/attendance-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body).toEqual(updated);
    });
  });

  describe('GET /hr/leaves', () => {
    it('should return all leaves', async () => {
      const leaves = [mockLeave];
      managementService.findAllLeaves.mockResolvedValue(leaves as any);

      const response = await request(app.getHttpServer())
        .get('/hr/leaves')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(leaves);
      expect(managementService.findAllLeaves).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('GET /hr/leaves/employee/:employeeId', () => {
    it('should return leaves by employee', async () => {
      const leaves = [mockLeave];
      managementService.findAllLeaves.mockResolvedValue(leaves as any);

      const response = await request(app.getHttpServer())
        .get('/hr/leaves/employee/employee-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(leaves);
      expect(managementService.findAllLeaves).toHaveBeenCalledWith(mockUser, 'employee-123');
    });
  });

  describe('POST /hr/leaves', () => {
    it('should create leave request', async () => {
      const createDto = {
        employeeId: 'employee-123',
        leaveType: 'annual',
        startDate: '2024-01-20',
        endDate: '2024-01-22',
        reason: 'Vacation',
      };

      managementService.createLeave.mockResolvedValue(mockLeave as any);

      const response = await request(app.getHttpServer())
        .post('/hr/leaves')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockLeave);
      expect(managementService.createLeave).toHaveBeenCalledWith(mockUser, createDto);
    });
  });

  describe('POST /hr/leaves/:id/approve', () => {
    it('should approve leave', async () => {
      const approved = {
        ...mockLeave,
        status: 'approved',
      };

      managementService.approveLeave.mockResolvedValue(approved as any);

      const response = await request(app.getHttpServer())
        .post('/hr/leaves/leave-123/approve')
        .set('Authorization', 'Bearer valid-token')
        .send({ approvedBy: 'manager-123' })
        .expect(201);

      expect(response.body).toEqual(approved);
      expect(managementService.approveLeave).toHaveBeenCalledWith(
        mockUser,
        'leave-123',
        'manager-123',
      );
    });
  });

  describe('POST /hr/leaves/:id/reject', () => {
    it('should reject leave', async () => {
      const rejected = {
        ...mockLeave,
        status: 'rejected',
      };

      managementService.rejectLeave.mockResolvedValue(rejected as any);

      const response = await request(app.getHttpServer())
        .post('/hr/leaves/leave-123/reject')
        .set('Authorization', 'Bearer valid-token')
        .expect(201);

      expect(response.body).toEqual(rejected);
      expect(managementService.rejectLeave).toHaveBeenCalledWith(mockUser, 'leave-123');
    });
  });
});
