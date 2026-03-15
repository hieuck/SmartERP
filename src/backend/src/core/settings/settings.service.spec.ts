/**
 * SettingsService Unit Tests
 * Coverage target: 99%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Setting } from './entities/setting.entity';
import { CreateSettingDto, SettingCategory, SettingDataType } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { User } from '@common/security/permission.service';
import { SyncStatus } from '@/common/enums/sync-status.enum';

describe('SettingsService', () => {
  let service: SettingsService;
  let repository: jest.Mocked<Repository<Setting>>;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
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
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: 'user-123',
    version: 1,
    syncStatus: SyncStatus.SYNCED,
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: getRepositoryToken(Setting),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    repository = module.get(getRepositoryToken(Setting));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create setting successfully', async () => {
      const createDto: CreateSettingDto = {
        key: 'app.theme',
        value: 'dark',
        category: SettingCategory.GENERAL,
        dataType: SettingDataType.STRING,
        description: 'App theme',
        isPublic: true,
      };

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue({ ...mockSetting, ...createDto } as any);
      repository.save.mockResolvedValue({ ...mockSetting, ...createDto } as any);

      const result = await service.create(mockUser, createDto);

      expect(result.key).toBe('app.theme');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', key: 'app.theme' },
      });
    });

    it('should throw ConflictException when key already exists', async () => {
      const createDto: CreateSettingDto = {
        key: 'app.name',
        value: 'New App',
        category: SettingCategory.GENERAL,
        dataType: SettingDataType.STRING,
      };

      repository.findOne.mockResolvedValue(mockSetting);

      await expect(service.create(mockUser, createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all settings for tenant', async () => {
      const settings = [mockSetting, { ...mockSetting, id: 'setting-456', key: 'app.theme' }];
      repository.find.mockResolvedValue(settings);

      const result = await service.findAll(mockUser);

      expect(result).toHaveLength(2);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
      });
    });

    it('should filter by category', async () => {
      repository.find.mockResolvedValue([mockSetting]);

      await service.findAll(mockUser, 'GENERAL');

      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', category: 'GENERAL' },
      });
    });
  });

  describe('findOne', () => {
    it('should return setting by key', async () => {
      repository.findOne.mockResolvedValue(mockSetting);

      const result = await service.findOne(mockUser, 'app.name');

      expect(result.key).toBe('app.name');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', key: 'app.name' },
      });
    });

    it('should throw NotFoundException when setting not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update setting successfully', async () => {
      const updateDto: UpdateSettingDto = {
        value: 'Updated App',
        description: 'Updated description',
      };

      repository.findOne.mockResolvedValue(mockSetting);
      repository.save.mockResolvedValue({ ...mockSetting, ...updateDto });

      const result = await service.update(mockUser, 'app.name', updateDto);

      expect(result.value).toBe('Updated App');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when setting not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockUser, 'nonexistent', { value: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove setting successfully', async () => {
      repository.findOne.mockResolvedValue(mockSetting);
      repository.remove.mockResolvedValue(mockSetting);

      await service.remove(mockUser, 'app.name');

      expect(repository.remove).toHaveBeenCalledWith(mockSetting);
    });

    it('should throw NotFoundException when setting not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockUser, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPublicSettings', () => {
    it('should return only public settings', async () => {
      const publicSettings = [mockSetting];
      repository.find.mockResolvedValue(publicSettings);

      const result = await service.getPublicSettings(mockUser);

      expect(result).toHaveLength(1);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', isPublic: true },
      });
    });
  });

  describe('bulkUpsert', () => {
    it('should create new settings', async () => {
      const settings: CreateSettingDto[] = [
        { key: 'new.setting1', value: 'value1', category: SettingCategory.GENERAL, dataType: SettingDataType.STRING },
        { key: 'new.setting2', value: 'value2', category: SettingCategory.GENERAL, dataType: SettingDataType.STRING },
      ];

      repository.findOne.mockResolvedValue(null);
      repository.create.mockImplementation((dto) => dto as any);
      repository.save.mockImplementation(async (entity) => entity as any);

      const result = await service.bulkUpsert(mockUser, settings);

      expect(result).toHaveLength(2);
      expect(repository.save).toHaveBeenCalledTimes(2);
    });

    it('should update existing settings', async () => {
      const settings: CreateSettingDto[] = [
        { key: 'app.name', value: 'Updated App', category: SettingCategory.GENERAL, dataType: SettingDataType.STRING },
      ];

      repository.findOne.mockResolvedValue(mockSetting);
      repository.save.mockResolvedValue({ ...mockSetting, value: 'Updated App' });

      const result = await service.bulkUpsert(mockUser, settings);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('Updated App');
    });

    it('should handle mix of new and existing settings', async () => {
      const settings: CreateSettingDto[] = [
        { key: 'app.name', value: 'Updated', category: SettingCategory.GENERAL, dataType: SettingDataType.STRING },
        { key: 'new.setting', value: 'New', category: SettingCategory.GENERAL, dataType: SettingDataType.STRING },
      ];

      repository.findOne
        .mockResolvedValueOnce(mockSetting)
        .mockResolvedValueOnce(null);
      repository.create.mockImplementation((dto) => dto as any);
      repository.save.mockImplementation(async (entity) => entity as any);

      const result = await service.bulkUpsert(mockUser, settings);

      expect(result).toHaveLength(2);
    });
  });
});
