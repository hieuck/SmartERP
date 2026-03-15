/**
 * CategoryController Integration Tests
 * Coverage target: 95%+
 * 
 * Test cases:
 * 1. POST /categories - Create category
 * 2. GET /categories - Get all categories
 * 3. GET /categories/count - Get category count
 * 4. GET /categories/tree - Get category tree
 * 5. GET /categories/root - Get root categories
 * 6. GET /categories/code/:code - Get category by code
 * 7. GET /categories/:id - Get category by ID
 * 8. GET /categories/:id/children - Get category children
 * 9. PUT /categories/:id - Update category
 * 10. PATCH /categories/:id/activate - Activate category
 * 11. PATCH /categories/:id/deactivate - Deactivate category
 * 12. PATCH /categories/:id/reorder - Reorder category
 * 13. DELETE /categories/:id - Delete category
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

describe('CategoryController (Integration)', () => {
  let app: INestApplication;
  let categoryService: jest.Mocked<CategoryService>;

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    tenantId: 'tenant-123',
    role: 'admin',
  };

  const mockCategory = {
    id: 'cat-123',
    code: 'CAT-001',
    name: 'Electronics',
    description: 'Electronic products',
    parentId: null,
    level: 0,
    path: '',
    sortOrder: 1,
    isActive: true,
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateCategoryDto = {
    code: 'CAT-002',
    name: 'Computers',
    description: 'Computer products',
    parentId: null,
    sortOrder: 2,
  };

  beforeAll(async () => {
    const mockCategoryService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByCode: jest.fn(),
      findRootCategories: jest.fn(),
      findChildren: jest.fn(),
      findTree: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      reorder: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader !== 'Bearer invalid-token') {
          request.user = mockUser;
          return true;
        }
        
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const mockTenantGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockCategoryService,
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

    categoryService = moduleFixture.get(CategoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /categories', () => {
    it('should create category successfully', async () => {
      categoryService.create.mockResolvedValue(mockCategory as any);

      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', 'Bearer valid-token')
        .send(mockCreateCategoryDto)
        .expect(201);

      expect(response.body).toEqual(mockCategory);
      expect(categoryService.create).toHaveBeenCalledWith(mockUser, mockCreateCategoryDto);
    });

    it('should return 409 when code already exists', async () => {
      categoryService.create.mockRejectedValue(
        new HttpException('Category with code \'CAT-002\' already exists', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', 'Bearer valid-token')
        .send(mockCreateCategoryDto)
        .expect(409);
    });

    it('should return 400 with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .send(mockCreateCategoryDto)
        .expect(401);
    });
  });

  describe('GET /categories', () => {
    it('should get all categories successfully', async () => {
      const categories = [mockCategory, { ...mockCategory, id: 'cat-124', code: 'CAT-002' }];
      categoryService.findAll.mockResolvedValue(categories as any);

      const response = await request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(categories);
      expect(categoryService.findAll).toHaveBeenCalledWith(mockUser);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/categories')
        .expect(401);
    });
  });

  describe('GET /categories/count', () => {
    it('should get category count successfully', async () => {
      categoryService.count.mockResolvedValue(10);

      const response = await request(app.getHttpServer())
        .get('/categories/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toBe(10);
      expect(categoryService.count).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('GET /categories/tree', () => {
    it('should get category tree successfully', async () => {
      const tree = [{ ...mockCategory, children: [] }];
      categoryService.findTree.mockResolvedValue(tree as any);

      const response = await request(app.getHttpServer())
        .get('/categories/tree')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(tree);
      expect(categoryService.findTree).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('GET /categories/root', () => {
    it('should get root categories successfully', async () => {
      categoryService.findRootCategories.mockResolvedValue([mockCategory] as any);

      const response = await request(app.getHttpServer())
        .get('/categories/root')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([mockCategory]);
    });
  });

  describe('GET /categories/code/:code', () => {
    it('should get category by code successfully', async () => {
      categoryService.findByCode.mockResolvedValue(mockCategory as any);

      const response = await request(app.getHttpServer())
        .get('/categories/code/CAT-001')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockCategory);
      expect(categoryService.findByCode).toHaveBeenCalledWith(mockUser, 'CAT-001');
    });

    it('should return 404 when code not found', async () => {
      categoryService.findByCode.mockRejectedValue(
        new HttpException('Category with code \'CAT-999\' not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/categories/code/CAT-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('GET /categories/:id', () => {
    it('should get category by ID successfully', async () => {
      categoryService.findOne.mockResolvedValue(mockCategory as any);

      const response = await request(app.getHttpServer())
        .get('/categories/cat-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockCategory);
      expect(categoryService.findOne).toHaveBeenCalledWith(mockUser, 'cat-123');
    });

    it('should return 404 when ID not found', async () => {
      categoryService.findOne.mockRejectedValue(
        new HttpException('Category with ID cat-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/categories/cat-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('GET /categories/:id/children', () => {
    it('should get category children successfully', async () => {
      const children = [{ ...mockCategory, id: 'cat-124', parentId: 'cat-123' }];
      categoryService.findChildren.mockResolvedValue(children as any);

      const response = await request(app.getHttpServer())
        .get('/categories/cat-123/children')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(children);
      expect(categoryService.findChildren).toHaveBeenCalledWith(mockUser, 'cat-123');
    });
  });

  describe('PUT /categories/:id', () => {
    it('should update category successfully', async () => {
      const updateDto = { name: 'Updated Electronics' };
      const updated = { ...mockCategory, ...updateDto };
      categoryService.update.mockResolvedValue(updated as any);

      const response = await request(app.getHttpServer())
        .put('/categories/cat-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe('Updated Electronics');
      expect(categoryService.update).toHaveBeenCalledWith(mockUser, 'cat-123', updateDto);
    });

    it('should return 404 when category not found', async () => {
      categoryService.update.mockRejectedValue(
        new HttpException('Category with ID cat-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .put('/categories/cat-999')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Updated' })
        .expect(404);
    });

    it('should return 409 when code conflicts', async () => {
      categoryService.update.mockRejectedValue(
        new HttpException('Category with code \'CAT-002\' already exists', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .put('/categories/cat-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ code: 'CAT-002' })
        .expect(409);
    });
  });

  describe('PATCH /categories/:id/activate', () => {
    it('should activate category successfully', async () => {
      const activated = { ...mockCategory, isActive: true };
      categoryService.activate.mockResolvedValue(activated as any);

      const response = await request(app.getHttpServer())
        .patch('/categories/cat-123/activate')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.isActive).toBe(true);
      expect(categoryService.activate).toHaveBeenCalledWith(mockUser, 'cat-123');
    });
  });

  describe('PATCH /categories/:id/deactivate', () => {
    it('should deactivate category successfully', async () => {
      const deactivated = { ...mockCategory, isActive: false };
      categoryService.deactivate.mockResolvedValue(deactivated as any);

      const response = await request(app.getHttpServer())
        .patch('/categories/cat-123/deactivate')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.isActive).toBe(false);
      expect(categoryService.deactivate).toHaveBeenCalledWith(mockUser, 'cat-123');
    });
  });

  describe('PATCH /categories/:id/reorder', () => {
    it('should reorder category successfully', async () => {
      const reordered = { ...mockCategory, sortOrder: 5 };
      categoryService.reorder.mockResolvedValue(reordered as any);

      const response = await request(app.getHttpServer())
        .patch('/categories/cat-123/reorder')
        .set('Authorization', 'Bearer valid-token')
        .send({ sortOrder: 5 })
        .expect(200);

      expect(response.body.sortOrder).toBe(5);
      expect(categoryService.reorder).toHaveBeenCalledWith(mockUser, 'cat-123', 5);
    });

    it('should return 400 with invalid sortOrder', async () => {
      await request(app.getHttpServer())
        .patch('/categories/cat-123/reorder')
        .set('Authorization', 'Bearer valid-token')
        .send({ sortOrder: 'invalid' })
        .expect(400);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete category successfully', async () => {
      categoryService.remove.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/categories/cat-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Category deleted successfully');
      expect(categoryService.remove).toHaveBeenCalledWith(mockUser, 'cat-123');
    });

    it('should return 404 when category not found', async () => {
      categoryService.remove.mockRejectedValue(
        new HttpException('Category with ID cat-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/categories/cat-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 400 when category has children', async () => {
      categoryService.remove.mockRejectedValue(
        new HttpException('Cannot delete category with subcategories', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .delete('/categories/cat-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .delete('/categories/cat-123')
        .expect(401);
    });
  });
});
