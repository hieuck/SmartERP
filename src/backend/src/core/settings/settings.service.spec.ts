import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Setting } from '../entities/setting.entity';
import { CreateSettingDto, SettingCategory, SettingDataType } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { createMockUser } from '@/common/test/test-helpers';

const mockUser = {
    id: 'user1',
    tenantId: 'tenant1',
    roles: ['admin'],
  };

  describe('SettingsService', () => {
  let service: SettingsService;
  let repository: Repository<Setting>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockSetting = {
    id: '1',
    key: 'app.name',
    value: 'SmartERP',
    category: SettingCategory.GENERAL,
    dataType: SettingDataType.STRING,
    description: 'Application name',
    isPublic: true,
    tenantId: 'tenant1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
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
    repository = module.get<Repository<Setting>>(getRepositoryToken(Setting));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a setting', async () => {
      const createDto: CreateSettingDto = {
        key: 'app.name',
        value: 'SmartERP',
        category: SettingCategory.GENERAL,
        dataType: SettingDataType.STRING,
        description: 'Application name',
        isPublic: true,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockSetting);
      mockRepository.save.mockResolvedValue(mockSetting);

      const result = await service.create(mockUser, createDto);

      expect(result).toEqual(mockSetting);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant1', key: 'app.name' },
      });
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: 'tenant1',
      });
      expect(repository.save).toHaveBeenCalledWith(mockSetting);
    });

    it('should throw ConflictException if setting already exists', async () => {
      const createDto: CreateSettingDto = {
        key: 'app.name',
        value: 'SmartERP',
        category: SettingCategory.GENERAL,
      };

      mockRepository.findOne.mockResolvedValue(mockSetting);

      await expect(service.create(mockUser, createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all settings for a tenant', async () => {
      mockRepository.find.mockResolvedValue([mockSetting]);

      const result = await service.findAll(mockUser);

      expect(result).toEqual([mockSetting]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant1' },
      });
    });

    it('should return settings filtered by category', async () => {
      mockRepository.find.mockResolvedValue([mockSetting]);

      const result = await service.findAll(mockUser, SettingCategory.GENERAL);

      expect(result).toEqual([mockSetting]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant1', category: SettingCategory.GENERAL },
      });
    });
  });

  describe('findOne', () => {
    it('should return a setting by key', async () => {
      mockRepository.findOne.mockResolvedValue(mockSetting);

      const result = await service.findOne(mockUser, 'app.name');

      expect(result).toEqual(mockSetting);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant1', key: 'app.name' },
      });
    });

    it('should throw NotFoundException if setting not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a setting', async () => {
      const updateDto: UpdateSettingDto = {
        value: 'SmartERP Updated',
      };

      const updatedSetting = { ...mockSetting, value: 'SmartERP Updated' };

      mockRepository.findOne.mockResolvedValue(mockSetting);
      mockRepository.save.mockResolvedValue(updatedSetting);

      const result = await service.update(mockUser, 'app.name', updateDto);

      expect(result).toEqual(updatedSetting);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a setting', async () => {
      mockRepository.findOne.mockResolvedValue(mockSetting);
      mockRepository.remove.mockResolvedValue(mockSetting);

      await service.remove(mockUser, 'app.name');

      expect(repository.remove).toHaveBeenCalledWith(mockSetting);
    });
  });

  describe('getPublicSettings', () => {
    it('should return public settings', async () => {
      mockRepository.find.mockResolvedValue([mockSetting]);

      const result = await service.getPublicSettings(mockUser);

      expect(result).toEqual([mockSetting]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant1', isPublic: true },
      });
    });
  });

  describe('bulkUpsert', () => {
    it('should create new settings when they do not exist', async () => {
      const createDtos: CreateSettingDto[] = [
        {
          key: 'app.name',
          value: 'SmartERP',
          category: SettingCategory.GENERAL,
        },
        {
          key: 'app.version',
          value: '1.0.0',
          category: SettingCategory.GENERAL,
        },
      ];

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockImplementation((dto) => ({ ...dto, id: '1' }));
      mockRepository.save.mockImplementation((setting) => Promise.resolve(setting));

      const result = await service.bulkUpsert(mockUser, createDtos);

      expect(result).toHaveLength(2);
      expect(repository.create).toHaveBeenCalledTimes(2);
      expect(repository.save).toHaveBeenCalledTimes(2);
    });

    it('should update existing settings', async () => {
      const createDtos: CreateSettingDto[] = [
        {
          key: 'app.name',
          value: 'SmartERP Updated',
          category: SettingCategory.GENERAL,
        },
      ];

      const existingSetting = { ...mockSetting };
      mockRepository.findOne.mockResolvedValue(existingSetting);
      mockRepository.save.mockResolvedValue({ ...existingSetting, value: 'SmartERP Updated' });

      const result = await service.bulkUpsert(mockUser, createDtos);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('SmartERP Updated');
      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle mix of new and existing settings', async () => {
      const createDtos: CreateSettingDto[] = [
        {
          key: 'app.name',
          value: 'SmartERP Updated',
          category: SettingCategory.GENERAL,
        },
        {
          key: 'app.version',
          value: '1.0.0',
          category: SettingCategory.GENERAL,
        },
      ];

      mockRepository.findOne
        .mockResolvedValueOnce(mockSetting) // First call: existing
        .mockResolvedValueOnce(null); // Second call: new

      mockRepository.create.mockImplementation((dto) => ({ ...dto, id: '2' }));
      mockRepository.save.mockImplementation((setting) => Promise.resolve(setting));

      const result = await service.bulkUpsert(mockUser, createDtos);

      expect(result).toHaveLength(2);
      expect(repository.findOne).toHaveBeenCalledTimes(2);
      expect(repository.save).toHaveBeenCalledTimes(2);
    });
  });
});
