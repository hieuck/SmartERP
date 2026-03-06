import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Setting } from './entities/setting.entity';
import { CreateSettingDto, SettingCategory, SettingDataType } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

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
    tenantId: 'tenant-1',
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

      const result = await service.create('tenant-1', createDto);

      expect(result).toEqual(mockSetting);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', key: 'app.name' },
      });
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: 'tenant-1',
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

      await expect(service.create('tenant-1', createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all settings for a tenant', async () => {
      mockRepository.find.mockResolvedValue([mockSetting]);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual([mockSetting]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
      });
    });

    it('should return settings filtered by category', async () => {
      mockRepository.find.mockResolvedValue([mockSetting]);

      const result = await service.findAll('tenant-1', SettingCategory.GENERAL);

      expect(result).toEqual([mockSetting]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', category: SettingCategory.GENERAL },
      });
    });
  });

  describe('findOne', () => {
    it('should return a setting by key', async () => {
      mockRepository.findOne.mockResolvedValue(mockSetting);

      const result = await service.findOne('tenant-1', 'app.name');

      expect(result).toEqual(mockSetting);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', key: 'app.name' },
      });
    });

    it('should throw NotFoundException if setting not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('tenant-1', 'nonexistent')).rejects.toThrow(NotFoundException);
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

      const result = await service.update('tenant-1', 'app.name', updateDto);

      expect(result).toEqual(updatedSetting);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a setting', async () => {
      mockRepository.findOne.mockResolvedValue(mockSetting);
      mockRepository.remove.mockResolvedValue(mockSetting);

      await service.remove('tenant-1', 'app.name');

      expect(repository.remove).toHaveBeenCalledWith(mockSetting);
    });
  });

  describe('getPublicSettings', () => {
    it('should return public settings', async () => {
      mockRepository.find.mockResolvedValue([mockSetting]);

      const result = await service.getPublicSettings('tenant-1');

      expect(result).toEqual([mockSetting]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', isPublic: true },
      });
    });
  });
});
