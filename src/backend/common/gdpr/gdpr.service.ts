import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consent, ConsentType } from './entities/consent.entity';
import { DataExportRequest, ExportStatus } from './entities/data-export-request.entity';
import { DataDeletionRequest, DeletionStatus } from './entities/data-deletion-request.entity';
import { CreateConsentDto } from './dto/create-consent.dto';
import { RequestDataExportDto } from './dto/request-data-export.dto';
import { RequestDataDeletionDto } from './dto/request-data-deletion.dto';
import { ApproveDeletionDto } from './dto/approve-deletion.dto';

@Injectable()
export class GdprService {
  constructor(
    @InjectRepository(Consent)
    private consentRepository: Repository<Consent>,
    @InjectRepository(DataExportRequest)
    private exportRepository: Repository<DataExportRequest>,
    @InjectRepository(DataDeletionRequest)
    private deletionRepository: Repository<DataDeletionRequest>,
  ) {}

  // ==================== CONSENT MANAGEMENT ====================

  async createConsent(
    userId: string,
    tenantId: string,
    dto: CreateConsentDto,
  ): Promise<Consent> {
    // Revoke previous consent of same type if exists
    await this.consentRepository.update(
      { userId, tenantId, type: dto.type, granted: true },
      { revokedAt: new Date() },
    );

    const consent = this.consentRepository.create({
      ...dto,
      userId,
      tenantId,
    });

    return this.consentRepository.save(consent);
  }

  async revokeConsent(
    userId: string,
    tenantId: string,
    type: ConsentType,
  ): Promise<void> {
    await this.consentRepository.update(
      { userId, tenantId, type, granted: true, revokedAt: null },
      { revokedAt: new Date() },
    );
  }

  async getUserConsents(userId: string, tenantId: string): Promise<Consent[]> {
    return this.consentRepository.find({
      where: { userId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async hasActiveConsent(
    userId: string,
    tenantId: string,
    type: ConsentType,
  ): Promise<boolean> {
    const consent = await this.consentRepository.findOne({
      where: { userId, tenantId, type, granted: true, revokedAt: null },
    });
    return !!consent;
  }

  // ==================== DATA EXPORT (GDPR Article 20) ====================

  async requestDataExport(
    userId: string,
    tenantId: string,
    dto: RequestDataExportDto,
  ): Promise<DataExportRequest> {
    const request = this.exportRepository.create({
      userId,
      tenantId,
      format: dto.format,
    });

    return this.exportRepository.save(request);
  }

  async getExportRequest(
    id: string,
    userId: string,
    tenantId: string,
  ): Promise<DataExportRequest> {
    const request = await this.exportRepository.findOne({
      where: { id, userId, tenantId },
    });

    if (!request) {
      throw new NotFoundException('Export request not found');
    }

    return request;
  }

  async getUserExportRequests(
    userId: string,
    tenantId: string,
  ): Promise<DataExportRequest[]> {
    return this.exportRepository.find({
      where: { userId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async processDataExport(requestId: string): Promise<void> {
    const request = await this.exportRepository.findOne({
      where: { id: requestId },
      relations: ['user'],
    });

    if (!request) {
      throw new NotFoundException('Export request not found');
    }

    if (request.status !== ExportStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    // Update status to processing
    request.status = ExportStatus.PROCESSING;
    await this.exportRepository.save(request);

    try {
      // TODO: Implement actual data export logic
      // 1. Collect all user data from all tables
      // 2. Format according to request.format (JSON/CSV/PDF)
      // 3. Upload to secure storage (S3, MinIO, etc.)
      // 4. Generate download URL with expiry
      
      // For now, just mark as completed
      request.status = ExportStatus.COMPLETED;
      request.completedAt = new Date();
      request.fileUrl = 'https://example.com/exports/user-data.json'; // TODO: Real URL
      request.fileSize = 1024; // TODO: Real size
      
      await this.exportRepository.save(request);
    } catch (error) {
      request.status = ExportStatus.FAILED;
      request.errorMessage = error.message;
      await this.exportRepository.save(request);
      throw error;
    }
  }

  // ==================== DATA DELETION (GDPR Article 17) ====================

  async requestDataDeletion(
    userId: string,
    tenantId: string,
    dto: RequestDataDeletionDto,
  ): Promise<DataDeletionRequest> {
    // Check if there's already a pending request
    const existingRequest = await this.deletionRepository.findOne({
      where: { userId, tenantId, status: DeletionStatus.PENDING },
    });

    if (existingRequest) {
      throw new BadRequestException('You already have a pending deletion request');
    }

    const request = this.deletionRepository.create({
      userId,
      tenantId,
      reason: dto.reason,
    });

    return this.deletionRepository.save(request);
  }

  async getDeletionRequest(
    id: string,
    userId: string,
    tenantId: string,
  ): Promise<DataDeletionRequest> {
    const request = await this.deletionRepository.findOne({
      where: { id, userId, tenantId },
    });

    if (!request) {
      throw new NotFoundException('Deletion request not found');
    }

    return request;
  }

  async getUserDeletionRequests(
    userId: string,
    tenantId: string,
  ): Promise<DataDeletionRequest[]> {
    return this.deletionRepository.find({
      where: { userId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async approveDeletionRequest(
    requestId: string,
    approvedBy: string,
    dto: ApproveDeletionDto,
  ): Promise<DataDeletionRequest> {
    const request = await this.deletionRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Deletion request not found');
    }

    if (request.status !== DeletionStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    if (dto.approved) {
      request.status = DeletionStatus.APPROVED;
      request.approvedBy = approvedBy;
      request.approvedAt = new Date();
    } else {
      request.status = DeletionStatus.REJECTED;
      request.rejectionReason = dto.rejectionReason;
    }

    return this.deletionRepository.save(request);
  }

  async processDataDeletion(requestId: string): Promise<void> {
    const request = await this.deletionRepository.findOne({
      where: { id: requestId },
      relations: ['user'],
    });

    if (!request) {
      throw new NotFoundException('Deletion request not found');
    }

    if (request.status !== DeletionStatus.APPROVED) {
      throw new BadRequestException('Request is not approved');
    }

    // Update status to processing
    request.status = DeletionStatus.PROCESSING;
    await this.deletionRepository.save(request);

    try {
      // TODO: Implement actual data deletion logic
      // 1. Anonymize or delete user data from all tables
      // 2. Keep audit logs for compliance
      // 3. Handle foreign key constraints
      // 4. Notify user via email
      
      // For now, just mark as completed
      request.status = DeletionStatus.COMPLETED;
      request.completedAt = new Date();
      
      await this.deletionRepository.save(request);
    } catch (error) {
      request.status = DeletionStatus.FAILED;
      request.errorMessage = error.message;
      await this.deletionRepository.save(request);
      throw error;
    }
  }

  // ==================== ADMIN FUNCTIONS ====================

  async getAllDeletionRequests(tenantId: string): Promise<DataDeletionRequest[]> {
    return this.deletionRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async getPendingDeletionRequests(tenantId: string): Promise<DataDeletionRequest[]> {
    return this.deletionRepository.find({
      where: { tenantId, status: DeletionStatus.PENDING },
      order: { createdAt: 'ASC' },
      relations: ['user'],
    });
  }
}
