/**
 * LeaveController Integration Tests
 * Coverage target: 90%+
 * 
 * Test cases:
 * 1. POST /leave/request - Success, unauthorized, validation errors
 * 2. POST /leave/approve - Success, unauthorized, forbidden (non-manager)
 * 3. POST /leave/reject - Success, unauthorized, forbidden (non-manager)
 * 4. POST /leave/allocate - Success, unauthorized, forbidden (non-admin)
 * 5. GET /leave/pending - Success, unauthorized, forbidden (non-manager)
 * 6. GET /leave/balance/:employeeId/:leaveType/:year - Success, unauthorized, not found
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { LeaveType } from './enums/leave-type.enum';
import { LeaveStatus } from './enums/leave-status.enum';

describe('LeaveController (Integration)', () => {
  let app: INestApplication;
  let leaveService: jest.Mocked<LeaveService>;

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

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    tenantId: 'tenant-123',
    role: 'admin',
  };

  const mockLeaveRequest = {
    id: 'leave-123',
    employeeId: 'employee-123',
    employee: null as any,
    leaveType: LeaveType.ANNUAL,
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-17'),
    days: 3,
    reason: 'Family vacation',
    status: LeaveStatus.PENDING,
    rejectionReason: null,
    approvedBy: null,
    approvedAt: null,
    tenantId: 'tenant-123',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    calculateDays: jest.fn(),
    validateDates: jest.fn(),
  };

  const mockLeaveBalance = {
    id: 'balance-123',
    employeeId: 'employee-123',
    employee: null as any,
    leaveType: LeaveType.ANNUAL,
    year: 2024,
    allocated: 15,
    used: 5,
    remaining: 10,
    tenantId: 'tenant-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeAll(async () => {
    const mockLeaveService = {
      requestLeave: jest.fn(),
      approveLeave: jest.fn(),
      rejectLeave: jest.fn(),
      allocateLeave: jest.fn(),
      getPendingLeaves: jest.fn(),
      getLeaveBalance: jest.fn(),
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
          } else if (token === 'admin-token') {
            request.user = mockAdminUser;
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
        
        const handler = context.getHandler();
        const handlerName = handler.name;
        
        // Approve/reject/pending require manager/admin/hr_manager
        if (['approveLeave', 'rejectLeave', 'getPendingLeaves'].includes(handlerName)) {
          if (['manager', 'admin', 'hr_manager'].includes(user.role)) {
            return true;
          }
          throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }
        
        // Allocate requires admin/hr_manager
        if (handlerName === 'allocateLeave') {
          if (['admin', 'hr_manager'].includes(user.role)) {
            return true;
          }
          throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }
        
        return true;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [LeaveController],
      providers: [
        {
          provide: LeaveService,
          useValue: mockLeaveService,
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

    leaveService = moduleFixture.get(LeaveService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /leave/request', () => {
    it('should request leave successfully', async () => {
      const requestDto = {
        employeeId: 'employee-123',
        leaveType: 'annual',
        startDate: '2024-01-15',
        endDate: '2024-01-17',
        reason: 'Family vacation',
      };

      leaveService.requestLeave.mockResolvedValue(mockLeaveRequest);

      const response = await request(app.getHttpServer())
        .post('/leave/request')
        .set('Authorization', 'Bearer valid-token')
        .send(requestDto)
        .expect(201);

      expect(response.body).toEqual(mockLeaveRequest);
      expect(leaveService.requestLeave).toHaveBeenCalledWith(
        'employee-123',
        'annual',
        new Date('2024-01-15'),
        new Date('2024-01-17'),
        'Family vacation',
        mockUser,
      );
    });

    it('should return 401 when not authenticated', async () => {
      const requestDto = {
        employeeId: 'employee-123',
        leaveType: 'annual',
        startDate: '2024-01-15',
        endDate: '2024-01-17',
        reason: 'Family vacation',
      };

      await request(app.getHttpServer())
        .post('/leave/request')
        .send(requestDto)
        .expect(401);

      expect(leaveService.requestLeave).not.toHaveBeenCalled();
    });

    it('should return 400 with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/leave/request')
        .set('Authorization', 'Bearer valid-token')
        .send({
          employeeId: 'employee-123',
        })
        .expect(400);
    });

    it('should handle insufficient leave balance', async () => {
      const requestDto = {
        employeeId: 'employee-123',
        leaveType: 'annual',
        startDate: '2024-01-15',
        endDate: '2024-01-30',
        reason: 'Long vacation',
      };

      leaveService.requestLeave.mockRejectedValue(
        new HttpException('Insufficient leave balance', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/leave/request')
        .set('Authorization', 'Bearer valid-token')
        .send(requestDto)
        .expect(400);
    });
  });

  describe('POST /leave/approve', () => {
    it('should approve leave successfully as manager', async () => {
      const approveDto = {
        leaveId: 'leave-123',
      };

      const approvedLeave = {
        ...mockLeaveRequest,
        status: LeaveStatus.APPROVED,
      };

      leaveService.approveLeave.mockResolvedValue(approvedLeave);

      const response = await request(app.getHttpServer())
        .post('/leave/approve')
        .set('Authorization', 'Bearer manager-token')
        .send(approveDto)
        .expect(201);

      expect(response.body).toEqual(approvedLeave);
      expect(leaveService.approveLeave).toHaveBeenCalledWith('leave-123', mockManagerUser);
    });

    it('should return 401 when not authenticated', async () => {
      const approveDto = {
        leaveId: 'leave-123',
      };

      await request(app.getHttpServer())
        .post('/leave/approve')
        .send(approveDto)
        .expect(401);

      expect(leaveService.approveLeave).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not manager/admin/hr_manager', async () => {
      const approveDto = {
        leaveId: 'leave-123',
      };

      await request(app.getHttpServer())
        .post('/leave/approve')
        .set('Authorization', 'Bearer valid-token')
        .send(approveDto)
        .expect(403);

      expect(leaveService.approveLeave).not.toHaveBeenCalled();
    });

    it('should handle leave not found', async () => {
      const approveDto = {
        leaveId: 'invalid-id',
      };

      leaveService.approveLeave.mockRejectedValue(
        new HttpException('Leave request not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/leave/approve')
        .set('Authorization', 'Bearer manager-token')
        .send(approveDto)
        .expect(404);
    });
  });

  describe('POST /leave/reject', () => {
    it('should reject leave successfully as manager', async () => {
      const rejectDto = {
        leaveId: 'leave-123',
        rejectionReason: 'Insufficient staffing',
      };

      const rejectedLeave = {
        ...mockLeaveRequest,
        status: LeaveStatus.REJECTED,
        rejectionReason: 'Insufficient staffing',
      };

      leaveService.rejectLeave.mockResolvedValue(rejectedLeave);

      const response = await request(app.getHttpServer())
        .post('/leave/reject')
        .set('Authorization', 'Bearer manager-token')
        .send(rejectDto)
        .expect(201);

      expect(response.body).toEqual(rejectedLeave);
      expect(leaveService.rejectLeave).toHaveBeenCalledWith(
        'leave-123',
        'Insufficient staffing',
        mockManagerUser,
      );
    });

    it('should return 401 when not authenticated', async () => {
      const rejectDto = {
        leaveId: 'leave-123',
        rejectionReason: 'Insufficient staffing',
      };

      await request(app.getHttpServer())
        .post('/leave/reject')
        .send(rejectDto)
        .expect(401);

      expect(leaveService.rejectLeave).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not manager/admin/hr_manager', async () => {
      const rejectDto = {
        leaveId: 'leave-123',
        rejectionReason: 'Insufficient staffing',
      };

      await request(app.getHttpServer())
        .post('/leave/reject')
        .set('Authorization', 'Bearer valid-token')
        .send(rejectDto)
        .expect(403);

      expect(leaveService.rejectLeave).not.toHaveBeenCalled();
    });

    it('should return 400 with missing rejection reason', async () => {
      await request(app.getHttpServer())
        .post('/leave/reject')
        .set('Authorization', 'Bearer manager-token')
        .send({
          leaveId: 'leave-123',
        })
        .expect(400);
    });
  });

  describe('POST /leave/allocate', () => {
    it('should allocate leave successfully as admin', async () => {
      const allocateDto = {
        employeeId: 'employee-123',
        leaveType: 'annual',
        year: 2024,
        days: 15,
      };

      leaveService.allocateLeave.mockResolvedValue(mockLeaveBalance);

      const response = await request(app.getHttpServer())
        .post('/leave/allocate')
        .set('Authorization', 'Bearer admin-token')
        .send(allocateDto)
        .expect(201);

      expect(response.body).toEqual(mockLeaveBalance);
      expect(leaveService.allocateLeave).toHaveBeenCalledWith(
        'employee-123',
        'annual',
        2024,
        15,
        'tenant-123',
      );
    });

    it('should return 401 when not authenticated', async () => {
      const allocateDto = {
        employeeId: 'employee-123',
        leaveType: 'annual',
        year: 2024,
        days: 15,
      };

      await request(app.getHttpServer())
        .post('/leave/allocate')
        .send(allocateDto)
        .expect(401);

      expect(leaveService.allocateLeave).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not admin/hr_manager', async () => {
      const allocateDto = {
        employeeId: 'employee-123',
        leaveType: 'annual',
        year: 2024,
        days: 15,
      };

      await request(app.getHttpServer())
        .post('/leave/allocate')
        .set('Authorization', 'Bearer manager-token')
        .send(allocateDto)
        .expect(403);

      expect(leaveService.allocateLeave).not.toHaveBeenCalled();
    });

    it('should return 400 with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/leave/allocate')
        .set('Authorization', 'Bearer admin-token')
        .send({
          employeeId: 'employee-123',
        })
        .expect(400);
    });
  });

  describe('GET /leave/pending', () => {
    it('should get pending leaves as manager', async () => {
      const pendingLeaves = [mockLeaveRequest];
      leaveService.getPendingLeaves.mockResolvedValue(pendingLeaves);

      const response = await request(app.getHttpServer())
        .get('/leave/pending')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body).toEqual(pendingLeaves);
      expect(leaveService.getPendingLeaves).toHaveBeenCalledWith('tenant-123');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/leave/pending')
        .expect(401);

      expect(leaveService.getPendingLeaves).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not manager/admin/hr_manager', async () => {
      await request(app.getHttpServer())
        .get('/leave/pending')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(leaveService.getPendingLeaves).not.toHaveBeenCalled();
    });

    it('should return empty array when no pending leaves', async () => {
      leaveService.getPendingLeaves.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/leave/pending')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /leave/balance/:employeeId/:leaveType/:year', () => {
    it('should get leave balance successfully', async () => {
      leaveService.getLeaveBalance.mockResolvedValue(mockLeaveBalance);

      const response = await request(app.getHttpServer())
        .get('/leave/balance/employee-123/annual/2024')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockLeaveBalance);
      expect(leaveService.getLeaveBalance).toHaveBeenCalledWith(
        'employee-123',
        'annual',
        2024,
        'tenant-123',
      );
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/leave/balance/employee-123/annual/2024')
        .expect(401);

      expect(leaveService.getLeaveBalance).not.toHaveBeenCalled();
    });

    it('should handle employee not found', async () => {
      leaveService.getLeaveBalance.mockRejectedValue(
        new HttpException('Employee not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/leave/balance/invalid-id/annual/2024')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should handle invalid year parameter', async () => {
      leaveService.getLeaveBalance.mockRejectedValue(
        new HttpException('Invalid year', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .get('/leave/balance/employee-123/annual/invalid')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should return zero balance when no allocation exists', async () => {
      const zeroBalance = {
        ...mockLeaveBalance,
        allocated: 0,
        used: 0,
        remaining: 0,
      };

      leaveService.getLeaveBalance.mockResolvedValue(zeroBalance);

      const response = await request(app.getHttpServer())
        .get('/leave/balance/employee-123/sick/2024')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(zeroBalance);
    });
  });
});
