import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { createMockUser } from '@/common/test/test-helpers';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  const mockAuditService = {
    findAll: jest.fn(),
    findByEntity: jest.fn(),
    findByUser: jest.fn(),
    getActivitySummary: jest.fn(),
  };

  const mockUser = createMockUser();

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
      const mockLogs = [
        { id: '1', action: 'CREATE', entityType: 'User' },
        { id: '2', action: 'UPDATE', entityType: 'Product' },
      ];
      mockAuditService.findAll.mockResolvedValue(mockLogs);

      const result = await controller.findAll(
        mockUser,
        '2024-01-01',
        '2024-12-31',
        'user-1',
        'User',
      );

      expect(result).toEqual(mockLogs);
      expect(service.findAll).toHaveBeenCalledWith(
        mockUser,
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        'user-1',
        'User',
      );
    });

    it('should return audit logs without date filters', async () => {
      const mockLogs = [{ id: '1', action: 'CREATE' }];
      mockAuditService.findAll.mockResolvedValue(mockLogs);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(mockLogs);
      expect(service.findAll).toHaveBeenCalledWith(
        mockUser,
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });
  });

  describe('findByEntity', () => {
    it('should return audit logs for specific entity', async () => {
      const entityType = 'Product';
      const entityId = 'product-1';
      const mockLogs = [
        { id: '1', action: 'CREATE', entityType, entityId },
        { id: '2', action: 'UPDATE', entityType, entityId },
      ];
      mockAuditService.findByEntity.mockResolvedValue(mockLogs);

      const result = await controller.findByEntity(mockUser, entityType, entityId);

      expect(result).toEqual(mockLogs);
      expect(service.findByEntity).toHaveBeenCalledWith(mockUser, entityType, entityId);
    });
  });

  describe('findByUser', () => {
    it('should return audit logs for specific user', async () => {
      const userId = 'user-1';
      const mockLogs = [
        { id: '1', action: 'CREATE', userId },
        { id: '2', action: 'UPDATE', userId },
      ];
      mockAuditService.findByUser.mockResolvedValue(mockLogs);

      const result = await controller.findByUser(mockUser, userId);

      expect(result).toEqual(mockLogs);
      expect(service.findByUser).toHaveBeenCalledWith(mockUser, userId);
    });
  });

  describe('getActivitySummary', () => {
    it('should return activity summary for date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      const mockSummary = {
        totalActions: 100,
        byAction: { CREATE: 50, UPDATE: 30, DELETE: 20 },
        byEntityType: { User: 40, Product: 60 },
      };
      mockAuditService.getActivitySummary.mockResolvedValue(mockSummary);

      const result = await controller.getActivitySummary(mockUser, startDate, endDate);

      expect(result).toEqual(mockSummary);
      expect(service.getActivitySummary).toHaveBeenCalledWith(
        mockUser,
        new Date(startDate),
        new Date(endDate),
      );
    });
  });
});
