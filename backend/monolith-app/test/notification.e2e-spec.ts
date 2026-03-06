import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Notification Module (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let tenantId: string;
  let userId: string;
  let notificationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'notification-test@test.com',
      password: 'password123',
      tenantName: 'Notification Test Tenant',
    });

    authToken = registerRes.body.access_token;
    tenantId = registerRes.body.user.tenantId;
    userId = registerRes.body.user.id;
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM notifications WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await app.close();
  });

  describe('POST /notifications', () => {
    it('should create a new notification', async () => {
      const response = await request(app.getHttpServer())
        .post('/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId,
          title: 'Test Notification',
          message: 'This is a test notification',
          type: 'info',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Notification');
      expect(response.body.tenantId).toBe(tenantId);
      notificationId = response.body.id;
    });
  });

  describe('GET /notifications', () => {
    it('should get all notifications for user', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter unread notifications', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications?read=false')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((notif) => {
        expect(notif.read).toBe(false);
      });
    });
  });

  describe('GET /notifications/:id', () => {
    it('should get notification by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(notificationId);
      expect(response.body.title).toBe('Test Notification');
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.read).toBe(true);
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('should delete notification', async () => {
      await request(app.getHttpServer())
        .delete(`/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Tenant Isolation', () => {
    it('should not access other tenant notifications', async () => {
      const tenant2Res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'notification-tenant2@test.com',
        password: 'password123',
        tenantName: 'Notification Tenant 2',
      });

      const tenant2Token = tenant2Res.body.access_token;
      const tenant2Id = tenant2Res.body.user.tenantId;
      const user2Id = tenant2Res.body.user.id;

      const notif2Res = await request(app.getHttpServer())
        .post('/notifications')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          userId: user2Id,
          title: 'Tenant 2 Notification',
          message: 'Test',
        });

      const notif2Id = notif2Res.body.id;

      await request(app.getHttpServer())
        .get(`/notifications/${notif2Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      await dataSource.query('DELETE FROM notifications WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM users WHERE tenant_id = $1', [tenant2Id]);
      await dataSource.query('DELETE FROM tenants WHERE id = $1', [tenant2Id]);
    });
  });
});
