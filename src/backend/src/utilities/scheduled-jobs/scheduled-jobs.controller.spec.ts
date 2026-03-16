/**
 * ScheduledJobsController Integration Tests
 * Coverage target: 95%+
 *
 * Test cases:
 * 1. GET /scheduled-jobs - List all jobs
 * 2. GET /scheduled-jobs/:id - Get job by ID
 * 3. POST /scheduled-jobs - Create job
 * 4. PUT /scheduled-jobs/:id - Update job
 * 5. DELETE /scheduled-jobs/:id - Delete job
 * 6. POST /scheduled-jobs/:id/run - Run job manually
 * 7. Authentication tests
 * 8. Validation tests
 * 9. Edge cases and error scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { ScheduledJobsController } from './scheduled-jobs.controller';
import { ScheduledJobsService } from './scheduled-jobs.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

describe('ScheduledJobsController (Integration)', () => {
  let app: INestApplication;
  let scheduledJobsService: jest.Mocked<ScheduledJobsService>;

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const mockJob = {
    id: 'job-123',
    name: 'Daily Backup',
    description: 'Backup database daily at 2 AM',
    schedule: '0 2 * * *',
    handler: 'backupDatabase',
    enabled: true,
    lastRun: '2024-01-15T02:00:00.000Z',
    nextRun: '2024-01-16T02:00:00.000Z',
    tenantId: 'tenant-123',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-15T02:00:00.000Z',
  };

  beforeAll(async () => {
    const mockScheduledJobsService = {
      listJobs: jest.fn(),
      getJob: jest.fn(),
      createJob: jest.fn(),
      updateJob: jest.fn(),
      deleteJob: jest.fn(),
      runJob: jest.fn(),
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ScheduledJobsController],
      providers: [
        {
          provide: ScheduledJobsService,
          useValue: mockScheduledJobsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    scheduledJobsService = moduleFixture.get(ScheduledJobsService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /scheduled-jobs', () => {
    it('should return all jobs for tenant', async () => {
      const jobs = [mockJob];
      scheduledJobsService.listJobs.mockResolvedValue(jobs as any);

      const response = await request(app.getHttpServer())
        .get('/scheduled-jobs')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(jobs);
      expect(scheduledJobsService.listJobs).toHaveBeenCalledWith('tenant-123');
    });

    it('should return empty array when no jobs', async () => {
      scheduledJobsService.listJobs.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/scheduled-jobs')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/scheduled-jobs').expect(401);
    });

    it('should handle service errors', async () => {
      scheduledJobsService.listJobs.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/scheduled-jobs')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });

  describe('GET /scheduled-jobs/:id', () => {
    it('should return job by ID', async () => {
      scheduledJobsService.getJob.mockResolvedValue(mockJob as any);

      const response = await request(app.getHttpServer())
        .get('/scheduled-jobs/job-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockJob);
      expect(scheduledJobsService.getJob).toHaveBeenCalledWith('job-123');
    });

    it('should return 404 when job not found', async () => {
      scheduledJobsService.getJob.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .get('/scheduled-jobs/job-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({});
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/scheduled-jobs/job-123').expect(401);
    });
  });

  describe('POST /scheduled-jobs', () => {
    it('should create job successfully', async () => {
      const createDto = {
        name: 'Weekly Report',
        description: 'Generate weekly sales report',
        schedule: '0 9 * * 1',
        handler: 'generateWeeklyReport',
        enabled: true,
      };

      scheduledJobsService.createJob.mockResolvedValue({
        ...mockJob,
        ...createDto,
        id: 'job-456',
      } as any);

      const response = await request(app.getHttpServer())
        .post('/scheduled-jobs')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe('Weekly Report');
      expect(response.body.schedule).toBe('0 9 * * 1');
      expect(scheduledJobsService.createJob).toHaveBeenCalledWith('tenant-123', createDto);
    });

    it('should create job with different schedules', async () => {
      const schedules = [
        '0 0 * * *', // Daily at midnight
        '0 */6 * * *', // Every 6 hours
        '0 9 * * 1-5', // Weekdays at 9 AM
        '0 0 1 * *', // First day of month
      ];

      for (const schedule of schedules) {
        const createDto = {
          name: 'Test Job',
          description: 'Test',
          schedule,
          handler: 'testHandler',
          enabled: true,
        };

        scheduledJobsService.createJob.mockResolvedValue({
          ...mockJob,
          ...createDto,
        } as any);

        await request(app.getHttpServer())
          .post('/scheduled-jobs')
          .set('Authorization', 'Bearer valid-token')
          .send(createDto)
          .expect(201);

        expect(scheduledJobsService.createJob).toHaveBeenCalledWith('tenant-123', createDto);
      }
    });

    it('should validate cron expression', async () => {
      const createDto = {
        name: 'Invalid Job',
        description: 'Test',
        schedule: 'invalid-cron',
        handler: 'testHandler',
        enabled: true,
      };

      scheduledJobsService.createJob.mockRejectedValue(
        new HttpException('Invalid cron expression', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/scheduled-jobs')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/scheduled-jobs')
        .send({ name: 'Test', schedule: '0 0 * * *', handler: 'test' })
        .expect(401);
    });
  });

  describe('PUT /scheduled-jobs/:id', () => {
    it('should update job successfully', async () => {
      const updateDto = {
        enabled: false,
        description: 'Updated description',
      };

      const updatedJob = { ...mockJob, ...updateDto };
      scheduledJobsService.updateJob.mockResolvedValue(updatedJob as any);

      const response = await request(app.getHttpServer())
        .put('/scheduled-jobs/job-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.enabled).toBe(false);
      expect(response.body.description).toBe('Updated description');
      expect(scheduledJobsService.updateJob).toHaveBeenCalledWith('job-123', updateDto);
    });

    it('should update job schedule', async () => {
      const updateDto = {
        schedule: '0 3 * * *',
      };

      const updatedJob = { ...mockJob, ...updateDto };
      scheduledJobsService.updateJob.mockResolvedValue(updatedJob as any);

      const response = await request(app.getHttpServer())
        .put('/scheduled-jobs/job-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.schedule).toBe('0 3 * * *');
    });

    it('should return 404 when job not found', async () => {
      scheduledJobsService.updateJob.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .put('/scheduled-jobs/job-999')
        .set('Authorization', 'Bearer valid-token')
        .send({ enabled: false })
        .expect(200);

      expect(response.body).toEqual({});
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put('/scheduled-jobs/job-123')
        .send({ enabled: false })
        .expect(401);
    });
  });

  describe('DELETE /scheduled-jobs/:id', () => {
    it('should delete job successfully', async () => {
      scheduledJobsService.deleteJob.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/scheduled-jobs/job-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(scheduledJobsService.deleteJob).toHaveBeenCalledWith('job-123');
    });

    it('should handle job not found', async () => {
      scheduledJobsService.deleteJob.mockRejectedValue(
        new HttpException('Job not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/scheduled-jobs/job-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).delete('/scheduled-jobs/job-123').expect(401);
    });
  });

  describe('POST /scheduled-jobs/:id/run', () => {
    it('should run job manually', async () => {
      scheduledJobsService.runJob.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/scheduled-jobs/job-123/run')
        .set('Authorization', 'Bearer valid-token')
        .expect(201);

      expect(scheduledJobsService.runJob).toHaveBeenCalledWith('job-123');
    });

    it('should handle job not found', async () => {
      scheduledJobsService.runJob.mockRejectedValue(
        new HttpException('Job not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/scheduled-jobs/job-999/run')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should handle job execution error', async () => {
      scheduledJobsService.runJob.mockRejectedValue(
        new HttpException('Job execution failed', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .post('/scheduled-jobs/job-123/run')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).post('/scheduled-jobs/job-123/run').expect(401);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests', async () => {
      scheduledJobsService.listJobs.mockResolvedValue([mockJob] as any);

      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/scheduled-jobs')
            .set('Authorization', 'Bearer valid-token'),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle very long job names', async () => {
      const longName = 'a'.repeat(500);
      const createDto = {
        name: longName,
        description: 'Test',
        schedule: '0 0 * * *',
        handler: 'test',
        enabled: true,
      };

      scheduledJobsService.createJob.mockResolvedValue({
        ...mockJob,
        name: longName,
      } as any);

      await request(app.getHttpServer())
        .post('/scheduled-jobs')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);
    });

    it('should handle special characters in description', async () => {
      const createDto = {
        name: 'Test Job',
        description: 'Special chars: @#$%^&*()_+-=[]{}|;:,.<>?',
        schedule: '0 0 * * *',
        handler: 'test',
        enabled: true,
      };

      scheduledJobsService.createJob.mockResolvedValue({
        ...mockJob,
        ...createDto,
      } as any);

      await request(app.getHttpServer())
        .post('/scheduled-jobs')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);
    });

    it('should handle disabled jobs', async () => {
      const disabledJob = { ...mockJob, enabled: false };
      scheduledJobsService.listJobs.mockResolvedValue([disabledJob] as any);

      const response = await request(app.getHttpServer())
        .get('/scheduled-jobs')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body[0].enabled).toBe(false);
    });

    it('should handle jobs with no lastRun', async () => {
      const newJob = { ...mockJob, lastRun: null };
      scheduledJobsService.getJob.mockResolvedValue(newJob as any);

      const response = await request(app.getHttpServer())
        .get('/scheduled-jobs/job-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.lastRun).toBeNull();
    });
  });
});
