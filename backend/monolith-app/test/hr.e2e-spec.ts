import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('HRController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const registerResponse = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'hr-test@example.com',
      password: 'password123',
      firstName: 'HR',
      lastName: 'Test',
      tenantId: 'tenant-hr-123',
    });

    authToken = registerResponse.body.accessToken;
    tenantId = registerResponse.body.user.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/hr/employees (POST)', () => {
    it('should create a new employee', () => {
      return request(app.getHttpServer())
        .post('/hr/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com',
          phone: '1234567890',
          position: 'Software Engineer',
          department: 'Engineering',
          salary: 80000,
          hireDate: new Date().toISOString(),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('firstName', 'John');
          expect(res.body).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/hr/employees')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
        })
        .expect(401);
    });
  });

  describe('/hr/employees (GET)', () => {
    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/hr/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Employee',
          lastName: 'One',
          email: 'emp1@company.com',
          position: 'Manager',
        });
    });

    it('should get all employees', () => {
      return request(app.getHttpServer())
        .get('/hr/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body[0]).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should filter by department', () => {
      return request(app.getHttpServer())
        .get('/hr/employees?department=Engineering')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach(
            (emp: { department: string; id: string; firstName: string; lastName: string }) => {
              expect(emp.department).toBe('Engineering');
            },
          );
        });
    });
  });

  describe('/hr/attendance (POST)', () => {
    let employeeId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/hr/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Attendance',
          lastName: 'Test',
          email: 'attendance@company.com',
          position: 'Developer',
        });
      employeeId = response.body.id;
    });

    it('should record attendance', () => {
      return request(app.getHttpServer())
        .post('/hr/attendance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          employeeId,
          date: new Date().toISOString(),
          checkIn: '09:00:00',
          checkOut: '18:00:00',
          status: 'present',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('employeeId', employeeId);
          expect(res.body).toHaveProperty('tenantId', tenantId);
        });
    });
  });

  describe('/hr/leave-requests (POST)', () => {
    let employeeId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/hr/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Leave',
          lastName: 'Test',
          email: 'leave@company.com',
          position: 'Analyst',
        });
      employeeId = response.body.id;
    });

    it('should create leave request', () => {
      return request(app.getHttpServer())
        .post('/hr/leave-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          employeeId,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          type: 'vacation',
          reason: 'Family vacation',
          status: 'pending',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('status', 'pending');
          expect(res.body).toHaveProperty('tenantId', tenantId);
        });
    });
  });

  describe('Tenant Isolation', () => {
    let tenant1Token: string;
    let tenant2Token: string;
    let tenant1EmployeeId: string;

    beforeAll(async () => {
      const tenant1Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant1-hr@example.com',
        password: 'password123',
        firstName: 'Tenant1',
        lastName: 'HR',
        tenantId: 'tenant-hr-1',
      });
      tenant1Token = tenant1Response.body.accessToken;

      const tenant2Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant2-hr@example.com',
        password: 'password123',
        firstName: 'Tenant2',
        lastName: 'HR',
        tenantId: 'tenant-hr-2',
      });
      tenant2Token = tenant2Response.body.accessToken;

      const employeeResponse = await request(app.getHttpServer())
        .post('/hr/employees')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          firstName: 'Tenant1',
          lastName: 'Employee',
          email: 'tenant1-emp@company.com',
          position: 'Staff',
        });
      tenant1EmployeeId = employeeResponse.body.id;
    });

    it('tenant 2 should not see tenant 1 employees', async () => {
      const response = await request(app.getHttpServer())
        .get('/hr/employees')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      const tenant1Employees = response.body.filter(
        (e: { tenantId: string; id: string; firstName: string; lastName: string }) =>
          e.tenantId === 'tenant-hr-1',
      );
      expect(tenant1Employees.length).toBe(0);
    });

    it('tenant 2 should not access tenant 1 employee', () => {
      return request(app.getHttpServer())
        .get(`/hr/employees/${tenant1EmployeeId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);
    });
  });
});
