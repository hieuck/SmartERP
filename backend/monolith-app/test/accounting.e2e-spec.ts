import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AccountingController (e2e)', () => {
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
      email: 'accounting-test@example.com',
      password: 'password123',
      firstName: 'Accounting',
      lastName: 'Test',
      tenantId: 'tenant-acc-123',
    });

    authToken = registerResponse.body.accessToken;
    tenantId = registerResponse.body.user.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/accounting/accounts (POST)', () => {
    it('should create a new account', () => {
      return request(app.getHttpServer())
        .post('/accounting/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: '1000',
          name: 'Cash',
          type: 'asset',
          balance: 10000.0,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('code', '1000');
          expect(res.body).toHaveProperty('name', 'Cash');
          expect(res.body).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/accounting/accounts')
        .send({
          code: '2000',
          name: 'Accounts Payable',
        })
        .expect(401);
    });
  });

  describe('/accounting/journal-entries (POST)', () => {
    let accountId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/accounting/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: '1100',
          name: 'Bank Account',
          type: 'asset',
        });
      accountId = response.body.id;
    });

    it('should create a journal entry', () => {
      return request(app.getHttpServer())
        .post('/accounting/journal-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: new Date().toISOString(),
          description: 'Test Entry',
          lines: [
            { accountId, debit: 1000, credit: 0 },
            { accountId, debit: 0, credit: 1000 },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('tenantId', tenantId);
        });
    });

    it('should validate balanced entry', () => {
      return request(app.getHttpServer())
        .post('/accounting/journal-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: new Date().toISOString(),
          description: 'Unbalanced Entry',
          lines: [
            { accountId, debit: 1000, credit: 0 },
            { accountId, debit: 0, credit: 500 }, // Unbalanced
          ],
        })
        .expect(400);
    });
  });

  describe('Tenant Isolation', () => {
    let tenant1Token: string;
    let tenant2Token: string;
    let tenant1AccountId: string;

    beforeAll(async () => {
      const tenant1Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant1-acc@example.com',
        password: 'password123',
        firstName: 'Tenant1',
        lastName: 'Acc',
        tenantId: 'tenant-acc-1',
      });
      tenant1Token = tenant1Response.body.accessToken;

      const tenant2Response = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tenant2-acc@example.com',
        password: 'password123',
        firstName: 'Tenant2',
        lastName: 'Acc',
        tenantId: 'tenant-acc-2',
      });
      tenant2Token = tenant2Response.body.accessToken;

      const accountResponse = await request(app.getHttpServer())
        .post('/accounting/accounts')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          code: '3000',
          name: 'Tenant 1 Account',
          type: 'asset',
        });
      tenant1AccountId = accountResponse.body.id;
    });

    it('tenant 2 should not see tenant 1 accounts', async () => {
      const response = await request(app.getHttpServer())
        .get('/accounting/accounts')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      const tenant1Accounts = response.body.filter(
        (a: { tenantId: string }) => a.tenantId === 'tenant-acc-1',
      );
      expect(tenant1Accounts.length).toBe(0);
    });

    it('tenant 2 should not access tenant 1 account', () => {
      return request(app.getHttpServer())
        .get(`/accounting/accounts/${tenant1AccountId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);
    });
  });
});
