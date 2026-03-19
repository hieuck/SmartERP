import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';

const mockUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  email: 'test@example.com',
  role: 'admin',
  roles: ['admin'],
};

const mockPO = {
  id: 'po-1',
  tenantId: 'tenant-1',
  poNumber: 'PO-001',
  supplierId: 'supplier-1',
  status: 'draft',
  totalAmount: 1000,
  items: [],
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  softDelete: jest.fn(),
};

const mockCacheService = {
  getOrSet: jest.fn((key, fn) => fn()),
  del: jest.fn(),
};

const mockPermissionService = {
  canRead: jest.fn().mockReturnValue(true),
  canWrite: jest.fn().mockReturnValue(true),
  canDelete: jest.fn().mockReturnValue(true),
  buildSecureQuery: jest.fn((_user, query) => query),
};

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrderService,
        { provide: getRepositoryToken(PurchaseOrder), useValue: mockRepository },
        { provide: CacheService, useValue: mockCacheService },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
    }).compile();

    service = module.get<PurchaseOrderService>(PurchaseOrderService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated purchase orders', async () => {
      mockRepository.find.mockResolvedValue([mockPO]);

      const result = await service.findAll(mockUser as any, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should return empty array when no orders', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll(mockUser as any, 1, 20);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a purchase order by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockPO);

      const result = await service.findOne(mockUser as any, 'po-1');

      expect(result).toEqual(mockPO);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser as any, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      poNumber: 'PO-002',
      supplierId: 'supplier-1',
      items: [{ productId: 'p-1', productName: 'Product 1', quantity: 2, unitPrice: 500 }],
    };

    it('should create a purchase order', async () => {
      mockRepository.findOne.mockResolvedValue(null); // no duplicate
      mockRepository.save.mockResolvedValue({ ...mockPO, ...createDto });

      const result = await service.create(mockUser as any, createDto as any);

      expect(result.poNumber).toBe('PO-002');
    });

    it('should throw ConflictException for duplicate PO number', async () => {
      mockRepository.findOne.mockResolvedValue(mockPO); // duplicate exists

      await expect(service.create(mockUser as any, createDto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update a purchase order', async () => {
      mockRepository.findOne.mockResolvedValue(mockPO);
      mockRepository.save.mockResolvedValue({ ...mockPO, notes: 'Updated' });

      const result = await service.update(mockUser as any, 'po-1', { notes: 'Updated' } as any);

      expect(result.notes).toBe('Updated');
    });

    it('should throw NotFoundException when updating nonexistent order', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(mockUser as any, 'nonexistent', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a purchase order', async () => {
      mockRepository.findOne.mockResolvedValue(mockPO);
      mockRepository.remove.mockResolvedValue(mockPO);

      await expect(service.remove(mockUser as any, 'po-1')).resolves.not.toThrow();
    });
  });

  describe('updateStatus', () => {
    it('should update status to confirmed', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockPO, status: 'draft' });
      mockRepository.save.mockResolvedValue({ ...mockPO, status: 'confirmed' });

      const result = await service.updateStatus(mockUser as any, 'po-1', 'confirmed');

      expect(result.status).toBe('confirmed');
    });

    it('should throw BadRequestException when cancelling received order', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockPO, status: 'received' });

      await expect(service.updateStatus(mockUser as any, 'po-1', 'cancelled')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findBySupplier', () => {
    it('should return orders for a supplier', async () => {
      mockRepository.find.mockResolvedValue([mockPO]);

      const result = await service.findBySupplier(mockUser as any, 'supplier-1');

      expect(result).toHaveLength(1);
    });
  });

  describe('getStatistics', () => {
    it('should return purchase order statistics', async () => {
      mockRepository.find.mockResolvedValue([mockPO, { ...mockPO, status: 'received' }]);

      const result = await service.getStatistics(mockUser as any);

      expect(result.totalOrders).toBe(2);
      expect(result.byStatus).toBeDefined();
    });
  });
});
