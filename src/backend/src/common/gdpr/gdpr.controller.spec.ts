/**
 * GdprController Integration Tests
 * Coverage target: 95%
 * 
 * Test cases:
 * 1. POST /gdpr/consent - Create or update consent
 * 2. POST /gdpr/consent/:type/revoke - Revoke consent
 * 3. GET /gdpr/consent - Get user consents
 * 4. GET /gdpr/consent/:type/status - Check active consent
 * 5. POST /gdpr/export - Request data export
 * 6. GET /gdpr/export - Get user export requests
 * 7. GET /gdpr/export/:id - Get export request by ID
 * 8. POST /gdpr/deletion - Request data deletion
 * 9. GET /gdpr/deletion - Get user deletion requests
 * 10. GET /gdpr/deletion/:id - Get deletion request by ID
 * 11. GET /gdpr/admin/deletion/pending - Get pending deletion requests (Admin)
 * 12. GET /gdpr/admin/deletion/all - Get all deletion requests (Admin)
 * 13. PATCH /gdpr/admin/deletion/:id/approve - Approve/reject deletion (Admin)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { GdprController } from './gdpr.controller';
import { GdprService } from './gdpr.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { ConsentType } from './enums/consent-type.enum';
import { ExportStatus } from './enums/export-status.enum';
import { ExportFormat } from './enums/export-format.enum';
import { DeletionStatus } from './enums/deletion-status.enum';

describe('GdprController (Integration)', () => {
  let app: INestApplication;
  let gdprService: jest.Mocked<GdprService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    tenantId: 'tenant-123',
    roles: ['user'],
  };

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const mockConsent = {
    id: 'consent-123',
    userId: 'user-123',
    tenantId: 'tenant-123',
    type: ConsentType.MARKETING_EMAILS,
    granted: true,
    version: '1.0',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    createdAt: '2026-03-15T02:05:39.192Z',
    updatedAt: '2026-03-15T02:05:39.192Z',
    revokedAt: null,
    user: null,
    isActive: true,
  } as any;

  const mockExportRequest = {
    id: 'export-123',
    userId: 'user-123',
    tenantId: 'tenant-123',
    status: ExportStatus.PENDING,
    format: ExportFormat.JSON,
    fileUrl: null,
    fileSize: null,
    expiresAt: '2026-03-22T02:05:39.192Z',
    errorMessage: null,
    createdAt: '2026-03-15T02:05:39.192Z',
    updatedAt: '2026-03-15T02:05:39.192Z',
    completedAt: null,
    user: null,
    isExpired: false,
  } as any;

  const mockDeletionRequest = {
    id: 'deletion-123',
    userId: 'user-123',
    tenantId: 'tenant-123',
    status: DeletionStatus.PENDING,
    reason: 'No longer need account',
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    errorMessage: null,
    createdAt: '2026-03-15T02:05:39.192Z',
    updatedAt: '2026-03-15T02:05:39.192Z',
    completedAt: null,
    user: null,
    isPending: true,
    isApproved: false,
  } as any;

  beforeAll(async () => {
    const mockGdprService = {
      createConsent: jest.fn(),
      revokeConsent: jest.fn(),
      getUserConsents: jest.fn(),
      hasActiveConsent: jest.fn(),
      requestDataExport: jest.fn(),
      getUserExportRequests: jest.fn(),
      getExportRequest: jest.fn(),
      requestDataDeletion: jest.fn(),
      getUserDeletionRequests: jest.fn(),
      getDeletionRequest: jest.fn(),
      getPendingDeletionRequests: jest.fn(),
      getAllDeletionRequests: jest.fn(),
      approveDeletionRequest: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [GdprController],
      providers: [
        {
          provide: GdprService,
          useValue: mockGdprService,
        },
        {
          provide: 'APP_GUARD',
          useValue: {
            canActivate: (context) => {
              const request = context.switchToHttp().getRequest();
              const authHeader = request.headers.authorization;
              
              if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
              }
              
              // Set user based on token
              if (authHeader.includes('admin-token')) {
                request.user = mockAdminUser;
              } else {
                request.user = mockUser;
              }
              
              return true;
            },
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const request = context.switchToHttp().getRequest();
          const authHeader = request.headers.authorization;
          
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
          }
          
          // Set user based on token
          if (authHeader.includes('admin-token')) {
            request.user = mockAdminUser;
          } else {
            request.user = mockUser;
          }
          
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: (context) => {
          const request = context.switchToHttp().getRequest();
          const user = request.user;
          
          // Check if route requires admin role
          if (request.url.includes('/admin/')) {
            if (!user || !user.roles.includes('admin')) {
              throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
            }
          }
          
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    gdprService = moduleFixture.get(GdprService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /gdpr/consent', () => {
    it('should create consent successfully', async () => {
      const createDto = {
        type: ConsentType.MARKETING_EMAILS,
        granted: true,
      };

      gdprService.createConsent.mockResolvedValue(mockConsent);

      const response = await request(app.getHttpServer())
        .post('/gdpr/consent')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockConsent);
      expect(gdprService.createConsent).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.tenantId,
        createDto,
      );
    });

    it('should update existing consent', async () => {
      const updateDto = {
        type: ConsentType.MARKETING_EMAILS,
        granted: false,
      };

      const updatedConsent = { ...mockConsent, granted: false };
      gdprService.createConsent.mockResolvedValue(updatedConsent);

      const response = await request(app.getHttpServer())
        .post('/gdpr/consent')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(201);

      expect(response.body.granted).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/gdpr/consent')
        .send({ type: ConsentType.MARKETING_EMAILS, granted: true })
        .expect(401);
    });
  });

  describe('POST /gdpr/consent/:type/revoke', () => {
    it('should revoke consent successfully', async () => {
      gdprService.revokeConsent.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post(`/gdpr/consent/${ConsentType.MARKETING_EMAILS}/revoke`)
        .set('Authorization', 'Bearer valid-token')
        .expect(201);

      expect(response.body.message).toBe('Consent revoked successfully');
      expect(gdprService.revokeConsent).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.tenantId,
        ConsentType.MARKETING_EMAILS,
      );
    });

    it('should handle non-existent consent', async () => {
      gdprService.revokeConsent.mockRejectedValue(
        new HttpException('Consent not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post(`/gdpr/consent/${ConsentType.DATA_PROCESSING}/revoke`)
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('GET /gdpr/consent', () => {
    it('should return user consents', async () => {
      const consents = [mockConsent];
      gdprService.getUserConsents.mockResolvedValue(consents);

      const response = await request(app.getHttpServer())
        .get('/gdpr/consent')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(consents);
      expect(gdprService.getUserConsents).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.tenantId,
      );
    });

    it('should return empty array when no consents', async () => {
      gdprService.getUserConsents.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/gdpr/consent')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /gdpr/consent/:type/status', () => {
    it('should return true when consent is active', async () => {
      gdprService.hasActiveConsent.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .get(`/gdpr/consent/${ConsentType.MARKETING_EMAILS}/status`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        type: ConsentType.MARKETING_EMAILS,
        hasConsent: true,
      });
    });

    it('should return false when consent is not active', async () => {
      gdprService.hasActiveConsent.mockResolvedValue(false);

      const response = await request(app.getHttpServer())
        .get(`/gdpr/consent/${ConsentType.DATA_PROCESSING}/status`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        type: ConsentType.DATA_PROCESSING,
        hasConsent: false,
      });
    });
  });

  describe('POST /gdpr/export', () => {
    it('should request data export successfully', async () => {
      const exportDto = {
        format: 'json',
        includePersonalData: true,
      };

      gdprService.requestDataExport.mockResolvedValue(mockExportRequest);

      const response = await request(app.getHttpServer())
        .post('/gdpr/export')
        .set('Authorization', 'Bearer valid-token')
        .send(exportDto)
        .expect(201);

      expect(response.body).toEqual(mockExportRequest);
      expect(gdprService.requestDataExport).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.tenantId,
        exportDto,
      );
    });

    it('should handle duplicate export request', async () => {
      const exportDto = { format: 'json' };

      gdprService.requestDataExport.mockRejectedValue(
        new HttpException('Export request already pending', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .post('/gdpr/export')
        .set('Authorization', 'Bearer valid-token')
        .send(exportDto)
        .expect(409);
    });
  });

  describe('GET /gdpr/export', () => {
    it('should return user export requests', async () => {
      const exports = [mockExportRequest];
      gdprService.getUserExportRequests.mockResolvedValue(exports);

      const response = await request(app.getHttpServer())
        .get('/gdpr/export')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(exports);
    });
  });

  describe('GET /gdpr/export/:id', () => {
    it('should return export request by ID', async () => {
      gdprService.getExportRequest.mockResolvedValue(mockExportRequest);

      const response = await request(app.getHttpServer())
        .get('/gdpr/export/export-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockExportRequest);
      expect(gdprService.getExportRequest).toHaveBeenCalledWith(
        'export-123',
        mockUser.id,
        mockUser.tenantId,
      );
    });

    it('should return 404 when export not found', async () => {
      gdprService.getExportRequest.mockRejectedValue(
        new HttpException('Export request not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/gdpr/export/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('POST /gdpr/deletion', () => {
    it('should request data deletion successfully', async () => {
      const deletionDto = {
        reason: 'No longer need account',
        confirmEmail: 'test@example.com',
      };

      gdprService.requestDataDeletion.mockResolvedValue(mockDeletionRequest);

      const response = await request(app.getHttpServer())
        .post('/gdpr/deletion')
        .set('Authorization', 'Bearer valid-token')
        .send(deletionDto)
        .expect(201);

      expect(response.body).toEqual(mockDeletionRequest);
      expect(gdprService.requestDataDeletion).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.tenantId,
        deletionDto,
      );
    });

    it('should handle duplicate deletion request', async () => {
      const deletionDto = { reason: 'Test' };

      gdprService.requestDataDeletion.mockRejectedValue(
        new HttpException('Deletion request already pending', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .post('/gdpr/deletion')
        .set('Authorization', 'Bearer valid-token')
        .send(deletionDto)
        .expect(409);
    });
  });

  describe('GET /gdpr/deletion', () => {
    it('should return user deletion requests', async () => {
      const deletions = [mockDeletionRequest];
      gdprService.getUserDeletionRequests.mockResolvedValue(deletions);

      const response = await request(app.getHttpServer())
        .get('/gdpr/deletion')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(deletions);
    });
  });

  describe('GET /gdpr/deletion/:id', () => {
    it('should return deletion request by ID', async () => {
      gdprService.getDeletionRequest.mockResolvedValue(mockDeletionRequest);

      const response = await request(app.getHttpServer())
        .get('/gdpr/deletion/deletion-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockDeletionRequest);
    });

    it('should return 404 when deletion not found', async () => {
      gdprService.getDeletionRequest.mockRejectedValue(
        new HttpException('Deletion request not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/gdpr/deletion/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('GET /gdpr/admin/deletion/pending', () => {
    it('should return pending deletion requests for admin', async () => {
      const pendingDeletions = [mockDeletionRequest];
      gdprService.getPendingDeletionRequests.mockResolvedValue(pendingDeletions);

      const response = await request(app.getHttpServer())
        .get('/gdpr/admin/deletion/pending')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body).toEqual(pendingDeletions);
      expect(gdprService.getPendingDeletionRequests).toHaveBeenCalledWith(
        mockAdminUser.tenantId,
      );
    });

    it('should return 403 for non-admin users', async () => {
      await request(app.getHttpServer())
        .get('/gdpr/admin/deletion/pending')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);
    });
  });

  describe('GET /gdpr/admin/deletion/all', () => {
    it('should return all deletion requests for admin', async () => {
      const allDeletions = [mockDeletionRequest];
      gdprService.getAllDeletionRequests.mockResolvedValue(allDeletions);

      const response = await request(app.getHttpServer())
        .get('/gdpr/admin/deletion/all')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body).toEqual(allDeletions);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app.getHttpServer())
        .get('/gdpr/admin/deletion/all')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);
    });
  });

  describe('PATCH /gdpr/admin/deletion/:id/approve', () => {
    it('should approve deletion request successfully', async () => {
      const approveDto = {
        approved: true,
        notes: 'Approved by admin',
      };

      const approvedRequest = { ...mockDeletionRequest, status: DeletionStatus.APPROVED };
      gdprService.approveDeletionRequest.mockResolvedValue(approvedRequest);

      const response = await request(app.getHttpServer())
        .patch('/gdpr/admin/deletion/deletion-123/approve')
        .set('Authorization', 'Bearer admin-token')
        .send(approveDto)
        .expect(200);

      expect(response.body.status).toBe(DeletionStatus.APPROVED);
      expect(gdprService.approveDeletionRequest).toHaveBeenCalledWith(
        'deletion-123',
        mockAdminUser.id,
        approveDto,
      );
    });

    it('should reject deletion request successfully', async () => {
      const rejectDto = {
        approved: false,
        notes: 'Rejected - pending transactions',
      };

      const rejectedRequest = { ...mockDeletionRequest, status: DeletionStatus.REJECTED };
      gdprService.approveDeletionRequest.mockResolvedValue(rejectedRequest);

      const response = await request(app.getHttpServer())
        .patch('/gdpr/admin/deletion/deletion-123/approve')
        .set('Authorization', 'Bearer admin-token')
        .send(rejectDto)
        .expect(200);

      expect(response.body.status).toBe(DeletionStatus.REJECTED);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app.getHttpServer())
        .patch('/gdpr/admin/deletion/deletion-123/approve')
        .set('Authorization', 'Bearer valid-token')
        .send({ approved: true })
        .expect(403);
    });

    it('should return 404 when deletion request not found', async () => {
      gdprService.approveDeletionRequest.mockRejectedValue(
        new HttpException('Deletion request not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/gdpr/admin/deletion/non-existent/approve')
        .set('Authorization', 'Bearer admin-token')
        .send({ approved: true })
        .expect(404);
    });
  });
});
