/**
 * PayrollController Integration Tests
 * Coverage target: 90%+
 * 
 * Test cases:
 * 1. POST /payroll/salary-structures - Create salary structure
 * 2. GET /payroll/salary-structures/:id - Get salary structure
 * 3. GET /payroll/salary-structures/employee/:employeeId - Get by employee
 * 4. POST /payroll/payslips/generate - Generate payslip
 * 5. GET /payroll/payslips/:id - Get payslip
 * 6. GET /payroll/payslips/employee/:employeeId - Get payslips by employee
 * 7. GET /payroll/payslips/month/:year/:month - Get payslips by month
 * 8. PATCH /payroll/payslips/:id/submit - Submit payslip
 * 9. PATCH /payroll/payslips/:id/mark-paid - Mark as paid
 * 10. PATCH /payroll/payslips/:id/cancel - Cancel payslip
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { RolesGuard } from '@/common/guards/roles.guard';

describe('PayrollController (Integration)', () => {
  let app: INestApplication;
  let payrollService: jest.Mocked<PayrollService>;

  const mockHRUser = {
    id: 'hr-123',
    email: 'hr@example.com',
    tenantId: 'tenant-123',
    role: 'hr_manager',
  };

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    tenantId: 'tenant-123',
    role: 'admin',
  };

  const mockEmployeeUser = {
    id: 'employee-123',
    email: 'employee@example.com',
    tenantId: 'tenant-123',
    role: 'employee',
  };

  const mockSalaryStructure = {
    id: 'salary-123',
    employeeId: 'employee-123',
    baseSalary: 50000,
    allowances: { housing: 5000, transport: 2000 },
    deductions: { tax: 5000, insurance: 2000 },
    effectiveDate: new Date('2024-01-01'),
    tenantId: 'tenant-123',
  };

  const mockPayslip = {
    id: 'payslip-123',
    employeeId: 'employee-123',
    salaryStructureId: 'salary-123',
    month: 1,
    year: 2024,
    grossSalary: 57000,
    netSalary: 50000,
    status: 'draft',
    tenantId: 'tenant-123',
  };

  beforeAll(async () => {
    const mockPayrollService = {
      createSalaryStructure: jest.fn(),
      getSalaryStructure: jest.fn(),
      getSalaryStructuresByEmployee: jest.fn(),
      generatePayslip: jest.fn(),
      getPayslip: jest.fn(),
      getPayslipsByEmployee: jest.fn(),
      getPayslipsByMonth: jest.fn(),
      submitPayslip: jest.fn(),
      markAsPaid: jest.fn(),
      cancelPayslip: jest.fn(),
    };

    const mockRolesGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        
        if (!user) {
          throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
        
        const handler = context.getHandler();
        const handlerName = handler.name;
        
        // HR/Admin only endpoints
        const hrAdminEndpoints = [
          'createSalaryStructure',
          'generatePayslip',
          'submitPayslip',
          'markAsPaid',
          'cancelPayslip',
        ];
        
        if (hrAdminEndpoints.includes(handlerName)) {
          if (['hr_manager', 'admin'].includes(user.role)) {
            return true;
          }
          throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }
        
        return true;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PayrollController],
      providers: [
        {
          provide: PayrollService,
          useValue: mockPayrollService,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    // Mock request.user for all requests
    app.use((req, res, next) => {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.substring(7);
        if (token === 'hr-token') {
          req.user = mockHRUser;
        } else if (token === 'admin-token') {
          req.user = mockAdminUser;
        } else if (token === 'employee-token') {
          req.user = mockEmployeeUser;
        }
      }
      next();
    });
    
    await app.init();

    payrollService = moduleFixture.get(PayrollService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /payroll/salary-structures', () => {
    it('should create salary structure as HR manager', async () => {
      const createDto = {
        employeeId: 'employee-123',
        baseSalary: 50000,
        allowances: { housing: 5000, transport: 2000 },
        deductions: { tax: 5000, insurance: 2000 },
        effectiveDate: '2024-01-01',
      };

      payrollService.createSalaryStructure.mockResolvedValue(mockSalaryStructure);

      const response = await request(app.getHttpServer())
        .post('/payroll/salary-structures')
        .set('Authorization', 'Bearer hr-token')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(mockSalaryStructure);
      expect(payrollService.createSalaryStructure).toHaveBeenCalledWith(createDto, 'tenant-123');
    });

    it('should return 403 when user is not HR/admin', async () => {
      const createDto = {
        employeeId: 'employee-123',
        baseSalary: 50000,
      };

      await request(app.getHttpServer())
        .post('/payroll/salary-structures')
        .set('Authorization', 'Bearer employee-token')
        .send(createDto)
        .expect(403);

      expect(payrollService.createSalaryStructure).not.toHaveBeenCalled();
    });

    it('should return 400 with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/payroll/salary-structures')
        .set('Authorization', 'Bearer hr-token')
        .send({
          employeeId: 'employee-123',
        })
        .expect(400);
    });
  });

  describe('GET /payroll/salary-structures/:id', () => {
    it('should get salary structure by id', async () => {
      payrollService.getSalaryStructure.mockResolvedValue(mockSalaryStructure);

      const response = await request(app.getHttpServer())
        .get('/payroll/salary-structures/salary-123')
        .set('Authorization', 'Bearer hr-token')
        .expect(200);

      expect(response.body).toEqual(mockSalaryStructure);
      expect(payrollService.getSalaryStructure).toHaveBeenCalledWith('salary-123', 'tenant-123');
    });

    it('should return 404 when salary structure not found', async () => {
      payrollService.getSalaryStructure.mockRejectedValue(
        new HttpException('Salary structure not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/payroll/salary-structures/invalid-id')
        .set('Authorization', 'Bearer hr-token')
        .expect(404);
    });
  });

  describe('GET /payroll/salary-structures/employee/:employeeId', () => {
    it('should get salary structures by employee', async () => {
      const structures = [mockSalaryStructure];
      payrollService.getSalaryStructuresByEmployee.mockResolvedValue(structures);

      const response = await request(app.getHttpServer())
        .get('/payroll/salary-structures/employee/employee-123')
        .set('Authorization', 'Bearer hr-token')
        .expect(200);

      expect(response.body).toEqual(structures);
      expect(payrollService.getSalaryStructuresByEmployee).toHaveBeenCalledWith(
        'employee-123',
        'tenant-123',
      );
    });

    it('should return empty array when no structures found', async () => {
      payrollService.getSalaryStructuresByEmployee.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/payroll/salary-structures/employee/employee-123')
        .set('Authorization', 'Bearer hr-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('POST /payroll/payslips/generate', () => {
    it('should generate payslip as HR manager', async () => {
      const generateDto = {
        salaryStructureId: 'salary-123',
        month: 1,
        year: 2024,
      };

      payrollService.generatePayslip.mockResolvedValue(mockPayslip);

      const response = await request(app.getHttpServer())
        .post('/payroll/payslips/generate')
        .set('Authorization', 'Bearer hr-token')
        .send(generateDto)
        .expect(201);

      expect(response.body).toEqual(mockPayslip);
      expect(payrollService.generatePayslip).toHaveBeenCalledWith(
        'salary-123',
        1,
        2024,
        'tenant-123',
      );
    });

    it('should return 403 when user is not HR/admin', async () => {
      const generateDto = {
        salaryStructureId: 'salary-123',
        month: 1,
        year: 2024,
      };

      await request(app.getHttpServer())
        .post('/payroll/payslips/generate')
        .set('Authorization', 'Bearer employee-token')
        .send(generateDto)
        .expect(403);

      expect(payrollService.generatePayslip).not.toHaveBeenCalled();
    });

    it('should handle salary structure not found', async () => {
      const generateDto = {
        salaryStructureId: 'invalid-id',
        month: 1,
        year: 2024,
      };

      payrollService.generatePayslip.mockRejectedValue(
        new HttpException('Salary structure not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/payroll/payslips/generate')
        .set('Authorization', 'Bearer hr-token')
        .send(generateDto)
        .expect(404);
    });
  });

  describe('GET /payroll/payslips/:id', () => {
    it('should get payslip by id', async () => {
      payrollService.getPayslip.mockResolvedValue(mockPayslip);

      const response = await request(app.getHttpServer())
        .get('/payroll/payslips/payslip-123')
        .set('Authorization', 'Bearer employee-token')
        .expect(200);

      expect(response.body).toEqual(mockPayslip);
      expect(payrollService.getPayslip).toHaveBeenCalledWith('payslip-123', 'tenant-123');
    });

    it('should return 404 when payslip not found', async () => {
      payrollService.getPayslip.mockRejectedValue(
        new HttpException('Payslip not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/payroll/payslips/invalid-id')
        .set('Authorization', 'Bearer employee-token')
        .expect(404);
    });
  });

  describe('GET /payroll/payslips/employee/:employeeId', () => {
    it('should get payslips by employee', async () => {
      const payslips = [mockPayslip];
      payrollService.getPayslipsByEmployee.mockResolvedValue(payslips);

      const response = await request(app.getHttpServer())
        .get('/payroll/payslips/employee/employee-123')
        .set('Authorization', 'Bearer employee-token')
        .expect(200);

      expect(response.body).toEqual(payslips);
      expect(payrollService.getPayslipsByEmployee).toHaveBeenCalledWith(
        'employee-123',
        'tenant-123',
      );
    });
  });

  describe('GET /payroll/payslips/month/:year/:month', () => {
    it('should get payslips by month', async () => {
      const payslips = [mockPayslip];
      payrollService.getPayslipsByMonth.mockResolvedValue(payslips);

      const response = await request(app.getHttpServer())
        .get('/payroll/payslips/month/2024/1')
        .set('Authorization', 'Bearer hr-token')
        .expect(200);

      expect(response.body).toEqual(payslips);
      expect(payrollService.getPayslipsByMonth).toHaveBeenCalledWith(1, 2024, 'tenant-123');
    });

    it('should return empty array when no payslips found', async () => {
      payrollService.getPayslipsByMonth.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/payroll/payslips/month/2024/12')
        .set('Authorization', 'Bearer hr-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('PATCH /payroll/payslips/:id/submit', () => {
    it('should submit payslip as HR manager', async () => {
      const submitted = {
        ...mockPayslip,
        status: 'submitted',
      };

      payrollService.submitPayslip.mockResolvedValue(submitted);

      const response = await request(app.getHttpServer())
        .patch('/payroll/payslips/payslip-123/submit')
        .set('Authorization', 'Bearer hr-token')
        .expect(200);

      expect(response.body).toEqual(submitted);
      expect(payrollService.submitPayslip).toHaveBeenCalledWith('payslip-123', 'tenant-123');
    });

    it('should return 403 when user is not HR/admin', async () => {
      await request(app.getHttpServer())
        .patch('/payroll/payslips/payslip-123/submit')
        .set('Authorization', 'Bearer employee-token')
        .expect(403);

      expect(payrollService.submitPayslip).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /payroll/payslips/:id/mark-paid', () => {
    it('should mark payslip as paid', async () => {
      const markPaidDto = {
        paymentDate: '2024-01-31',
      };

      const paid = {
        ...mockPayslip,
        status: 'paid',
        paymentDate: new Date('2024-01-31'),
      };

      payrollService.markAsPaid.mockResolvedValue(paid);

      const response = await request(app.getHttpServer())
        .patch('/payroll/payslips/payslip-123/mark-paid')
        .set('Authorization', 'Bearer hr-token')
        .send(markPaidDto)
        .expect(200);

      expect(response.body).toEqual(paid);
      expect(payrollService.markAsPaid).toHaveBeenCalledWith(
        'payslip-123',
        '2024-01-31',
        'tenant-123',
      );
    });

    it('should return 403 when user is not HR/admin', async () => {
      await request(app.getHttpServer())
        .patch('/payroll/payslips/payslip-123/mark-paid')
        .set('Authorization', 'Bearer employee-token')
        .send({ paymentDate: '2024-01-31' })
        .expect(403);

      expect(payrollService.markAsPaid).not.toHaveBeenCalled();
    });

    it('should return 400 with missing payment date', async () => {
      await request(app.getHttpServer())
        .patch('/payroll/payslips/payslip-123/mark-paid')
        .set('Authorization', 'Bearer hr-token')
        .send({})
        .expect(400);
    });
  });

  describe('PATCH /payroll/payslips/:id/cancel', () => {
    it('should cancel payslip', async () => {
      const cancelled = {
        ...mockPayslip,
        status: 'cancelled',
      };

      payrollService.cancelPayslip.mockResolvedValue(cancelled);

      const response = await request(app.getHttpServer())
        .patch('/payroll/payslips/payslip-123/cancel')
        .set('Authorization', 'Bearer hr-token')
        .expect(200);

      expect(response.body).toEqual(cancelled);
      expect(payrollService.cancelPayslip).toHaveBeenCalledWith('payslip-123', 'tenant-123');
    });

    it('should return 403 when user is not HR/admin', async () => {
      await request(app.getHttpServer())
        .patch('/payroll/payslips/payslip-123/cancel')
        .set('Authorization', 'Bearer employee-token')
        .expect(403);

      expect(payrollService.cancelPayslip).not.toHaveBeenCalled();
    });

    it('should handle already paid payslip', async () => {
      payrollService.cancelPayslip.mockRejectedValue(
        new HttpException('Cannot cancel paid payslip', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/payroll/payslips/payslip-123/cancel')
        .set('Authorization', 'Bearer hr-token')
        .expect(400);
    });
  });
});
