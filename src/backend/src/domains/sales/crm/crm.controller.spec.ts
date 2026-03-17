/**
 * CrmController Integration Tests
 * Coverage target: 95%+
 *
 * Test cases:
 * 1. Lead Endpoints (GET, POST, PUT, DELETE, convert)
 * 2. Opportunity Endpoints (GET, POST, PUT, DELETE)
 * 3. Pipeline Endpoint
 * 4. Authentication/Authorization tests
 * 5. Validation tests
 * 6. Edge cases and error scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { SyncStatus } from '../../../common/enums/sync-status.enum';

describe('CrmController (Integration)', () => {
  let app: INestApplication;
  let crmService: jest.Mocked<CrmService>;

  const mockUser = {
    id: 'user-123',
    email: 'sales@example.com',
    tenantId: 'tenant-123',
    roles: ['sales'],
  };

  const mockLead = {
    id: 'lead-123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+84901234567',
    company: 'ABC Corp',
    status: 'new',
    source: 'website',
    assignedTo: 'user-123',
    tenantId: 'tenant-123',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    version: 1,
    syncStatus: SyncStatus.SYNCED,
  };

  const mockOpportunity = {
    id: 'opp-123',
    name: 'Enterprise Deal',
    amount: 50000000,
    stage: 'proposal',
    probability: 60,
    expectedCloseDate: new Date('2024-03-31'),
    customerId: 'customer-123',
    assignedTo: 'user-123',
    tenantId: 'tenant-123',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    version: 1,
    syncStatus: SyncStatus.SYNCED,
  };

  beforeAll(async () => {
    const mockCrmService = {
      findAllLeads: jest.fn(),
      findLeadById: jest.fn(),
      createLead: jest.fn(),
      updateLead: jest.fn(),
      deleteLead: jest.fn(),
      convertLead: jest.fn(),
      findAllOpportunities: jest.fn(),
      findOpportunityById: jest.fn(),
      createOpportunity: jest.fn(),
      updateOpportunity: jest.fn(),
      deleteOpportunity: jest.fn(),
      getPipeline: jest.fn(),
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CrmController],
      providers: [
        {
          provide: CrmService,
          useValue: mockCrmService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    crmService = moduleFixture.get(CrmService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /crm/leads', () => {
    it('should return all leads', async () => {
      const leads = [mockLead];
      crmService.findAllLeads.mockResolvedValue(leads as any);

      const response = await request(app.getHttpServer())
        .get('/crm/leads')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(leads);
      expect(crmService.findAllLeads).toHaveBeenCalledWith(mockUser);
    });

    it('should return empty array when no leads', async () => {
      crmService.findAllLeads.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/crm/leads')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/crm/leads').expect(401);
    });
  });

  describe('GET /crm/leads/:id', () => {
    it('should return lead by ID', async () => {
      crmService.findLeadById.mockResolvedValue(mockLead as any);

      const response = await request(app.getHttpServer())
        .get('/crm/leads/lead-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockLead);
      expect(crmService.findLeadById).toHaveBeenCalledWith(mockUser, 'lead-123');
    });

    it('should return 404 when lead not found', async () => {
      crmService.findLeadById.mockRejectedValue(
        new HttpException('Lead not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/crm/leads/lead-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/crm/leads/lead-123').expect(401);
    });
  });

  describe('POST /crm/leads', () => {
    it('should create lead successfully', async () => {
      const createDto = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+84909876543',
        company: 'XYZ Ltd',
        source: 'referral',
      };

      crmService.createLead.mockResolvedValue({ ...mockLead, ...createDto } as any);

      const response = await request(app.getHttpServer())
        .post('/crm/leads')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe('Jane Smith');
      expect(crmService.createLead).toHaveBeenCalledWith(mockUser, createDto);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/crm/leads')
        .send({ name: 'Test', email: 'test@example.com' })
        .expect(401);
    });
  });

  describe('PUT /crm/leads/:id', () => {
    it('should update lead successfully', async () => {
      const updateDto = {
        status: 'qualified',
        notes: 'Follow up next week',
      };

      const updatedLead = { ...mockLead, ...updateDto };
      crmService.updateLead.mockResolvedValue(updatedLead as any);

      const response = await request(app.getHttpServer())
        .put('/crm/leads/lead-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.status).toBe('qualified');
      expect(crmService.updateLead).toHaveBeenCalledWith(mockUser, 'lead-123', updateDto);
    });

    it('should return 404 when lead not found', async () => {
      crmService.updateLead.mockRejectedValue(
        new HttpException('Lead not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .put('/crm/leads/lead-999')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: 'qualified' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put('/crm/leads/lead-123')
        .send({ status: 'qualified' })
        .expect(401);
    });
  });

  describe('DELETE /crm/leads/:id', () => {
    it('should delete lead successfully', async () => {
      crmService.deleteLead.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/crm/leads/lead-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(crmService.deleteLead).toHaveBeenCalledWith(mockUser, 'lead-123');
    });

    it('should return 404 when lead not found', async () => {
      crmService.deleteLead.mockRejectedValue(
        new HttpException('Lead not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/crm/leads/lead-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).delete('/crm/leads/lead-123').expect(401);
    });
  });

  describe('POST /crm/leads/:id/convert', () => {
    it('should convert lead to customer successfully', async () => {
      const convertedLead = { ...mockLead, status: 'converted', customerId: 'customer-456' };
      crmService.convertLead.mockResolvedValue(convertedLead as any);

      const response = await request(app.getHttpServer())
        .post('/crm/leads/lead-123/convert')
        .set('Authorization', 'Bearer valid-token')
        .send({ customerId: 'customer-456' })
        .expect(201);

      expect(response.body.status).toBe('converted');
      expect(crmService.convertLead).toHaveBeenCalledWith(mockUser, 'lead-123', 'customer-456');
    });

    it('should return 404 when lead not found', async () => {
      crmService.convertLead.mockRejectedValue(
        new HttpException('Lead not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/crm/leads/lead-999/convert')
        .set('Authorization', 'Bearer valid-token')
        .send({ customerId: 'customer-456' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/crm/leads/lead-123/convert')
        .send({ customerId: 'customer-456' })
        .expect(401);
    });
  });

  describe('GET /crm/opportunities', () => {
    it('should return all opportunities', async () => {
      const opportunities = [mockOpportunity];
      crmService.findAllOpportunities.mockResolvedValue(opportunities as any);

      const response = await request(app.getHttpServer())
        .get('/crm/opportunities')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(opportunities);
      expect(crmService.findAllOpportunities).toHaveBeenCalledWith(mockUser);
    });

    it('should return empty array when no opportunities', async () => {
      crmService.findAllOpportunities.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/crm/opportunities')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/crm/opportunities').expect(401);
    });
  });

  describe('GET /crm/opportunities/:id', () => {
    it('should return opportunity by ID', async () => {
      crmService.findOpportunityById.mockResolvedValue(mockOpportunity as any);

      const response = await request(app.getHttpServer())
        .get('/crm/opportunities/opp-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockOpportunity);
      expect(crmService.findOpportunityById).toHaveBeenCalledWith(mockUser, 'opp-123');
    });

    it('should return 404 when opportunity not found', async () => {
      crmService.findOpportunityById.mockRejectedValue(
        new HttpException('Opportunity not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/crm/opportunities/opp-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/crm/opportunities/opp-123').expect(401);
    });
  });

  describe('POST /crm/opportunities', () => {
    it('should create opportunity successfully', async () => {
      const createDto = {
        name: 'New Deal',
        amount: 30000000,
        stage: 'qualification',
        probability: 40,
        customerId: 'customer-789',
      };

      crmService.createOpportunity.mockResolvedValue({ ...mockOpportunity, ...createDto } as any);

      const response = await request(app.getHttpServer())
        .post('/crm/opportunities')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe('New Deal');
      expect(crmService.createOpportunity).toHaveBeenCalledWith(mockUser, createDto);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/crm/opportunities')
        .send({ name: 'Test', amount: 1000000 })
        .expect(401);
    });
  });

  describe('PUT /crm/opportunities/:id', () => {
    it('should update opportunity successfully', async () => {
      const updateDto = {
        stage: 'negotiation',
        probability: 80,
      };

      const updatedOpp = { ...mockOpportunity, ...updateDto };
      crmService.updateOpportunity.mockResolvedValue(updatedOpp as any);

      const response = await request(app.getHttpServer())
        .put('/crm/opportunities/opp-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.stage).toBe('negotiation');
      expect(crmService.updateOpportunity).toHaveBeenCalledWith(mockUser, 'opp-123', updateDto);
    });

    it('should return 404 when opportunity not found', async () => {
      crmService.updateOpportunity.mockRejectedValue(
        new HttpException('Opportunity not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .put('/crm/opportunities/opp-999')
        .set('Authorization', 'Bearer valid-token')
        .send({ stage: 'closed-won' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put('/crm/opportunities/opp-123')
        .send({ stage: 'negotiation' })
        .expect(401);
    });
  });

  describe('DELETE /crm/opportunities/:id', () => {
    it('should delete opportunity successfully', async () => {
      crmService.deleteOpportunity.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/crm/opportunities/opp-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(crmService.deleteOpportunity).toHaveBeenCalledWith(mockUser, 'opp-123');
    });

    it('should return 404 when opportunity not found', async () => {
      crmService.deleteOpportunity.mockRejectedValue(
        new HttpException('Opportunity not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/crm/opportunities/opp-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).delete('/crm/opportunities/opp-123').expect(401);
    });
  });

  describe('GET /crm/pipeline', () => {
    it('should return pipeline data', async () => {
      const pipeline = {
        pipeline: {
          prospecting: [],
          qualification: [mockOpportunity],
          proposal: [],
          negotiation: [],
          closedWon: [],
          closedLost: [],
        },
        summary: {
          prospecting: { count: 0, value: 0 },
          qualification: { count: 1, value: 50000000 },
          proposal: { count: 0, value: 0 },
          negotiation: { count: 0, value: 0 },
          closedWon: { count: 0, value: 0 },
          closedLost: { count: 0, value: 0 },
        },
      };

      crmService.getPipeline.mockResolvedValue(pipeline as any);

      const response = await request(app.getHttpServer())
        .get('/crm/pipeline')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(pipeline);
      expect(crmService.getPipeline).toHaveBeenCalledWith(mockUser);
    });

    it('should return empty pipeline when no data', async () => {
      const emptyPipeline = {
        pipeline: {
          prospecting: [],
          qualification: [],
          proposal: [],
          negotiation: [],
          closedWon: [],
          closedLost: [],
        },
        summary: {
          prospecting: { count: 0, value: 0 },
          qualification: { count: 0, value: 0 },
          proposal: { count: 0, value: 0 },
          negotiation: { count: 0, value: 0 },
          closedWon: { count: 0, value: 0 },
          closedLost: { count: 0, value: 0 },
        },
      };

      crmService.getPipeline.mockResolvedValue(emptyPipeline as any);

      const response = await request(app.getHttpServer())
        .get('/crm/pipeline')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.summary.qualification.count).toBe(0);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/crm/pipeline').expect(401);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests', async () => {
      crmService.findAllLeads.mockResolvedValue([mockLead] as any);

      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer()).get('/crm/leads').set('Authorization', 'Bearer valid-token'),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle service errors', async () => {
      crmService.findAllLeads.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/crm/leads')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });
});
