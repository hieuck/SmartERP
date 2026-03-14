import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Setting } from './entities/setting.entity';
import { CreateSettingDto, SettingCategory, SettingDataType } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { User } from '@common/security/permission.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let repository: jest.Mocked<Repository<Setting>>;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    email: 'test@example.com',
    roles: ['admin'],
  };

  const mockSetting: Setting = {
    id: 'setting-123',
    tenantId: 'tenant-123',
    key: 'app.name',
    value: 'My App',
    category: 'GENERAL',
    dataType: 'STRING',
    description: 'Application name',
    isPublic: true,
    createdA