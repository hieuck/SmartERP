import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GdprService } from './gdpr.service';
import { Consent, ConsentType } from './entities/consent.entity';
import { DataExportRequest, ExportStatus } from './entities/data-export-request.entity';
import { DataDeletionRequest, DeletionStatus } from './entities/data-deletion-request.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('GdprService', () => {
  let service: GdprService;
  let consentRepository: Repository<Consent>;
  let exportRepository: Repository<DataExportRequest>;
  let deletionRepository: Repository<DataDeletionRequest>;

  const mockConsentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockExportRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockDeletionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GdprService,
        {
          provide: getRepositoryToken(Consent),
          useValue: mockConsentRepository,
        },
        {
          provide: getRepositoryToken(DataExportRequest),
          useValue: mockExportRepository,
        },
        {
          provide: getRepositoryToken(DataDeletionRequest),
          useValue: mockDeletionRepository,
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

  describe('Consent Management', () => {
    it('should create consent', async () => {
      const dto = {
        type: ConsentType.PRIVACY_POLICY,
        granted: true,
        version: '1.0',
      };
      const consent = { id: '1', ...dto, userId: 'user1', tenantId: 'tenant1' };

      mockConsentRepository.create.mockReturnValue(consent);
      mockConsentRepository.save.mockResolvedValue(consent);
      mockConsentRepository.update.mockResolvedValue({ affected: 0 });

      const result = await service.createConsent('user1', 'tenant1', dto);

      expect(result).toEqual(consent);
      expect(mockConsentRepository.update).toHaveBeenCalled();
      expect(mockConsentRepository.save).toHaveBeenCalledWith(consent);
    });

    it('should check active consent', async () => {
      mockConsentRepository.findOne.mockResolvedValue({ id: '1', granted: true });

      const result = await service.hasActiveConsent('user1', 'tenant1', ConsentType.PRIVACY_POLICY);

      expect(result).toBe(true);
    });
  });

  describe('Data Export', () => {
    it('should request data export', async () => {
      const dto = { format: 'json' as any };
      const request = { id: '1', userId: 'user1', tenantId: 'tenant1', status: ExportStatus.PENDING };

      mockExportRepository.create.mockReturnValue(request);
      mockExportRepository.save.mockResolvedValue(request);

      const result = await service.requestDataExport('user1', 'tenant1', dto);

      expect(result).toEqual(request);
      expect(mockExportRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if export request not found', async () => {
      mockExportRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getExportRequest('invalid-id', 'user1', 'tenant1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Data Deletion', () => {
    it('should request data deletion', async () => {
      const dto = { reason: 'I want to delete my account' };
      const request = { id: '1', userId: 'user1', tenantId: 'tenant1', status: DeletionStatus.PENDING };

      mockDeletionRepository.findOne.mockResolvedValue(null);
      mockDeletionRepository.create.mockReturnValue(request);
      mockDeletionRepository.save.mockResolvedValue(request);

      const result = await service.requestDataDeletion('user1', 'tenant1', dto);

      expect(result).toEqual(request);
    });

    it('should throw BadRequestException if pending request exists', async () => {
      mockDeletionRepository.findOne.mockResolvedValue({ id: '1', status: DeletionStatus.PENDING });

      await expect(
        service.requestDataDeletion('user1', 'tenant1', { reason: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should approve deletion request', async () => {
      const request = { id: '1', status: DeletionStatus.PENDING };
      const updated = { ...request, status: DeletionStatus.APPROVED, approvedBy: 'admin1' };

      mockDeletionRepository.findOne.mockResolvedValue(request);
      mockDeletionRepository.save.mockResolvedValue(updated);

      const result = await service.approveDeletionRequest('1', 'admin1', { approved: true });

      expect(result.status).toBe(DeletionStatus.APPROVED);
    });
  });
});
