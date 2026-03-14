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
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

describe('SettingsController (Integration)', () => {
  let app: INestApplication;
  let settingsService: jest.Mocked<SettingsService>;

  const mockAdminUser = {
    id: 'user-123',
    userId: 'user-123',
    tenantId: 'tenant-123',
    email: 'admin@example.com',
    role: 'admin',
    roles: ['admin'],
  };

  const mockManagerUser = {
    id: 'user-456',
    userId: 'user-456',
    tenantId: 'tenant-123',
    email: 'manager@example.com',
    role: 'manager',
    roles: ['manager'],
  };

  const mockSetting = {
    id: 'setting-123',
    key: 'app.name',
    value: 'SmartERP',
    category: 'general',
    description: 'Application name',
    isPublic: true,
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
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
