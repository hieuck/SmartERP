import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { CreateSettingDto, SettingCategory, SettingDataType } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { createMockUser } from '@/common/test/test-helpers';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: SettingsService;

  const mockSettingsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getPublicSettings: jest.fn(),
  };

  const mockUser = createMockUser();

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
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get<SettingsService>(SettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

      mockSettingsService.create.mockResolvedValue(mockSetting);

      const result = await controller.create('tenant-1', createDto);

      expect(result).toEqual(mockSetting);
      expect(service.create).toHaveBeenCalledWith('tenant-1', createDto);
    });
  });

  describe('findAll', () => {
    it('should return all settings', async () => {
      mockSettingsService.findAll.mockResolvedValue([mockSetting]);

      const result = await controller.findAll('tenant-1');

      expect(result).toEqual([mockSetting]);
      expect(service.findAll).toHaveBeenCalledWith('tenant-1', undefined);
    });

    it('should return settings filtered by category', async () => {
      mockSettingsService.findAll.mockResolvedValue([mockSetting]);

      const result = await controller.findAll('tenant-1', SettingCategory.GENERAL);

      expect(result).toEqual([mockSetting]);
      expect(service.findAll).toHaveBeenCalledWith('tenant-1', SettingCategory.GENERAL);
    });
  });

  describe('getPublicSettings', () => {
    it('should return public settings', async () => {
      mockSettingsService.getPublicSettings.mockResolvedValue([mockSetting]);

      const result = await controller.getPublicSettings('tenant-1');

      expect(result).toEqual([mockSetting]);
      expect(service.getPublicSettings).toHaveBeenCalledWith('tenant-1');
    });
  });

  describe('findOne', () => {
    it('should return a setting by key', async () => {
      mockSettingsService.findOne.mockResolvedValue(mockSetting);

      const result = await controller.findOne('tenant-1', 'app.name');

      expect(result).toEqual(mockSetting);
      expect(service.findOne).toHaveBeenCalledWith('tenant-1', 'app.name');
    });
  });

  describe('update', () => {
    it('should update a setting', async () => {
      const updateDto: UpdateSettingDto = {
        value: 'SmartERP Updated',
      };

      const updatedSetting = { ...mockSetting, value: 'SmartERP Updated' };
      mockSettingsService.update.mockResolvedValue(updatedSetting);

      const result = await controller.update('tenant-1', 'app.name', updateDto);

      expect(result).toEqual(updatedSetting);
      expect(service.update).toHaveBeenCalledWith('tenant-1', 'app.name', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a setting', async () => {
      mockSettingsService.remove.mockResolvedValue(undefined);

      await controller.remove('tenant-1', 'app.name');

      expect(service.remove).toHaveBeenCalledWith('tenant-1', 'app.name');
    });
  });
});
