/**
 * SettingsController Integration Tests
 * Coverage target: 99%
 *
 * Test cases:
 * 1. POST /settings - Create setting (admin only)
 * 2. POST /settings/bulk - Bulk upsert settings (admin only)
 * 3. GET /settings - Get all settings (admin/manager)
 * 4. GET /settings - Filter by category
 * 5. GET /settings/public - Get public settings (all users)
 * 6. GET /settings/:key - Get setting by key (admin/manager)
 * 7. PATCH /settings/:key - Update setting (admin only)
 * 8. DELETE /settings/:key - Delete setting (admin only)
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SyncStatus } from '@/common/enums/sync-status.enum';

describe('SettingsController (Integration)', () => {
  let app: INestApplication;
  let settingsService: jest.Mocked<SettingsService>;

  const mockAdminUser = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const mockManagerUser = {
    id: 'user-456',
    tenantId: 'tenant-123',
    roles: ['manager'],
  };

  const mockSetting = {
    id: 'setting-123',
    key: 'app.name',
    value: 'SmartERP',
    category: 'general',
    dataType: 'STRING',
    description: 'Application name',
    isPublic: true,
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    syncStatus: SyncStatus.SYNCED,
  };

  beforeAll(async () => {
    const mockSettingsService = {
      create: jest.fn(),
      bulkUpsert: jest.fn(),
      findAll: jest.fn(),
      getPublicSettings: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        request.user = mockAdminUser;
        return true;
      }),
    };

    const mockRolesGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: mockSettingsService,
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

    settingsService = moduleFixture.get(SettingsService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /settings', () => {
    it('should create setting successfully', async () => {
      const createDto = {
        key: 'app.theme',
        value: 'dark',
        category: 'GENERAL',
        dataType: 'STRING',
        description: 'App theme',
        isPublic: true,
      };

      settingsService.create.mockResolvedValue({
        ...mockSetting,
        ...createDto,
      });

      const response = await request(app.getHttpServer())
        .post('/settings')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.key).toBe('app.theme');
      expect(settingsService.create).toHaveBeenCalledWith(mockAdminUser, createDto);
    });

    it('should return 409 when key already exists', async () => {
      const createDto = {
        key: 'app.name',
        value: 'New App',
        category: 'GENERAL',
        dataType: 'STRING',
      };

      settingsService.create.mockRejectedValue(
        new ConflictException("Setting with key 'app.name' already exists"),
      );

      await request(app.getHttpServer())
        .post('/settings')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(409);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/settings')
        .set('Authorization', 'Bearer valid-token')
        .send({ key: 'test' })
        .expect(400);
    });
  });

  describe('POST /settings/bulk', () => {
    it('should bulk upsert settings successfully', async () => {
      const bulkDto = {
        settings: [
          { key: 'setting1', value: 'value1', category: 'GENERAL', dataType: 'STRING' },
          { key: 'setting2', value: 'value2', category: 'GENERAL', dataType: 'STRING' },
        ],
      };

      settingsService.bulkUpsert.mockResolvedValue([
        { ...mockSetting, key: 'setting1', value: 'value1' },
        { ...mockSetting, key: 'setting2', value: 'value2' },
      ]);

      const response = await request(app.getHttpServer())
        .post('/settings/bulk')
        .set('Authorization', 'Bearer valid-token')
        .send(bulkDto)
        .expect(201);

      expect(response.body).toHaveLength(2);
      expect(settingsService.bulkUpsert).toHaveBeenCalledWith(mockAdminUser, bulkDto.settings);
    });
  });

  describe('GET /settings', () => {
    it('should return all settings', async () => {
      const settings = [mockSetting, { ...mockSetting, id: 'setting-456', key: 'app.theme' }];
      settingsService.findAll.mockResolvedValue(settings);

      const response = await request(app.getHttpServer())
        .get('/settings')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(settingsService.findAll).toHaveBeenCalledWith(mockAdminUser, undefined);
    });

    it('should filter by category', async () => {
      settingsService.findAll.mockResolvedValue([mockSetting]);

      await request(app.getHttpServer())
        .get('/settings?category=GENERAL')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(settingsService.findAll).toHaveBeenCalledWith(mockAdminUser, 'GENERAL');
    });
  });

  describe('GET /settings/public', () => {
    it('should return public settings', async () => {
      const publicSettings = [mockSetting];
      settingsService.getPublicSettings.mockResolvedValue(publicSettings);

      const response = await request(app.getHttpServer())
        .get('/settings/public')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(settingsService.getPublicSettings).toHaveBeenCalledWith(mockAdminUser);
    });
  });

  describe('GET /settings/:key', () => {
    it('should return setting by key', async () => {
      settingsService.findOne.mockResolvedValue(mockSetting);

      const response = await request(app.getHttpServer())
        .get('/settings/app.name')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.key).toBe('app.name');
      expect(settingsService.findOne).toHaveBeenCalledWith(mockAdminUser, 'app.name');
    });

    it('should return 404 when setting not found', async () => {
      settingsService.findOne.mockRejectedValue(
        new NotFoundException("Setting with key 'nonexistent' not found"),
      );

      await request(app.getHttpServer())
        .get('/settings/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('PATCH /settings/:key', () => {
    it('should update setting successfully', async () => {
      const updateDto = {
        value: 'Updated Value',
        description: 'Updated description',
      };

      settingsService.update.mockResolvedValue({
        ...mockSetting,
        ...updateDto,
      });

      const response = await request(app.getHttpServer())
        .patch('/settings/app.name')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.value).toBe('Updated Value');
      expect(settingsService.update).toHaveBeenCalledWith(mockAdminUser, 'app.name', updateDto);
    });

    it('should return 404 when setting not found', async () => {
      settingsService.update.mockRejectedValue(new NotFoundException('Setting not found'));

      await request(app.getHttpServer())
        .patch('/settings/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .send({ value: 'test' })
        .expect(404);
    });
  });

  describe('DELETE /settings/:key', () => {
    it('should delete setting successfully', async () => {
      settingsService.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/settings/app.name')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(settingsService.remove).toHaveBeenCalledWith(mockAdminUser, 'app.name');
    });

    it('should return 404 when setting not found', async () => {
      settingsService.remove.mockRejectedValue(new NotFoundException('Setting not found'));

      await request(app.getHttpServer())
        .delete('/settings/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('Authorization', () => {
    it('should require admin role for POST /settings', async () => {
      const mockRolesGuard = {
        canActivate: jest.fn().mockReturnValue(false),
      };

      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [SettingsController],
        providers: [
          {
            provide: SettingsService,
            useValue: settingsService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: jest.fn().mockReturnValue(true) })
        .overrideGuard(RolesGuard)
        .useValue(mockRolesGuard)
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      await request(testApp.getHttpServer())
        .post('/settings')
        .set('Authorization', 'Bearer valid-token')
        .send({ key: 'test', value: 'test', category: 'GENERAL', dataType: 'STRING' })
        .expect(403);

      await testApp.close();
    });

    it('should allow manager to GET /settings', async () => {
      const mockJwtAuthGuard = {
        canActivate: jest.fn().mockImplementation((context) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockManagerUser;
          return true;
        }),
      };

      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [SettingsController],
        providers: [
          {
            provide: SettingsService,
            useValue: settingsService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(mockJwtAuthGuard)
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: jest.fn().mockReturnValue(true) })
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      settingsService.findAll.mockResolvedValue([mockSetting]);

      await request(testApp.getHttpServer())
        .get('/settings')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      await testApp.close();
    });
  });
});
