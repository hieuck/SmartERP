/**
 * ReportController Integration Tests
 * Coverage target: 95%+
 *
 * Test cases:
 * 1. POST /reports - Create report
 * 2. GET /reports - Get all reports
 * 3. GET /reports/public - Get public reports
 * 4. GET /reports/:id - Get report by ID
 * 5. PATCH /reports/:id - Update report
 * 6. DELETE /reports/:id - Delete report
 * 7. POST /reports/:id/columns - Add column
 * 8. DELETE /reports/:id/columns/:columnId - Remove column
 * 9. POST /reports/:id/execute - Execute report
 * 10. GET /reports/:id/executions - Get execution history
 * 11. GET /reports/executions/:executionId - Get execution by ID
 * 12. GET /reports/templates - Get templates
 * 13. GET /reports/templates/categories - Get categories
 * 14. GET /reports/templates/category/:category - Get templates by category
 * 15. POST /reports/templates/:templateName/create - Create from template
 * 16. Authentication/Authorization tests
 * 17. Edge cases and error scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportTemplateService } from './report-template.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReportType, AggregationType } from '../enums/platform.enum';
import { ExecutionStatus } from './enums/execution-status.enum';

describe('ReportController (Integration)', () => {
  let app: INestApplication;
  let reportService: jest.Mocked<ReportService>;
  let templateService: jest.Mocked<ReportTemplateService>;

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    tenantId: 'tenant-123',
    roles: ['user'],
  };

  const mockManager = {
    id: 'manager-123',
    email: 'manager@example.com',
    tenantId: 'tenant-123',
    roles: ['manager'],
  };

  const mockReport = {
    id: 'report-123',
    name: 'Sales Report',
    description: 'Monthly sales report',
    type: ReportType.TABLE,
    sourceEntity: 'Order',
    isPublic: false,
    isActive: true,
    tenantId: 'tenant-123',
    createdBy: 'manager-123',
    filters: [],
    groupBy: [],
    orderBy: { field: 'createdAt', order: 'DESC' },
    version: 1,
    syncStatus: 'synced',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  };

  const mockColumn = {
    id: 'column-123',
    reportId: 'report-123',
    fieldName: 'totalAmount',
    displayName: 'Total Amount',
    dataType: 'number',
    aggregation: AggregationType.SUM,
    isVisible: true,
    sortOrder: 1,
    tenantId: 'tenant-123',
    version: 1,
    syncStatus: 'synced',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockExecution = {
    id: 'execution-123',
    reportId: 'report-123',
    status: ExecutionStatus.COMPLETED,
    parameters: {},
    result: [{ totalAmount: 1000000 }],
    rowCount: 1,
    executionTime: 150,
    executedBy: 'user-123',
    executedAt: new Date('2024-01-15T10:05:00Z'),
    tenantId: 'tenant-123',
    version: 1,
    syncStatus: 'synced',
    createdAt: new Date('2024-01-15T10:05:00Z'),
    updatedAt: new Date('2024-01-15T10:05:00Z'),
  };

  beforeAll(async () => {
    const mockReportService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findPublic: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      addColumn: jest.fn(),
      removeColumn: jest.fn(),
      execute: jest.fn(),
      getExecutionHistory: jest.fn(),
      getExecution: jest.fn(),
    };

    const mockTemplateService = {
      getStandardTemplates: jest.fn(),
      getCategories: jest.fn(),
      getTemplatesByCategory: jest.fn(),
      createFromTemplate: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          if (token === 'manager-token') {
            request.user = mockManager;
          } else {
            request.user = mockUser;
          }
          return true;
        }

        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const mockRolesGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        {
          provide: ReportService,
          useValue: mockReportService,
        },
        {
          provide: ReportTemplateService,
          useValue: mockTemplateService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    reportService = moduleFixture.get(ReportService);
    templateService = moduleFixture.get(ReportTemplateService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /reports', () => {
    it('should create report successfully', async () => {
      const createDto = {
        name: 'New Report',
        description: 'Test report',
        type: ReportType.TABLE,
        sourceEntity: 'Order',
      };

      reportService.create.mockResolvedValue(mockReport as any);

      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', 'Bearer manager-token')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockReport);
      expect(reportService.create).toHaveBeenCalledWith(createDto, 'tenant-123', mockManager);
    });

    it('should create public report', async () => {
      const createDto = {
        name: 'Public Report',
        description: 'Public report',
        type: ReportType.TABLE,
        sourceEntity: 'Order',
        isPublic: true,
      };

      const publicReport = { ...mockReport, isPublic: true };
      reportService.create.mockResolvedValue(publicReport as any);

      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', 'Bearer manager-token')
        .send(createDto)
        .expect(201);

      expect(response.body.isPublic).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/reports')
        .send({ name: 'Test', type: ReportType.TABLE, sourceEntity: 'Order' })
        .expect(401);
    });
  });

  describe('GET /reports', () => {
    it('should return all reports for tenant', async () => {
      const reports = [mockReport];
      reportService.findAll.mockResolvedValue(reports as any);

      const response = await request(app.getHttpServer())
        .get('/reports')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(reports);
      expect(reportService.findAll).toHaveBeenCalledWith('tenant-123');
    });

    it('should return empty array when no reports', async () => {
      reportService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/reports')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/reports').expect(401);
    });
  });

  describe('GET /reports/public', () => {
    it('should return public reports', async () => {
      const publicReports = [{ ...mockReport, isPublic: true }];
      reportService.findPublic.mockResolvedValue(publicReports as any);

      const response = await request(app.getHttpServer())
        .get('/reports/public')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(publicReports);
      expect(reportService.findPublic).toHaveBeenCalledWith('tenant-123');
    });

    it('should return empty array when no public reports', async () => {
      reportService.findPublic.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/reports/public')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/reports/public').expect(401);
    });
  });

  describe('GET /reports/:id', () => {
    it('should return report by ID', async () => {
      reportService.findOne.mockResolvedValue(mockReport as any);

      const response = await request(app.getHttpServer())
        .get('/reports/report-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockReport);
      expect(reportService.findOne).toHaveBeenCalledWith('report-123', 'tenant-123');
    });

    it('should return 404 when report not found', async () => {
      reportService.findOne.mockRejectedValue(
        new HttpException('Report not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/reports/report-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/reports/report-123').expect(401);
    });
  });

  describe('PATCH /reports/:id', () => {
    it('should update report successfully', async () => {
      const updateDto = {
        name: 'Updated Report',
        description: 'Updated description',
      };

      const updatedReport = { ...mockReport, ...updateDto };
      reportService.update.mockResolvedValue(updatedReport as any);

      const response = await request(app.getHttpServer())
        .patch('/reports/report-123')
        .set('Authorization', 'Bearer manager-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe('Updated Report');
      expect(reportService.update).toHaveBeenCalledWith(
        'report-123',
        updateDto,
        'tenant-123',
        mockManager,
      );
    });

    it('should return 404 when report not found', async () => {
      reportService.update.mockRejectedValue(
        new HttpException('Report not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/reports/report-999')
        .set('Authorization', 'Bearer manager-token')
        .send({ name: 'Test' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .patch('/reports/report-123')
        .send({ name: 'Test' })
        .expect(401);
    });
  });

  describe('DELETE /reports/:id', () => {
    it('should delete report successfully', async () => {
      reportService.remove.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/reports/report-123')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body.message).toBe('Report deleted successfully');
      expect(reportService.remove).toHaveBeenCalledWith('report-123', 'tenant-123', mockManager);
    });

    it('should return 404 when report not found', async () => {
      reportService.remove.mockRejectedValue(
        new HttpException('Report not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/reports/report-999')
        .set('Authorization', 'Bearer manager-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).delete('/reports/report-123').expect(401);
    });
  });

  describe('POST /reports/:id/columns', () => {
    it('should add column to report', async () => {
      const columnDto = {
        fieldName: 'totalAmount',
        displayName: 'Total Amount',
        dataType: 'number',
        aggregation: AggregationType.SUM,
      };

      reportService.addColumn.mockResolvedValue(mockColumn as any);

      const response = await request(app.getHttpServer())
        .post('/reports/report-123/columns')
        .set('Authorization', 'Bearer manager-token')
        .send(columnDto)
        .expect(201);

      expect(response.body).toEqual(mockColumn);
      expect(reportService.addColumn).toHaveBeenCalledWith(
        'report-123',
        columnDto,
        'tenant-123',
        mockManager,
      );
    });

    it('should add column with different aggregations', async () => {
      const aggregations = [
        AggregationType.SUM,
        AggregationType.AVG,
        AggregationType.COUNT,
        AggregationType.MIN,
        AggregationType.MAX,
      ];

      for (const aggregation of aggregations) {
        reportService.addColumn.mockResolvedValue({ ...mockColumn, aggregation } as any);

        await request(app.getHttpServer())
          .post('/reports/report-123/columns')
          .set('Authorization', 'Bearer manager-token')
          .send({
            fieldName: 'amount',
            displayName: 'Amount',
            dataType: 'number',
            aggregation,
          })
          .expect(201);
      }
    });

    it('should return 404 when report not found', async () => {
      reportService.addColumn.mockRejectedValue(
        new HttpException('Report not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/reports/report-999/columns')
        .set('Authorization', 'Bearer manager-token')
        .send({ fieldName: 'test', displayName: 'Test', dataType: 'string' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/reports/report-123/columns')
        .send({ fieldName: 'test', displayName: 'Test', dataType: 'string' })
        .expect(401);
    });
  });

  describe('DELETE /reports/:id/columns/:columnId', () => {
    it('should remove column from report', async () => {
      reportService.removeColumn.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/reports/report-123/columns/column-123')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body.message).toBe('Column removed successfully');
      expect(reportService.removeColumn).toHaveBeenCalledWith(
        'report-123',
        'column-123',
        'tenant-123',
        mockManager,
      );
    });

    it('should return 404 when column not found', async () => {
      reportService.removeColumn.mockRejectedValue(
        new HttpException('Column not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/reports/report-123/columns/column-999')
        .set('Authorization', 'Bearer manager-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete('/reports/report-123/columns/column-123')
        .expect(401);
    });
  });

  describe('POST /reports/:id/execute', () => {
    it('should execute report successfully', async () => {
      const executeDto = {
        parameters: { startDate: '2024-01-01', endDate: '2024-01-31' },
      };

      reportService.execute.mockResolvedValue(mockExecution as any);

      const response = await request(app.getHttpServer())
        .post('/reports/report-123/execute')
        .set('Authorization', 'Bearer valid-token')
        .send(executeDto)
        .expect(200);

      expect(response.body).toEqual(mockExecution);
      expect(reportService.execute).toHaveBeenCalledWith(
        'report-123',
        executeDto.parameters,
        'tenant-123',
        mockUser,
      );
    });

    it('should execute report without parameters', async () => {
      const executeDto = { parameters: {} };

      reportService.execute.mockResolvedValue(mockExecution as any);

      await request(app.getHttpServer())
        .post('/reports/report-123/execute')
        .set('Authorization', 'Bearer valid-token')
        .send(executeDto)
        .expect(200);
    });

    it('should handle failed execution', async () => {
      const failedExecution = {
        ...mockExecution,
        status: ExecutionStatus.FAILED,
        errorMessage: 'Query execution failed',
      };

      reportService.execute.mockResolvedValue(failedExecution as any);

      const response = await request(app.getHttpServer())
        .post('/reports/report-123/execute')
        .set('Authorization', 'Bearer valid-token')
        .send({ parameters: {} })
        .expect(200);

      expect(response.body.status).toBe(ExecutionStatus.FAILED);
      expect(response.body.errorMessage).toBeDefined();
    });

    it('should return 404 when report not found', async () => {
      reportService.execute.mockRejectedValue(
        new HttpException('Report not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/reports/report-999/execute')
        .set('Authorization', 'Bearer valid-token')
        .send({ parameters: {} })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/reports/report-123/execute')
        .send({ parameters: {} })
        .expect(401);
    });
  });

  describe('GET /reports/:id/executions', () => {
    it('should return execution history', async () => {
      const executions = [mockExecution];
      reportService.getExecutionHistory.mockResolvedValue(executions as any);

      const response = await request(app.getHttpServer())
        .get('/reports/report-123/executions')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body).toEqual(executions);
      expect(reportService.getExecutionHistory).toHaveBeenCalledWith(
        'report-123',
        'tenant-123',
        10,
      );
    });

    it('should return execution history with custom limit', async () => {
      const executions = [mockExecution];
      reportService.getExecutionHistory.mockResolvedValue(executions as any);

      await request(app.getHttpServer())
        .get('/reports/report-123/executions?limit=20')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(reportService.getExecutionHistory).toHaveBeenCalledWith(
        'report-123',
        'tenant-123',
        20,
      );
    });

    it('should return empty array when no executions', async () => {
      reportService.getExecutionHistory.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/reports/report-123/executions')
        .set('Authorization', 'Bearer manager-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/reports/report-123/executions').expect(401);
    });
  });

  describe('GET /reports/executions/:executionId', () => {
    it('should return execution by ID', async () => {
      reportService.getExecution.mockResolvedValue(mockExecution as any);

      const response = await request(app.getHttpServer())
        .get('/reports/executions/execution-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockExecution);
      expect(reportService.getExecution).toHaveBeenCalledWith('execution-123', 'tenant-123');
    });

    it('should return 404 when execution not found', async () => {
      reportService.getExecution.mockRejectedValue(
        new HttpException('Execution not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/reports/executions/execution-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/reports/executions/execution-123').expect(401);
    });
  });

  describe('GET /reports/templates', () => {
    it('should return all standard templates', async () => {
      const templates = [
        { name: 'sales-summary', category: 'sales', description: 'Sales summary report' },
        { name: 'inventory-status', category: 'inventory', description: 'Inventory status' },
      ];

      (templateService.getStandardTemplates as jest.Mock).mockResolvedValue(templates);

      const response = await request(app.getHttpServer())
        .get('/reports/templates')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(templates);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/reports/templates').expect(401);
    });
  });

  describe('GET /reports/templates/categories', () => {
    it('should return all categories', async () => {
      const categories = ['sales', 'inventory', 'accounting', 'hr'];

      (templateService.getCategories as jest.Mock).mockResolvedValue(categories);

      const response = await request(app.getHttpServer())
        .get('/reports/templates/categories')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(categories);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/reports/templates/categories').expect(401);
    });
  });

  describe('GET /reports/templates/category/:category', () => {
    it('should return templates by category', async () => {
      const templates = [
        { name: 'sales-summary', category: 'sales', description: 'Sales summary' },
        { name: 'sales-by-product', category: 'sales', description: 'Sales by product' },
      ];

      (templateService.getTemplatesByCategory as jest.Mock).mockResolvedValue(templates);

      const response = await request(app.getHttpServer())
        .get('/reports/templates/category/sales')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(templates);
      expect(templateService.getTemplatesByCategory).toHaveBeenCalledWith('sales');
    });

    it('should return empty array for unknown category', async () => {
      (templateService.getTemplatesByCategory as jest.Mock).mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/reports/templates/category/unknown')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/reports/templates/category/sales').expect(401);
    });
  });

  describe('POST /reports/templates/:templateName/create', () => {
    it('should create report from template', async () => {
      templateService.createFromTemplate.mockResolvedValue(mockReport as any);

      const response = await request(app.getHttpServer())
        .post('/reports/templates/sales-summary/create')
        .set('Authorization', 'Bearer manager-token')
        .expect(201);

      expect(response.body).toEqual(mockReport);
      expect(templateService.createFromTemplate).toHaveBeenCalledWith(
        'sales-summary',
        'tenant-123',
        mockManager,
      );
    });

    it('should return 404 when template not found', async () => {
      templateService.createFromTemplate.mockRejectedValue(
        new HttpException('Template not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/reports/templates/unknown-template/create')
        .set('Authorization', 'Bearer manager-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/reports/templates/sales-summary/create')
        .expect(401);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent report execution', async () => {
      reportService.execute.mockResolvedValue(mockExecution as any);

      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/reports/report-123/execute')
            .set('Authorization', 'Bearer valid-token')
            .send({ parameters: {} }),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle very long report names', async () => {
      const longName = 'a'.repeat(500);
      reportService.create.mockResolvedValue({ ...mockReport, name: longName } as any);

      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', 'Bearer manager-token')
        .send({
          name: longName,
          type: ReportType.TABLE,
          sourceEntity: 'Order',
        })
        .expect(201);
    });

    it('should handle complex filter conditions', async () => {
      const complexFilters = [
        { field: 'status', operator: '=', value: 'completed' },
        { field: 'totalAmount', operator: '>', value: 1000000 },
        { field: 'createdAt', operator: '>=', value: '2024-01-01' },
      ];

      reportService.create.mockResolvedValue({
        ...mockReport,
        filters: complexFilters,
      } as any);

      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', 'Bearer manager-token')
        .send({
          name: 'Complex Report',
          type: ReportType.TABLE,
          sourceEntity: 'Order',
          filters: complexFilters,
        })
        .expect(201);
    });

    it('should handle large execution results', async () => {
      const largeResult = Array(1000)
        .fill(null)
        .map((_, i) => ({ id: i, amount: i * 1000 }));

      const largeExecution = {
        ...mockExecution,
        result: largeResult,
        rowCount: 1000,
      };

      reportService.execute.mockResolvedValue(largeExecution as any);

      const response = await request(app.getHttpServer())
        .post('/reports/report-123/execute')
        .set('Authorization', 'Bearer valid-token')
        .send({ parameters: {} })
        .expect(200);

      expect(response.body.rowCount).toBe(1000);
    });

    it('should handle multiple groupBy fields', async () => {
      const groupByFields = ['category', 'status', 'region'];

      reportService.create.mockResolvedValue({
        ...mockReport,
        groupBy: groupByFields,
      } as any);

      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', 'Bearer manager-token')
        .send({
          name: 'Grouped Report',
          type: ReportType.TABLE,
          sourceEntity: 'Order',
          groupBy: groupByFields,
        })
        .expect(201);
    });

    it('should handle SQL injection attempts in parameters', async () => {
      const maliciousParams = {
        status: "'; DROP TABLE orders; --",
        amount: '1 OR 1=1',
      };

      reportService.execute.mockRejectedValue(
        new HttpException('Invalid parameters', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/reports/report-123/execute')
        .set('Authorization', 'Bearer valid-token')
        .send({ parameters: maliciousParams })
        .expect(400);
    });

    it('should handle timeout on long-running reports', async () => {
      const timeoutExecution = {
        ...mockExecution,
        status: ExecutionStatus.FAILED,
        errorMessage: 'Query execution timeout',
        executionTime: 30000,
      };

      reportService.execute.mockResolvedValue(timeoutExecution as any);

      const response = await request(app.getHttpServer())
        .post('/reports/report-123/execute')
        .set('Authorization', 'Bearer valid-token')
        .send({ parameters: {} })
        .expect(200);

      expect(response.body.status).toBe(ExecutionStatus.FAILED);
    });
  });
});
