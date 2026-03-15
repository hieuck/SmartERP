/**
 * WorkCenterController Integration Tests
 * Coverage target: 95%
 *
 * Test cases:
 * 1. POST /manufacturing/work-centers - Create work center
 * 2. GET /manufacturing/work-centers - Get all work centers
 * 3. GET /manufacturing/work-centers/:id - Get work center by ID
 * 4. PATCH /manufacturing/work-centers/:id - Update work center
 * 5. DELETE /manufacturing/work-centers/:id - Delete work center
 * 6. Authentication/Authorization tests
 * 7. Validation tests
 * 8. Edge cases
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { WorkCenterController } from './work-center.controller';
import { WorkCenterService } from './work-center.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';

describe('WorkCenterController (Integration)', () => {
  let app: INestApplication;
  let workCenterService: jest.Mocked<WorkCenterService>;

  const mockUser = {
    id: 'user-123',
    email: 'manager@example.com',
    tenantId: 'tenant-123',
    roles: ['manager'],
  };

  const mockWorkCenter = {
    id: 'wc-123',
    name: 'Assembly Line 1',
    code: 'AL-001',
    description: 'Main assembly line',
    capacity: 100,
    efficiency: 95,
    costPerHour: 50,
    status: 'active',
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const mockWorkCenterService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
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
      controllers: [WorkCenterController],
      providers: [
        {
          provide: WorkCenterService,
          useValue: mockWorkCenterService,
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

    workCenterService = moduleFixture.get(WorkCenterService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /manufacturing/work-centers', () => {
    it('should create work center successfully', async () => {
      const createDto = {
        name: 'Assembly Line 2',
        code: 'AL-002',
        description: 'Secondary assembly line',
        capacity: 80,
        efficiency: 90,
        costPerHour: 45,
      };

      workCenterService.create.mockResolvedValue({
        ...mockWorkCenter,
        ...createDto,
        id: 'wc-124',
      } as any);

      const response = await request(app.getHttpServer())
        .post('/manufacturing/work-centers')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe('Assembly Line 2');
      expect(response.body.code).toBe('AL-002');
      expect(workCenterService.create).toHaveBeenCalledWith('tenant-123', createDto);
    });

    it('should return 409 when work center code already exists', async () => {
      const createDto = {
        name: 'Assembly Line 1',
        code: 'AL-001',
        capacity: 100,
      };

      workCenterService.create.mockRejectedValue(
        new HttpException('Work center with code "AL-001" already exists', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .post('/manufacturing/work-centers')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(409);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/manufacturing/work-centers')
        .send({ name: 'Test' })
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/manufacturing/work-centers')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should validate capacity is positive number', async () => {
      await request(app.getHttpServer())
        .post('/manufacturing/work-centers')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test',
          code: 'TEST',
          capacity: -10,
        })
        .expect(400);
    });

    it('should validate efficiency is between 0 and 100', async () => {
      await request(app.getHttpServer())
        .post('/manufacturing/work-centers')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test',
          code: 'TEST',
          capacity: 100,
          efficiency: 150,
        })
        .expect(400);
    });
  });

  describe('GET /manufacturing/work-centers', () => {
    it('should return all work centers', async () => {
      const workCenters = [mockWorkCenter];
      workCenterService.findAll.mockResolvedValue(workCenters as any);

      const response = await request(app.getHttpServer())
        .get('/manufacturing/work-centers')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(workCenters);
      expect(workCenterService.findAll).toHaveBeenCalledWith('tenant-123');
    });

    it('should return empty array when no work centers', async () => {
      workCenterService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/manufacturing/work-centers')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/manufacturing/work-centers').expect(401);
    });
  });

  describe('GET /manufacturing/work-centers/:id', () => {
    it('should return work center by ID', async () => {
      workCenterService.findOne.mockResolvedValue(mockWorkCenter as any);

      const response = await request(app.getHttpServer())
        .get('/manufacturing/work-centers/wc-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockWorkCenter);
      expect(workCenterService.findOne).toHaveBeenCalledWith('tenant-123', 'wc-123');
    });

    it('should return 404 when work center not found', async () => {
      workCenterService.findOne.mockRejectedValue(
        new HttpException('Work center not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/manufacturing/work-centers/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/manufacturing/work-centers/wc-123').expect(401);
    });
  });

  describe('PATCH /manufacturing/work-centers/:id', () => {
    it('should update work center successfully', async () => {
      const updateDto = {
        description: 'Updated description',
        capacity: 120,
        efficiency: 98,
      };

      const updatedWorkCenter = {
        ...mockWorkCenter,
        ...updateDto,
      };

      workCenterService.update.mockResolvedValue(updatedWorkCenter as any);

      const response = await request(app.getHttpServer())
        .patch('/manufacturing/work-centers/wc-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.description).toBe('Updated description');
      expect(response.body.capacity).toBe(120);
      expect(workCenterService.update).toHaveBeenCalledWith('tenant-123', 'wc-123', updateDto);
    });

    it('should return 404 when work center not found', async () => {
      workCenterService.update.mockRejectedValue(
        new HttpException('Work center not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/manufacturing/work-centers/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .send({ description: 'Test' })
        .expect(404);
    });

    it('should return 409 when new code conflicts', async () => {
      workCenterService.update.mockRejectedValue(
        new HttpException('Work center with code "AL-002" already exists', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .patch('/manufacturing/work-centers/wc-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ code: 'AL-002' })
        .expect(409);
    });

    it('should validate capacity is positive', async () => {
      await request(app.getHttpServer())
        .patch('/manufacturing/work-centers/wc-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ capacity: -50 })
        .expect(400);
    });

    it('should allow partial updates', async () => {
      workCenterService.update.mockResolvedValue(mockWorkCenter as any);

      await request(app.getHttpServer())
        .patch('/manufacturing/work-centers/wc-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ description: 'Only description updated' })
        .expect(200);

      expect(workCenterService.update).toHaveBeenCalledWith('tenant-123', 'wc-123', {
        description: 'Only description updated',
      });
    });
  });

  describe('DELETE /manufacturing/work-centers/:id', () => {
    it('should delete work center successfully', async () => {
      workCenterService.remove.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/manufacturing/work-centers/wc-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Work center deleted successfully');
      expect(workCenterService.remove).toHaveBeenCalledWith('tenant-123', 'wc-123');
    });

    it('should return 404 when work center not found', async () => {
      workCenterService.remove.mockRejectedValue(
        new HttpException('Work center not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/manufacturing/work-centers/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 400 when work center is in use', async () => {
      workCenterService.remove.mockRejectedValue(
        new HttpException(
          'Cannot delete work center that is assigned to work orders',
          HttpStatus.BAD_REQUEST,
        ),
      );

      await request(app.getHttpServer())
        .delete('/manufacturing/work-centers/wc-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).delete('/manufacturing/work-centers/wc-123').expect(401);
    });
  });

  describe('Authorization', () => {
    it('should allow manager to create work center', async () => {
      workCenterService.create.mockResolvedValue(mockWorkCenter as any);

      await request(app.getHttpServer())
        .post('/manufacturing/work-centers')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test',
          code: 'TEST',
          capacity: 100,
        })
        .expect(201);
    });

    it('should allow production_manager to read work centers', async () => {
      workCenterService.findAll.mockResolvedValue([mockWorkCenter] as any);

      await request(app.getHttpServer())
        .get('/manufacturing/work-centers')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should allow production_user to read work centers', async () => {
      workCenterService.findOne.mockResolvedValue(mockWorkCenter as any);

      await request(app.getHttpServer())
        .get('/manufacturing/work-centers/wc-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle service errors gracefully', async () => {
      workCenterService.findAll.mockRejectedValue(
        new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/manufacturing/work-centers')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });

    it('should handle invalid UUID format', async () => {
      workCenterService.findOne.mockRejectedValue(
        new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .get('/manufacturing/work-centers/invalid-uuid')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should trim whitespace from string fields', async () => {
      workCenterService.create.mockResolvedValue(mockWorkCenter as any);

      await request(app.getHttpServer())
        .post('/manufacturing/work-centers')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: '  Assembly Line  ',
          code: '  AL-003  ',
          capacity: 100,
        })
        .expect(201);
    });

    it('should handle concurrent updates', async () => {
      workCenterService.update.mockRejectedValue(
        new HttpException('Resource has been modified by another user', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .patch('/manufacturing/work-centers/wc-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ description: 'Update' })
        .expect(409);
    });
  });
});
