import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GdprService } from './gdpr.service';
import { Consent } from './entities/consent.entity';
import { DataExportRequest } from './entities/data-export-request.entity';
import { DataDeletionRequest } from './entities/data-deletion-request.entity';
import { ConsentType } from './enums/consent-type.enum';
import { ExportStatus } from './enums/export-status.enum';
import { ExportFormat } from './enums/export-format.enum';
import { DeletionStatus } from './enums/deletion-status.enum';
import { CreateConsentDto } from './dto/create-consent.dto';
import { RequestDataExportDto } from './dto/request-data-export.dto';
import { RequestDataDeletionDto } from './dto/request-data-deletion.dto';
import { ApproveDeletionDto } from './dto/approve-deletion.dto';

describe('GdprService', () => {
  let service: GdprService;
  let consentRepository: jest.Mocked<Repository<Consent>>;
  let exportRepository: jest.Mocked<Repository<DataExportRequest>>;
  let deletionRepository: jest.Mocked<Repository<DataDeletionRequest>>;

  const userId = 'user-1';
  const tenantId = 'tenant-1';

  const mockConsent = {
    id: 'consent-1',
    userId,
    tenantId,
    user: null,
    type: ConsentType.MARKETING_EMAILS,
    granted: true,
    version: '1.0',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    revokedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    get isActive() {
      return this.granted && !this.revokedAt;
    },
  } as Consent;

  const mockExportRequest = {
    id: 'export-1',
    userId,
    tenantId,
    user: null,
    format: ExportFormat.JSON,
    status: ExportStatus.PENDING,
    fileUrl: null,
    fileSize: null,
    expiresAt: null,
    completedAt: null,
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    setExpiryDate: jest.fn(),
    get isExpired() {
      return this.expiresAt && new Date() > this.expiresAt;
    },
  } as DataExportRequest;

  const mockDeletionRequest = {
    id: 'deletion-1',
    userId,
    tenantId,
    reason: 'No longer need account',
    status: DeletionStatus.PENDING,
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    completedAt: null,
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    get isPending() {
      return this.status === DeletionStatus.PENDING;
    },
    get isApproved() {
      return this.status === DeletionStatus.APPROVED;
    },
  } as DataDeletionRequest;

  beforeEach(async () => {
    const mockConsentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const mockExportRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const mockDeletionRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GdprService,
        {
          provide: getRepositoryToken(Consent),
          useValue: mockConsentRepo,
        },
        {
          provide: getRepositoryToken(DataExportRequest),
          useValue: mockExportRepo,
        },
        {
          provide: getRepositoryToken(DataDeletionRequest),
          useValue: mockDeletionRepo,
        },
      ],
    }).compile();

    service = module.get<GdprService>(GdprService);
    consentRepository = module.get(getRepositoryToken(Consent));
    exportRepository = module.get(getRepositoryToken(DataExportRequest));
    deletionRepository = module.get(getRepositoryToken(DataDeletionRequest));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== CONSENT MANAGEMENT ====================

  describe('createConsent', () => {
    const createDto: CreateConsentDto = {
      type: ConsentType.MARKETING_EMAILS,
      granted: true,
    };

    it('should create a new consent', async () => {
      consentRepository.update.mockResolvedValue({ affected: 0 } as any);
      consentRepository.create.mockReturnValue(mockConsent);
      consentRepository.save.mockResolvedValue(mockConsent);

      const result = await service.createConsent(userId, tenantId, createDto);

      expect(result).toEqual(mockConsent);
      expect(consentRepository.update).toHaveBeenCalledWith(
        { userId, tenantId, type: createDto.type, granted: true },
        { revokedAt: expect.any(Date) },
      );
      expect(consentRepository.create).toHaveBeenCalledWith({
        ...createDto,
        userId,
        tenantId,
      });
      expect(consentRepository.save).toHaveBeenCalledWith(mockConsent);
    });

    it('should revoke previous consent of same type', async () => {
      consentRepository.update.mockResolvedValue({ affected: 1 } as any);
      consentRepository.create.mockReturnValue(mockConsent);
      consentRepository.save.mockResolvedValue(mockConsent);

      await service.createConsent(userId, tenantId, createDto);

      expect(consentRepository.update).toHaveBeenCalledWith(
        { userId, tenantId, type: createDto.type, granted: true },
        { revokedAt: expect.any(Date) },
      );
    });

    it('should create consent with granted false', async () => {
      const dtoWithFalse = { ...createDto, granted: false };
      const consentWithFalse = { ...mockConsent, granted: false };
      consentRepository.update.mockResolvedValue({ affected: 0 } as any);
      consentRepository.create.mockReturnValue(consentWithFalse);
      consentRepository.save.mockResolvedValue(consentWithFalse);

      const result = await service.createConsent(userId, tenantId, dtoWithFalse);

      expect(result.granted).toBe(false);
    });

    it('should handle different consent types', async () => {
      const types = [
        ConsentType.MARKETING_EMAILS,
        ConsentType.DATA_PROCESSING,
        ConsentType.COOKIES,
      ];

      for (const type of types) {
        const dto = { ...createDto, type };
        const consent = { ...mockConsent, type };
        consentRepository.update.mockResolvedValue({ affected: 0 } as any);
        consentRepository.create.mockReturnValue(consent);
        consentRepository.save.mockResolvedValue(consent);

        const result = await service.createConsent(userId, tenantId, dto);

        expect(result.type).toBe(type);
      }
    });
  });

  describe('revokeConsent', () => {
    it('should revoke active consent', async () => {
      consentRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.revokeConsent(userId, tenantId, ConsentType.MARKETING_EMAILS);

      expect(consentRepository.update).toHaveBeenCalledWith(
        { userId, tenantId, type: ConsentType.MARKETING_EMAILS, granted: true, revokedAt: null },
        { revokedAt: expect.any(Date) },
      );
    });

    it('should handle revoking non-existent consent', async () => {
      consentRepository.update.mockResolvedValue({ affected: 0 } as any);

      await service.revokeConsent(userId, tenantId, ConsentType.MARKETING_EMAILS);

      expect(consentRepository.update).toHaveBeenCalled();
    });

    it('should revoke different consent types', async () => {
      const types = [
        ConsentType.MARKETING_EMAILS,
        ConsentType.DATA_PROCESSING,
        ConsentType.COOKIES,
      ];

      for (const type of types) {
        consentRepository.update.mockResolvedValue({ affected: 1 } as any);

        await service.revokeConsent(userId, tenantId, type);

        expect(consentRepository.update).toHaveBeenCalledWith(
          { userId, tenantId, type, granted: true, revokedAt: null },
          { revokedAt: expect.any(Date) },
        );
      }
    });
  });

  describe('getUserConsents', () => {
    it('should return user consents', async () => {
      const consents = [mockConsent];
      consentRepository.find.mockResolvedValue(consents);

      const result = await service.getUserConsents(userId, tenantId);

      expect(result).toEqual(consents);
      expect(consentRepository.find).toHaveBeenCalledWith({
        where: { userId, tenantId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no consents', async () => {
      consentRepository.find.mockResolvedValue([]);

      const result = await service.getUserConsents(userId, tenantId);

      expect(result).toEqual([]);
    });

    it('should return multiple consents ordered by date', async () => {
      const consent1 = { ...mockConsent, id: 'consent-1', createdAt: new Date('2024-01-01') };
      const consent2 = { ...mockConsent, id: 'consent-2', createdAt: new Date('2024-01-02') };
      consentRepository.find.mockResolvedValue([consent2, consent1]);

      const result = await service.getUserConsents(userId, tenantId);

      expect(result).toHaveLength(2);
      expect(consentRepository.find).toHaveBeenCalledWith({
        where: { userId, tenantId },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('hasActiveConsent', () => {
    it('should return true when active consent exists', async () => {
      consentRepository.findOne.mockResolvedValue(mockConsent);

      const result = await service.hasActiveConsent(userId, tenantId, ConsentType.MARKETING_EMAILS);

      expect(result).toBe(true);
      expect(consentRepository.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          tenantId,
          type: ConsentType.MARKETING_EMAILS,
          granted: true,
          revokedAt: null,
        },
      });
    });

    it('should return false when no active consent', async () => {
      consentRepository.findOne.mockResolvedValue(null);

      const result = await service.hasActiveConsent(userId, tenantId, ConsentType.MARKETING_EMAILS);

      expect(result).toBe(false);
    });

    it('should return false when consent is revoked', async () => {
      consentRepository.findOne.mockResolvedValue(null);

      const result = await service.hasActiveConsent(userId, tenantId, ConsentType.MARKETING_EMAILS);

      expect(result).toBe(false);
    });

    it('should check different consent types', async () => {
      const types = [
        ConsentType.MARKETING_EMAILS,
        ConsentType.DATA_PROCESSING,
        ConsentType.COOKIES,
      ];

      for (const type of types) {
        consentRepository.findOne.mockResolvedValue(mockConsent);

        const result = await service.hasActiveConsent(userId, tenantId, type);

        expect(result).toBe(true);
        expect(consentRepository.findOne).toHaveBeenCalledWith({
          where: { userId, tenantId, type, granted: true, revokedAt: null },
        });
      }
    });
  });

  // ==================== DATA EXPORT ====================

  describe('requestDataExport', () => {
    const requestDto: RequestDataExportDto = {
      format: ExportFormat.JSON,
    };

    it('should create data export request', async () => {
      exportRepository.create.mockReturnValue(mockExportRequest);
      exportRepository.save.mockResolvedValue(mockExportRequest);

      const result = await service.requestDataExport(userId, tenantId, requestDto);

      expect(result).toEqual(mockExportRequest);
      expect(exportRepository.create).toHaveBeenCalledWith({
        userId,
        tenantId,
        format: requestDto.format,
      });
      expect(exportRepository.save).toHaveBeenCalledWith(mockExportRequest);
    });

    it('should handle different export formats', async () => {
      const formats = [ExportFormat.JSON, ExportFormat.CSV, ExportFormat.PDF];

      for (const format of formats) {
        const dto = { format };
        const request = { ...mockExportRequest, format } as any;
        exportRepository.create.mockReturnValue(request);
        exportRepository.save.mockResolvedValue(request);

        const result = await service.requestDataExport(userId, tenantId, dto);

        expect(result.format).toBe(format);
      }
    });
  });

  describe('getExportRequest', () => {
    it('should return export request', async () => {
      exportRepository.findOne.mockResolvedValue(mockExportRequest);

      const result = await service.getExportRequest('export-1', userId, tenantId);

      expect(result).toEqual(mockExportRequest);
      expect(exportRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'export-1', userId, tenantId },
      });
    });

    it('should throw NotFoundException when request not found', async () => {
      exportRepository.findOne.mockResolvedValue(null);

      await expect(service.getExportRequest('non-existent', userId, tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserExportRequests', () => {
    it('should return user export requests', async () => {
      const requests = [mockExportRequest];
      exportRepository.find.mockResolvedValue(requests);

      const result = await service.getUserExportRequests(userId, tenantId);

      expect(result).toEqual(requests);
      expect(exportRepository.find).toHaveBeenCalledWith({
        where: { userId, tenantId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no requests', async () => {
      exportRepository.find.mockResolvedValue([]);

      const result = await service.getUserExportRequests(userId, tenantId);

      expect(result).toEqual([]);
    });
  });

  // ==================== DATA DELETION ====================

  describe('requestDataDeletion', () => {
    const requestDto: RequestDataDeletionDto = {
      reason: 'No longer need account',
    };

    it('should create data deletion request', async () => {
      deletionRepository.findOne.mockResolvedValue(null);
      deletionRepository.create.mockReturnValue(mockDeletionRequest);
      deletionRepository.save.mockResolvedValue(mockDeletionRequest);

      const result = await service.requestDataDeletion(userId, tenantId, requestDto);

      expect(result).toEqual(mockDeletionRequest);
      expect(deletionRepository.create).toHaveBeenCalledWith({
        userId,
        tenantId,
        reason: requestDto.reason,
      });
    });

    it('should throw BadRequestException when pending request exists', async () => {
      const pendingRequest = { ...mockDeletionRequest, status: DeletionStatus.PENDING } as any as any;
      deletionRepository.findOne.mockResolvedValue(pendingRequest);

      await expect(service.requestDataDeletion(userId, tenantId, requestDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow new request when previous is completed', async () => {
      deletionRepository.findOne.mockResolvedValue(null);
      deletionRepository.create.mockReturnValue(mockDeletionRequest);
      deletionRepository.save.mockResolvedValue(mockDeletionRequest);

      const result = await service.requestDataDeletion(userId, tenantId, requestDto);

      expect(result).toEqual(mockDeletionRequest);
    });
  });

  describe('getDeletionRequest', () => {
    it('should return deletion request', async () => {
      deletionRepository.findOne.mockResolvedValue(mockDeletionRequest);

      const result = await service.getDeletionRequest('deletion-1', userId, tenantId);

      expect(result).toEqual(mockDeletionRequest);
      expect(deletionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'deletion-1', userId, tenantId },
      });
    });

    it('should throw NotFoundException when request not found', async () => {
      deletionRepository.findOne.mockResolvedValue(null);

      await expect(service.getDeletionRequest('non-existent', userId, tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserDeletionRequests', () => {
    it('should return user deletion requests', async () => {
      const requests = [mockDeletionRequest];
      deletionRepository.find.mockResolvedValue(requests);

      const result = await service.getUserDeletionRequests(userId, tenantId);

      expect(result).toEqual(requests);
      expect(deletionRepository.find).toHaveBeenCalledWith({
        where: { userId, tenantId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no requests', async () => {
      deletionRepository.find.mockResolvedValue([]);

      const result = await service.getUserDeletionRequests(userId, tenantId);

      expect(result).toEqual([]);
    });
  });

  describe('approveDeletionRequest', () => {
    const approveDto: ApproveDeletionDto = {
      approved: true,
    };

    it('should approve deletion request', async () => {
      const pendingRequest = { ...mockDeletionRequest, status: DeletionStatus.PENDING } as any as any;
      deletionRepository.findOne.mockResolvedValue(pendingRequest);
      deletionRepository.save.mockResolvedValue({
        ...pendingRequest,
        status: DeletionStatus.APPROVED,
        approvedBy: 'admin-1',
        approvedAt: expect.any(Date),
      }) as any;

      const result = await service.approveDeletionRequest('deletion-1', 'admin-1', approveDto);

      expect(result.status).toBe(DeletionStatus.APPROVED);
      expect(result.approvedBy).toBe('admin-1');
      expect(deletionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: DeletionStatus.APPROVED,
          approvedBy: 'admin-1',
          approvedAt: expect.any(Date),
        }),
      );
    });

    it('should reject deletion request', async () => {
      const rejectDto: ApproveDeletionDto = {
        approved: false,
        rejectionReason: 'Insufficient reason',
      };
      const pendingRequest = { ...mockDeletionRequest, status: DeletionStatus.PENDING } as any as any;
      deletionRepository.findOne.mockResolvedValue(pendingRequest);
      deletionRepository.save.mockResolvedValue({
        ...pendingRequest,
        status: DeletionStatus.REJECTED,
        rejectionReason: rejectDto.rejectionReason,
      }) as any;

      const result = await service.approveDeletionRequest('deletion-1', 'admin-1', rejectDto);

      expect(result.status).toBe(DeletionStatus.REJECTED);
      expect(result.rejectionReason).toBe('Insufficient reason');
    });

    it('should throw NotFoundException when request not found', async () => {
      deletionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.approveDeletionRequest('non-existent', 'admin-1', approveDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when request not pending', async () => {
      const approvedRequest = { ...mockDeletionRequest, status: DeletionStatus.APPROVED } as any as any;
      deletionRepository.findOne.mockResolvedValue(approvedRequest);

      await expect(
        service.approveDeletionRequest('deletion-1', 'admin-1', approveDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== ADMIN FUNCTIONS ====================

  describe('getAllDeletionRequests', () => {
    it('should return all deletion requests for tenant', async () => {
      const requests = [mockDeletionRequest];
      deletionRepository.find.mockResolvedValue(requests);

      const result = await service.getAllDeletionRequests(tenantId);

      expect(result).toEqual(requests);
      expect(deletionRepository.find).toHaveBeenCalledWith({
        where: { tenantId },
        order: { createdAt: 'DESC' },
        relations: ['user'],
      });
    });

    it('should return empty array when no requests', async () => {
      deletionRepository.find.mockResolvedValue([]);

      const result = await service.getAllDeletionRequests(tenantId);

      expect(result).toEqual([]);
    });
  });

  describe('getPendingDeletionRequests', () => {
    it('should return pending deletion requests for tenant', async () => {
      const pendingRequests = [{ ...mockDeletionRequest, status: DeletionStatus.PENDING } as any as any];
      deletionRepository.find.mockResolvedValue(pendingRequests);

      const result = await service.getPendingDeletionRequests(tenantId);

      expect(result).toEqual(pendingRequests);
      expect(deletionRepository.find).toHaveBeenCalledWith({
        where: { tenantId, status: DeletionStatus.PENDING },
        order: { createdAt: 'ASC' },
        relations: ['user'],
      });
    });

    it('should return empty array when no pending requests', async () => {
      deletionRepository.find.mockResolvedValue([]);

      const result = await service.getPendingDeletionRequests(tenantId);

      expect(result).toEqual([]);
    });
  });
});
