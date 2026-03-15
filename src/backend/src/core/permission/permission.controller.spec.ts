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
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

import { PermissionAction } from './enums/permission-action.enum';

describe('PermissionController (Integration)', () => {
  let app: INestApplication;
  let permissionService: jest.Mocked<PermissionService>;

  const mockAuthUser = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const mockPermission = {
    id: 'permission-123',
    resource: 'users',
    actions: [PermissionAction.READ],
    description: 'Read users',
    roles: [],
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
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
        const authHeader = request.headers.authorization;

        // Check if Authorization header exists and is valid
        if (authHeader && authHeader.startsWith('Bearer ')) {
          request.user = mockAuthUser;
          return true;
        }

        // No token - throw UnauthorizedException
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const mockTenantGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        // TenantGuard checks if user has tenantId
        if (request.user && request.user.tenantId) {
          return true;
        }
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }),
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
        actions: [PermissionAction.CREATE],
        description: 'Create products',
      };

      permissionService.create.mockResolvedValue({
        ...mockPermission,
        resource: 'products',
        actions: [PermissionAction.CREATE],
        description: 'Create products',
      });

      const response = await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.resource).toBe('products');
      expect(response.body.actions).toContain(PermissionAction.CREATE);
      expect(permissionService.create).toHaveBeenCalledWith(mockAuthUser, createDto);
    });

    it('should return 409 when permission already exists', async () => {
      const createDto = {
        resource: 'users',
        actions: [PermissionAction.READ],
        description: 'Read users',
      };

      permissionService.create.mockRejectedValue(
        new HttpException("Permission for resource 'users' already exists", HttpStatus.CONFLICT),
      );

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
        {
          ...mockPermission,
          createdAt: mockPermission.createdAt.toISOString(),
          updatedAt: mockPermission.updatedAt.toISOString(),
        },
        {
          ...mockPermission,
          id: 'permission-456',
          resource: 'products',
          actions: [PermissionAction.READ, PermissionAction.UPDATE],
          createdAt: mockPermission.createdAt.toISOString(),
          updatedAt: mockPermission.updatedAt.toISOString(),
        },
      ];
      permissionService.findAll.mockResolvedValue(permissions as any);

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

      expect(response.body).toEqual({ count: 15 });
      expect(permissionService.count).toHaveBeenCalledWith(mockAuthUser);
    });

    it('should return 0 when no permissions', async () => {
      permissionService.count.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/permissions/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({ count: 0 });
    });
  });

  describe('GET /permissions/resource/:resource', () => {
    it('should return permission by resource', async () => {
      const permission = {
        ...mockPermission,
        createdAt: mockPermission.createdAt.toISOString(),
        updatedAt: mockPermission.updatedAt.toISOString(),
      };
      permissionService.findByResource.mockResolvedValue(permission as any);

      const response = await request(app.getHttpServer())
        .get('/permissions/resource/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(permission);
      expect(permissionService.findByResource).toHaveBeenCalledWith(mockAuthUser, 'users');
    });

    it('should return 404 when resource not found', async () => {
      permissionService.findByResource.mockRejectedValue(
        new HttpException("Permission for resource 'nonexistent' not found", HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/permissions/resource/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('GET /permissions/:id', () => {
    it('should return permission by ID', async () => {
      const permission = {
        ...mockPermission,
        createdAt: mockPermission.createdAt.toISOString(),
        updatedAt: mockPermission.updatedAt.toISOString(),
      };
      permissionService.findOne.mockResolvedValue(permission as any);

      const response = await request(app.getHttpServer())
        .get('/permissions/permission-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(permission);
      expect(permissionService.findOne).toHaveBeenCalledWith(mockAuthUser, 'permission-123');
    });

    it('should return 404 when permission not found', async () => {
      permissionService.findOne.mockRejectedValue(
        new HttpException('Permission with ID non-existent not found', HttpStatus.NOT_FOUND),
      );

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

      permissionService.update.mockRejectedValue(
        new HttpException(
          "Permission for resource 'existing-resource' already exists",
          HttpStatus.CONFLICT,
        ),
      );

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

      permissionService.update.mockRejectedValue(
        new HttpException('Permission not found', HttpStatus.NOT_FOUND),
      );

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
      permissionService.remove.mockRejectedValue(
        new HttpException('Permission not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/permissions/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should require authentication', async () => {
      const mockJwtAuthGuard = {
        canActivate: jest.fn().mockImplementation(() => {
          throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }),
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

      await request(testApp.getHttpServer()).get('/permissions').expect(401);

      await testApp.close();
    });

    it('should require tenant context', async () => {
      const mockTenantGuard = {
        canActivate: jest.fn().mockImplementation(() => {
          throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }),
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
        .useValue({
          canActivate: jest.fn().mockImplementation((context) => {
            const request = context.switchToHttp().getRequest();
            request.user = mockAuthUser;
            return true;
          }),
        })
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
