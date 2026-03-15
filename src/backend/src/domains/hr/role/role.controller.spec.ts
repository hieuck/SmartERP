/**
 * RoleController Integration Tests
 * Coverage target: 95%
 *
 * Test cases:
 * 1. POST /roles - Create role
 * 2. GET /roles - Get all roles
 * 3. GET /roles/count - Get role count
 * 4. GET /roles/name/:name - Get role by name
 * 5. GET /roles/:id - Get role by ID
 * 6. PUT /roles/:id - Update role
 * 7. PATCH /roles/:id/permissions/add - Add permissions to role
 * 8. PATCH /roles/:id/permissions/remove - Remove permissions from role
 * 9. DELETE /roles/:id - Delete role
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { SyncStatus } from '@/common/enums/sync-status.enum';

describe('RoleController (Integration)', () => {
  let app: INestApplication;
  let roleService: jest.Mocked<RoleService>;

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const mockRole = {
    id: 'role-123',
    name: 'manager',
    description: 'Manager role',
    permissions: [] as unknown[],
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    version: 1,
    syncStatus: SyncStatus.SYNCED,
    isSystem: false,
    createdBy: 'user-123',
    updatedBy: null,
  };

  beforeAll(async () => {
    const mockRoleService = {
      create: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      findByName: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      addPermissions: jest.fn(),
      removePermissions: jest.fn(),
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

    const mockTenantGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        if (request.user && request.user.tenantId) {
          return true;
        }
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
          useValue: mockRoleService,
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

    roleService = moduleFixture.get(RoleService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /roles', () => {
    it('should create role successfully', async () => {
      const createDto = {
        name: 'supervisor',
        description: 'Supervisor role',
      };

      roleService.create.mockResolvedValue({
        ...mockRole,
        name: 'supervisor',
        description: 'Supervisor role',
      });

      const response = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe('supervisor');
      expect(roleService.create).toHaveBeenCalledWith(createDto, mockUser);
    });

    it('should return 409 when role name already exists', async () => {
      const createDto = {
        name: 'manager',
        description: 'Manager role',
      };

      roleService.create.mockRejectedValue(
        new HttpException('Role with name "manager" already exists', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(409);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).post('/roles').send({ name: 'test' }).expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });
  });

  describe('GET /roles', () => {
    it('should return all roles', async () => {
      const roles = [mockRole];
      roleService.findAll.mockResolvedValue(roles);

      const response = await request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(roles);
      expect(roleService.findAll).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('GET /roles/count', () => {
    it('should return role count', async () => {
      roleService.count.mockResolvedValue(10);

      const response = await request(app.getHttpServer())
        .get('/roles/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({ count: 10 });
      expect(roleService.count).toHaveBeenCalledWith(mockUser);
    });

    it('should return 0 when no roles', async () => {
      roleService.count.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/roles/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({ count: 0 });
    });
  });

  describe('GET /roles/name/:name', () => {
    it('should return role by name', async () => {
      roleService.findByName.mockResolvedValue(mockRole);

      const response = await request(app.getHttpServer())
        .get('/roles/name/manager')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockRole);
      expect(roleService.findByName).toHaveBeenCalledWith('manager', mockUser);
    });

    it('should return 404 when role not found', async () => {
      roleService.findByName.mockRejectedValue(
        new HttpException('Role with name "nonexistent" not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/roles/name/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('GET /roles/:id', () => {
    it('should return role by ID', async () => {
      roleService.findOne.mockResolvedValue(mockRole);

      const response = await request(app.getHttpServer())
        .get('/roles/role-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockRole);
      expect(roleService.findOne).toHaveBeenCalledWith('role-123', mockUser);
    });

    it('should return 404 when role not found', async () => {
      roleService.findOne.mockRejectedValue(
        new HttpException('Role not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/roles/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('PUT /roles/:id', () => {
    it('should update role successfully', async () => {
      const updateDto = {
        description: 'Updated description',
      };

      const updatedRole = { ...mockRole, description: 'Updated description' };
      roleService.update.mockResolvedValue(updatedRole);

      const response = await request(app.getHttpServer())
        .put('/roles/role-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.description).toBe('Updated description');
      expect(roleService.update).toHaveBeenCalledWith('role-123', updateDto, mockUser);
    });

    it('should return 404 when role not found', async () => {
      roleService.update.mockRejectedValue(
        new HttpException('Role not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .put('/roles/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .send({ description: 'Test' })
        .expect(404);
    });

    it('should return 409 when new name conflicts', async () => {
      roleService.update.mockRejectedValue(
        new HttpException('Role with name "existing" already exists', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .put('/roles/role-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'existing' })
        .expect(409);
    });
  });

  describe('PATCH /roles/:id/permissions/add', () => {
    it('should add permissions to role successfully', async () => {
      const permissionIds = ['perm-1', 'perm-2'];
      const updatedRole = { ...mockRole, permissions: permissionIds as unknown[] };

      roleService.addPermissions.mockResolvedValue(updatedRole);

      const response = await request(app.getHttpServer())
        .patch('/roles/role-123/permissions/add')
        .set('Authorization', 'Bearer valid-token')
        .send({ permissionIds })
        .expect(200);

      expect(response.body.permissions).toEqual(permissionIds);
      expect(roleService.addPermissions).toHaveBeenCalledWith('role-123', permissionIds, mockUser);
    });

    it('should return 404 when role not found', async () => {
      roleService.addPermissions.mockRejectedValue(
        new HttpException('Role not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/roles/non-existent/permissions/add')
        .set('Authorization', 'Bearer valid-token')
        .send({ permissionIds: ['perm-1'] })
        .expect(404);
    });
  });

  describe('PATCH /roles/:id/permissions/remove', () => {
    it('should remove permissions from role successfully', async () => {
      const permissionIds = ['perm-1'];
      const updatedRole = { ...mockRole, permissions: [] };

      roleService.removePermissions.mockResolvedValue(updatedRole);

      const response = await request(app.getHttpServer())
        .patch('/roles/role-123/permissions/remove')
        .set('Authorization', 'Bearer valid-token')
        .send({ permissionIds })
        .expect(200);

      expect(response.body.permissions).toEqual([]);
      expect(roleService.removePermissions).toHaveBeenCalledWith(
        'role-123',
        permissionIds,
        mockUser,
      );
    });

    it('should return 404 when role not found', async () => {
      roleService.removePermissions.mockRejectedValue(
        new HttpException('Role not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/roles/non-existent/permissions/remove')
        .set('Authorization', 'Bearer valid-token')
        .send({ permissionIds: ['perm-1'] })
        .expect(404);
    });
  });

  describe('DELETE /roles/:id', () => {
    it('should delete role successfully', async () => {
      roleService.remove.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/roles/role-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Role deleted successfully');
      expect(roleService.remove).toHaveBeenCalledWith('role-123', mockUser);
    });

    it('should return 404 when role not found', async () => {
      roleService.remove.mockRejectedValue(
        new HttpException('Role not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/roles/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 400 when role is in use', async () => {
      roleService.remove.mockRejectedValue(
        new HttpException('Cannot delete role that is assigned to users', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .delete('/roles/role-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });
});
