import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';

export class TestHelper {
  private static app: INestApplication;
  private static authToken: string;
  private static tenantId: string;

  static async setupApp(): Promise<INestApplication> {
    if (!this.app) {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      this.app = moduleFixture.createNestApplication();
      await this.app.init();
    }
    return this.app;
  }

  static async closeApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
      this.app = null;
    }
  }

  static getApp(): INestApplication {
    return this.app;
  }

  static async login(
    email: string = 'admin@test.com',
    password: string = 'admin123',
  ): Promise<{ token: string; tenantId: string }> {
    const app = this.getApp();
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    this.authToken = response.body.token;
    this.tenantId = response.body.user.tenantId;

    return {
      token: this.authToken,
      tenantId: this.tenantId,
    };
  }

  static getAuthToken(): string {
    return this.authToken;
  }

  static getTenantId(): string {
    return this.tenantId;
  }

  static async authenticatedRequest(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
  ) {
    const app = this.getApp();
    return request(app.getHttpServer())
      [method](url)
      .set('Authorization', `Bearer ${this.authToken}`)
      .set('x-tenant-id', this.tenantId);
  }
}
