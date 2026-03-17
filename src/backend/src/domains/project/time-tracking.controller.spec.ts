/**
 * TimeTrackingController Integration Tests
 * Coverage target: 95%
 *
 * Test cases:
 * 1. POST /time-tracking - Log time entry
 * 2. GET /time-tracking - Get all time entries with filters
 * 3. GET /time-tracking/:id - Get time entry by ID
 * 4. PUT /time-tracking/:id - Update time entry
 * 5. DELETE /time-tracking/:id - Delete time entry
 * 6. GET /time-tracking/task/:taskId/total - Get total hours by task
 * 7. GET /time-tracking/project/:projectId/total - Get total hours by project
 * 8. GET /time-tracking/user/:userId/total - Get total hours by user
 * 9. GET /time-tracking/billable/summary - Get billable hours summary
 * 10. Authentication/Authorization tests
 * 11. Validation tests
 * 12. Edge cases
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { TimeTrackingController } from './time-tracking.controller';
import { TimeTrackingService } from './time-tracking.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';

describe('TimeTrackingController (Integration)', () => {
  let app: INestApplication;
  let timeTrackingService: jest.Mocked<TimeTrackingService>;

  const mockUser = {
    id: 'user-123',
    email: 'dev@example.com',
    tenantId: 'tenant-123',
    roles: ['user'],
  };

  const mockTimeEntry = {
    id: 'entry-123',
    userId: 'user-123',
    taskId: 'task-123',
    projectId: 'proj-123',
    date: new Date('2024-01-15'),
    hours: 8,
    description: 'Implemented authentication',
    isBillable: true,
    cost: 800,
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const mockTimeTrackingService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getTotalHoursByTask: jest.fn(),
      getTotalHoursByProject: jest.fn(),
      getTotalHoursByUser: jest.fn(),
      getBillableHours: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
          request.user = mockUser;
          return true;
        }

        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const mockRolesGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        if (request.user && request.user.roles) {
          return true;
        }
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TimeTrackingController],
      providers: [
        {
          provide: TimeTrackingService,
          useValue: mockTimeTrackingService,
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

    timeTrackingService = moduleFixture.get(TimeTrackingService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /time-tracking', () => {
    it('should log time entry successfully', async () => {
      const createDto = {
        taskId: 'task-123',
        date: '2024-01-15',
        hours: 8,
        description: 'Implemented feature',
        isBillable: true,
        cost: 800,
      };

      timeTrackingService.create.mockResolvedValue({
        ...mockTimeEntry,
        ...createDto,
        id: 'entry-124',
      } as any);

      const response = await request(app.getHttpServer())
        .post('/time-tracking')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.hours).toBe(8);
      expect(response.body.description).toBe('Implemented feature');
      expect(timeTrackingService.create).toHaveBeenCalledWith(
        createDto,
        mockUser.tenantId,
        mockUser,
      );
    });

    it('should return 404 when task not found', async () => {
      const createDto = {
        taskId: 'non-existent',
        date: '2024-01-15',
        hours: 8,
        description: 'Work',
      };

      timeTrackingService.create.mockRejectedValue(
        new HttpException('Task with ID non-existent not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/time-tracking')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/time-tracking')
        .send({ taskId: 'task-123', hours: 8 })
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/time-tracking')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should validate hours is positive', async () => {
      await request(app.getHttpServer())
        .post('/time-tracking')
        .set('Authorization', 'Bearer valid-token')
        .send({
          taskId: 'task-123',
          date: '2024-01-15',
          hours: -5,
          description: 'Work',
        })
        .expect(400);
    });

    it('should validate hours is not more than 24', async () => {
      await request(app.getHttpServer())
        .post('/time-tracking')
        .set('Authorization', 'Bearer valid-token')
        .send({
          taskId: 'task-123',
          date: '2024-01-15',
          hours: 25,
          description: 'Work',
        })
        .expect(400);
    });

    it('should allow non-billable entries', async () => {
      const createDto = {
        taskId: 'task-123',
        date: '2024-01-15',
        hours: 4,
        description: 'Internal meeting',
        isBillable: false,
      };

      timeTrackingService.create.mockResolvedValue({
        ...mockTimeEntry,
        ...createDto,
        isBillable: false,
      } as any);

      const response = await request(app.getHttpServer())
        .post('/time-tracking')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.isBillable).toBe(false);
    });
  });

  describe('GET /time-tracking', () => {
    it('should return all time entries', async () => {
      const entries = [mockTimeEntry];
      timeTrackingService.findAll.mockResolvedValue(entries as any);

      const response = await request(app.getHttpServer())
        .get('/time-tracking')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(entries);
      expect(timeTrackingService.findAll).toHaveBeenCalledWith(mockUser.tenantId, {});
    });

    it('should filter by user', async () => {
      timeTrackingService.findAll.mockResolvedValue([mockTimeEntry] as any);

      await request(app.getHttpServer())
        .get('/time-tracking?userId=user-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(timeTrackingService.findAll).toHaveBeenCalledWith(mockUser.tenantId, {
        userId: 'user-123',
      });
    });

    it('should filter by task', async () => {
      timeTrackingService.findAll.mockResolvedValue([mockTimeEntry] as any);

      await request(app.getHttpServer())
        .get('/time-tracking?taskId=task-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(timeTrackingService.findAll).toHaveBeenCalledWith(mockUser.tenantId, {
        taskId: 'task-123',
      });
    });

    it('should filter by project', async () => {
      timeTrackingService.findAll.mockResolvedValue([mockTimeEntry] as any);

      await request(app.getHttpServer())
        .get('/time-tracking?projectId=proj-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(timeTrackingService.findAll).toHaveBeenCalledWith(mockUser.tenantId, {
        projectId: 'proj-123',
      });
    });

    it('should filter by date range', async () => {
      timeTrackingService.findAll.mockResolvedValue([mockTimeEntry] as any);

      await request(app.getHttpServer())
        .get('/time-tracking?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(timeTrackingService.findAll).toHaveBeenCalledWith(mockUser.tenantId, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });
    });

    it('should filter by billable status', async () => {
      timeTrackingService.findAll.mockResolvedValue([mockTimeEntry] as any);

      await request(app.getHttpServer())
        .get('/time-tracking?isBillable=true')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(timeTrackingService.findAll).toHaveBeenCalledWith(mockUser.tenantId, {
        isBillable: true,
      });
    });

    it('should return empty array when no entries', async () => {
      timeTrackingService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/time-tracking')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /time-tracking/:id', () => {
    it('should return time entry by ID', async () => {
      timeTrackingService.findOne.mockResolvedValue(mockTimeEntry as any);

      const response = await request(app.getHttpServer())
        .get('/time-tracking/entry-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockTimeEntry);
      expect(timeTrackingService.findOne).toHaveBeenCalledWith('entry-123', mockUser.tenantId);
    });

    it('should return 404 when entry not found', async () => {
      timeTrackingService.findOne.mockRejectedValue(
        new HttpException('Time entry not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/time-tracking/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/time-tracking/entry-123').expect(401);
    });
  });

  describe('PUT /time-tracking/:id', () => {
    it('should update time entry successfully', async () => {
      const updatedEntry = {
        ...mockTimeEntry,
        hours: 6,
        description: 'Updated description',
      };

      timeTrackingService.update.mockResolvedValue(updatedEntry as any);

      const response = await request(app.getHttpServer())
        .put('/time-tracking/entry-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ hours: 6, description: 'Updated description' })
        .expect(200);

      expect(response.body.hours).toBe(6);
      expect(response.body.description).toBe('Updated description');
      expect(timeTrackingService.update).toHaveBeenCalledWith(
        'entry-123',
        6,
        'Updated description',
        mockUser.tenantId,
        mockUser,
      );
    });

    it('should return 404 when entry not found', async () => {
      timeTrackingService.update.mockRejectedValue(
        new HttpException('Time entry not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .put('/time-tracking/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .send({ hours: 5, description: 'Test' })
        .expect(404);
    });

    it('should return 400 when updating other user entry', async () => {
      timeTrackingService.update.mockRejectedValue(
        new HttpException('You can only update your own time entries', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .put('/time-tracking/entry-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ hours: 5, description: 'Test' })
        .expect(400);
    });

    it('should validate hours is positive', async () => {
      timeTrackingService.update.mockRejectedValue(
        new HttpException('Hours must be between 0.1 and 24', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .put('/time-tracking/entry-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ hours: 0, description: 'Test' })
        .expect(400);
    });

    it('should validate hours is not more than 24', async () => {
      timeTrackingService.update.mockRejectedValue(
        new HttpException('Hours must be between 0.1 and 24', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .put('/time-tracking/entry-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ hours: 30, description: 'Test' })
        .expect(400);
    });
  });

  describe('DELETE /time-tracking/:id', () => {
    it('should delete time entry successfully', async () => {
      timeTrackingService.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/time-tracking/entry-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(timeTrackingService.remove).toHaveBeenCalledWith(
        'entry-123',
        mockUser.tenantId,
        mockUser,
      );
    });

    it('should return 404 when entry not found', async () => {
      timeTrackingService.remove.mockRejectedValue(
        new HttpException('Time entry not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/time-tracking/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 400 when deleting other user entry', async () => {
      timeTrackingService.remove.mockRejectedValue(
        new HttpException('You can only delete your own time entries', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .delete('/time-tracking/entry-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).delete('/time-tracking/entry-123').expect(401);
    });
  });

  describe('GET /time-tracking/task/:taskId/total', () => {
    it('should return total hours by task', async () => {
      timeTrackingService.getTotalHoursByTask.mockResolvedValue(40);

      const response = await request(app.getHttpServer())
        .get('/time-tracking/task/task-123/total')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.totalHours).toBe(40);
      expect(timeTrackingService.getTotalHoursByTask).toHaveBeenCalledWith(
        'task-123',
        mockUser.tenantId,
      );
    });

    it('should return 0 when no entries', async () => {
      timeTrackingService.getTotalHoursByTask.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/time-tracking/task/task-123/total')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.totalHours).toBe(0);
    });
  });

  describe('GET /time-tracking/project/:projectId/total', () => {
    it('should return total hours by project', async () => {
      timeTrackingService.getTotalHoursByProject.mockResolvedValue(160);

      const response = await request(app.getHttpServer())
        .get('/time-tracking/project/proj-123/total')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.totalHours).toBe(160);
      expect(timeTrackingService.getTotalHoursByProject).toHaveBeenCalledWith(
        'proj-123',
        mockUser.tenantId,
      );
    });

    it('should return 0 when no entries', async () => {
      timeTrackingService.getTotalHoursByProject.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/time-tracking/project/proj-123/total')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.totalHours).toBe(0);
    });
  });

  describe('GET /time-tracking/user/:userId/total', () => {
    it('should return total hours by user', async () => {
      timeTrackingService.getTotalHoursByUser.mockResolvedValue(80);

      const response = await request(app.getHttpServer())
        .get('/time-tracking/user/user-123/total')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.totalHours).toBe(80);
      expect(timeTrackingService.getTotalHoursByUser).toHaveBeenCalledWith(
        'user-123',
        mockUser.tenantId,
        undefined,
        undefined,
      );
    });

    it('should accept date range filters', async () => {
      timeTrackingService.getTotalHoursByUser.mockResolvedValue(40);

      await request(app.getHttpServer())
        .get('/time-tracking/user/user-123/total?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(timeTrackingService.getTotalHoursByUser).toHaveBeenCalledWith(
        'user-123',
        mockUser.tenantId,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );
    });

    it('should return 0 when no entries', async () => {
      timeTrackingService.getTotalHoursByUser.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/time-tracking/user/user-123/total')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.totalHours).toBe(0);
    });
  });

  describe('GET /time-tracking/billable/summary', () => {
    it('should return billable hours summary', async () => {
      const summary = {
        totalHours: 120,
        totalCost: 12000,
      };

      timeTrackingService.getBillableHours.mockResolvedValue(summary);

      const response = await request(app.getHttpServer())
        .get('/time-tracking/billable/summary')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(summary);
      expect(timeTrackingService.getBillableHours).toHaveBeenCalledWith(mockUser.tenantId, {});
    });

    it('should filter by user', async () => {
      timeTrackingService.getBillableHours.mockResolvedValue({
        totalHours: 40,
        totalCost: 4000,
      });

      await request(app.getHttpServer())
        .get('/time-tracking/billable/summary?userId=user-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(timeTrackingService.getBillableHours).toHaveBeenCalledWith(mockUser.tenantId, {
        userId: 'user-123',
      });
    });

    it('should filter by project', async () => {
      timeTrackingService.getBillableHours.mockResolvedValue({
        totalHours: 80,
        totalCost: 8000,
      });

      await request(app.getHttpServer())
        .get('/time-tracking/billable/summary?projectId=proj-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(timeTrackingService.getBillableHours).toHaveBeenCalledWith(mockUser.tenantId, {
        projectId: 'proj-123',
      });
    });

    it('should filter by date range', async () => {
      timeTrackingService.getBillableHours.mockResolvedValue({
        totalHours: 60,
        totalCost: 6000,
      });

      await request(app.getHttpServer())
        .get('/time-tracking/billable/summary?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(timeTrackingService.getBillableHours).toHaveBeenCalledWith(mockUser.tenantId, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });
    });

    it('should return 0 when no billable entries', async () => {
      timeTrackingService.getBillableHours.mockResolvedValue({
        totalHours: 0,
        totalCost: 0,
      });

      const response = await request(app.getHttpServer())
        .get('/time-tracking/billable/summary')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.totalHours).toBe(0);
      expect(response.body.totalCost).toBe(0);
    });
  });

  describe('Authorization', () => {
    it('should allow user to log time', async () => {
      timeTrackingService.create.mockResolvedValue(mockTimeEntry as any);

      await request(app.getHttpServer())
        .post('/time-tracking')
        .set('Authorization', 'Bearer valid-token')
        .send({
          taskId: 'task-123',
          date: '2024-01-15',
          hours: 8,
          description: 'Work',
        })
        .expect(201);
    });

    it('should allow user to read their entries', async () => {
      timeTrackingService.findAll.mockResolvedValue([mockTimeEntry] as any);

      await request(app.getHttpServer())
        .get('/time-tracking')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should allow user to update their entries', async () => {
      timeTrackingService.update.mockResolvedValue(mockTimeEntry as any);

      await request(app.getHttpServer())
        .put('/time-tracking/entry-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ hours: 7, description: 'Updated' })
        .expect(200);
    });

    it('should allow user to delete their entries', async () => {
      timeTrackingService.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/time-tracking/entry-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle service errors gracefully', async () => {
      timeTrackingService.findAll.mockRejectedValue(
        new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/time-tracking')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });

    it('should handle invalid UUID format', async () => {
      timeTrackingService.findOne.mockRejectedValue(
        new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .get('/time-tracking/invalid-uuid')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should handle decimal hours', async () => {
      timeTrackingService.create.mockResolvedValue({
        ...mockTimeEntry,
        hours: 4.5,
      } as any);

      const response = await request(app.getHttpServer())
        .post('/time-tracking')
        .set('Authorization', 'Bearer valid-token')
        .send({
          taskId: 'task-123',
          date: '2024-01-15',
          hours: 4.5,
          description: 'Half day work',
        })
        .expect(201);

      expect(response.body.hours).toBe(4.5);
    });

    it('should handle concurrent updates', async () => {
      timeTrackingService.update.mockRejectedValue(
        new HttpException('Resource has been modified by another user', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .put('/time-tracking/entry-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ hours: 5, description: 'Update' })
        .expect(409);
    });

    it('should handle future dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      timeTrackingService.create.mockResolvedValue({
        ...mockTimeEntry,
        date: futureDate,
      } as any);

      await request(app.getHttpServer())
        .post('/time-tracking')
        .set('Authorization', 'Bearer valid-token')
        .send({
          taskId: 'task-123',
          date: futureDate.toISOString(),
          hours: 8,
          description: 'Planned work',
        })
        .expect(201);
    });
  });
});
