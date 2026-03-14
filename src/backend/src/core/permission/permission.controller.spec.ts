/**
 * PermissionController Integration Tests
 * Coverage target: 99%
 * 
 * Test cases:
 * 1. POST /permissions - Create permission
 * 2. GET /permissions - Get all permissions
 * 3. GET /permissions/count - Get permission count
 * 4. GET /permissions/resource/:resource - Get permission by resource
 * 5. GET /permissions/:id - Get permission by ID
 * 6. PUT /permissions/:id - Update permission
 * 7. DELETE /permissions/:id - Delete permission
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

describe('PermissionController (Integration)', () => {
  let app: INestApplication;
  let permissionService: jest.Mocked<PermissionService>;

  const mockAuthUser = {
    id: 'user-123',
    userId: 'user-123',
    tenantId: 'tenant-123',
    email: 'admin@example.com',
    role: 'admin',
  };

  const mockPermission = {
    id: 'permission-123',
    resource: 'users',
    action: 'read',
    description: 'Read users',
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const mockPermissionService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByResource: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        request.user = mockAuthUser;
        return true;
      }),
    };

    const mockTenantGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PermissionController],
      providers: [
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockTenantGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    permissionService = moduleFixture.get(PermissionService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /permissions', () => {
    it('should create permission successfully', async () => {
      const createDto = {
        resource: 'products',
        action: 'create',
        description: 'Create products',
      };

      permissionService.create.mockResolvedValue({
        ...mockPermission,
        ...createDto,
      });

      const response = await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.resource).toBe('products');
      expect(response.body.action).toBe('create');
      expect(permissionService.create).toHaveBeenCalledWith(mockAuthUser, createDto);
    });

    it('should return 409 when permission already exists', async () => {
      const createDto = {
        resource: 'users',
        action: 'read',
        description: 'Read users',
      };

      permissionService.create.mockRejectedValue({
        status: 409,
        message: "Permission for resource 'users' already exists",
      });

      await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(409);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', 'Bearer valid-token')
        .send({
          resource: 'products',
        })
        .expect(400);
    });
  });

  describe('GET /permissions', () => {
    it('should return all permissions', async () => {
      const permissions = [
        mockPermission,
        { ...mockPermission, id: 'permission-456', resource: 'products' },
      ];
      permissionService.findAll.mockResolvedValue(permissions);

      const response = await request(app.getHttpServer())
        .get('/permissions')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(permissions);
      expect(permissionService.findAll).toHaveBeenCalledWith(mockAuthUser);
    });

    it('should return empty array when no permissions', async () => {
      permissionService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/permissions')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /permissions/count', () => {
    it('should return permission count', async () => {
      permissionService.count.mockResolvedValue(15);

      const response = await request(app.getHttpServer())
        .get('/permissions/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toBe(15);
      expect(permissionService.count).toHaveBeenCalledWith(mockAuthUser);
    });

    it('should return 0 when no permissions', async () => {
      permissionService.count.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/permissions/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toBe(0);
    });
  });

  describe('GET /permissions/resource/:resource', () => {
    it('should return permission by resource', async () => {
      permissionService.findByResource.mockResolvedValue(mockPermission);

      const response = await request(app.getHttpServer())
        .get('/permissions/resource/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockPermission);
      expect(permissionService.findByResource).toHaveBeenCalledWith(mockAuthUser, 'users');
    });

    it('should return 404 when resource not found', async () => {
      permissionService.findByResource.mockRejectedValue({
        status: 404,
        message: "Permission for resource 'nonexistent' not found",
      });

      await request(app.getHttpServer())
        .get('/permissions/resource/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('GET /permissions/:id', () => {
    it('should return permission by ID', async () => {
      permissionService.findOne.mockResolvedValue(mockPermission);

      const response = await request(app.getHttpServer())
        .get('/permissions/permission-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockPermission);
      expect(permissionService.findOne).toHaveBeenCalledWith(mockAuthUser, 'permission-123');
    });

    it('should return 404 when permission not found', async () => {
      permissionService.findOne.mockRejectedValue({
        status: 404,
        message: 'Permission with ID non-existent not found',
      });

      await request(app.getHttpServer())
        .get('/permissions/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('PUT /permissions/:id', () => {
    it('should update permission successfully', async () => {
      const updateDto = {
        description: 'Updated description',
      };

      const updatedPermission = {
        ...mockPermission,
        description: 'Updated description',
      };

      permissionService.update.mockResolvedValue(updatedPermission);

      const response = await request(app.getHttpServer())
        .put('/permissions/permission-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.description).toBe('Updated description');
      expect(permissionService.update).toHaveBeenCalledWith(
        mockAuthUser,
        'permission-123',
        updateDto,
      );
    });

    it('should return 409 when new resource name conflicts', async () => {
      const updateDto = {
        resource: 'existing-resource',
      };

      permissionService.update.mockRejectedValue({
        status: 409,
        message: "Permission for resource 'existing-resource' already exists",
      });

      await request(app.getHttpServer())
        .put('/permissions/permission-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(409);
    });

    it('should return 404 when permission not found', async () => {
      const updateDto = {
        description: 'Updated description',
      };

      permissionService.update.mockRejectedValue({
        status: 404,
        message: 'Permission not found',
      });

      await request(app.getHttpServer())
        .put('/permissions/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(404);
    });
  });

  describe('DELETE /permissions/:id', () => {
    it('should delete permission successfully', async () => {
      permissionService.remove.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/permissions/permission-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Permission deleted successfully');
      expect(permissionService.remove).toHaveBeenCalledWith(mockAuthUser, 'permission-123');
    });

    it('should return 404 when permission not found', async () => {
      permissionService.remove.mockRejectedValue({
        status: 404,
        message: 'Permission not found',
      });

      await request(app.getHttpServer())
        .delete('/permissions/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should require authentication', async () => {
      const mockJwtAuthGuard = {
        canActivate: jest.fn().mockReturnValue(false),
      };

      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [PermissionController],
        providers: [
          {
            provide: PermissionService,
            useValue: permissionService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(mockJwtAuthGuard)
        .overrideGuard(TenantGuard)
        .useValue({ canActivate: jest.fn().mockReturnValue(true) })
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      await request(testApp.getHttpServer()).get('/permissions').expect(403);

      await testApp.close();
    });

    it('should require tenant context', async () => {
      const mockTenantGuard = {
        canActivate: jest.fn().mockReturnValue(false),
      };

      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [PermissionController],
        providers: [
          {
            provide: PermissionService,
            useValue: permissionService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: jest.fn().mockReturnValue(true) })
        .overrideGuard(TenantGuard)
        .useValue(mockTenantGuard)
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      await request(testApp.getHttpServer())
        .get('/permissions')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      await testApp.close();
    });
  });
});
