import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  const mockAuditService = {
    findAll: jest.fn(),
    findByEntity: jest.fn(),
    findByUser: jest.fn(),
    getActivitySummary: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return audit logs with filters', async () => {
      const tenantId = 'tenant-1';
      const mockLogs = [
        { id: '1', action: 'CREATE', entityType: 'User' },
        { id: '2', action: 'UPDATE', entityType: 'Product' },
      ];
      mockAuditService.findAll.mockResolvedValue(mockLogs);

      const result = await controller.findAll(
        tenantId,
        '2024-01-01',
        '2024-12-31',
        'user-1',
        'User',
      );

      expect(result).toEqual(mockLogs);
      expect(service.findAll).toHaveBeenCalledWith(
        tenantId,
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        'user-1',
        'User',
      );
    });

    it('should return audit logs without date filters', async () => {
      const tenantId = 'tenant-1';
      const mockLogs = [{ id: '1', action: 'CREATE' }];
      mockAuditService.findAll.mockResolvedValue(mockLogs);

      const result = await controller.findAll(tenantId);

      expect(result).toEqual(mockLogs);
      expect(service.findAll).toHaveBeenCalledWith(
        tenantId,
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });
  });

  describe('findByEntity', () => {
    it('should return audit logs for specific entity', async () => {
      const tenantId = 'tenant-1';
      const entityType = 'Product';
      const entityId = 'product-1';
      const mockLogs = [
        { id: '1', action: 'CREATE', entityType, entityId },
        { id: '2', action: 'UPDATE', entityType, entityId },
      ];
      mockAuditService.findByEntity.mockResolvedValue(mockLogs);

      const result = await controller.findByEntity(tenantId, entityType, entityId);

      expect(result).toEqual(mockLogs);
      expect(service.findByEntity).toHaveBeenCalledWith(tenantId, entityType, entityId);
    });
  });

  describe('findByUser', () => {
    it('should return audit logs for specific user', async () => {
      const tenantId = 'tenant-1';
      const userId = 'user-1';
      const mockLogs = [
        { id: '1', action: 'CREATE', userId },
        { id: '2', action: 'UPDATE', userId },
      ];
      mockAuditService.findByUser.mockResolvedValue(mockLogs);

      const result = await controller.findByUser(tenantId, userId);

      expect(result).toEqual(mockLogs);
      expect(service.findByUser).toHaveBeenCalledWith(tenantId, userId);
    });
  });

  describe('getActivitySummary', () => {
    it('should return activity summary for date range', async () => {
      const tenantId = 'tenant-1';
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      const mockSummary = {
        totalActions: 100,
        byAction: { CREATE: 50, UPDATE: 30, DELETE: 20 },
        byEntityType: { User: 40, Product: 60 },
      };
      mockAuditService.getActivitySummary.mockResolvedValue(mockSummary);

      const result = await controller.getActivitySummary(tenantId, startDate, endDate);

      expect(result).toEqual(mockSummary);
      expect(service.getActivitySummary).toHaveBeenCalledWith(
        tenantId,
        new Date(startDate),
        new Date(endDate),
      );
    });
  });
});
