import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Payroll Module (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let tenantId: string;
  let employeeId: string;
  let payrollId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'payroll-test@test.com',
      password: 'password123',
      tenantName: 'Payroll Test Tenant',
    });

    authToken = registerRes.body.access_token;
    tenantId = registerRes.body.user.tenantId;

    // Create employee first
    const empRes = await request(app.getHttpServer())
      .post('/hr/employees')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        position: 'Developer',
        salary: 5000,
      });

    employeeId = empRes.body.id;
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM payrolls WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM employees WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await app.close();
  });

  describe('POST /payroll', () => {
    it('should create payroll', async () => {
      const response = await request(app.getHttpServer())
        .post('/payroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          employeeId,
          month: '2026-02',
          basicSalary: 5000,
          allowances: 500,
          deductions: 200,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.employeeId).toBe(employeeId);
      expect(response.body.netSalary).toBe(5300);
      payrollId = response.body.id;
    });
  });

  describe('GET /payroll', () => {
    it('should get all payrolls', async () => {
      const response = await request(app.getHttpServer())
        .get('/payroll')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /payroll/:id', () => {
    it('should get payroll by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/payroll/${payrollId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(payrollId);
    });
  });

  describe('POST /payroll/:id/approve', () => {
    it('should approve payroll', async () => {
      const response = await request(app.getHttpServer())
        .post(`/payroll/${payrollId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('approved');
    });
  });

  describe('Tenant Isolation', () => {
    it('should not access other tenant payrolls', async () => {
      const tenant2Res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'payroll-tenant2@test.com',
        password: 'password123',
        tenantName: 'Payroll Tenant 2',
      });

      const tenant2Token = tenant2Res.body.access_token;
      const tenant2Id = tenant2Res.body.user.tenantId;

      await request(app.getHttpServer())
        .get(`/payroll/${payrollId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);

      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenant2Id]);
    });
  });
});
