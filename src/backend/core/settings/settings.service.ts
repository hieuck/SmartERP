import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async create(tenantId: string, createSettingDto: CreateSettingDto): Promise<Setting> {
    const existing = await this.settingRepository.findOne({
      where: { tenantId, key: createSettingDto.key },
    });

    if (existing) {
      throw new ConflictException(`Setting with key '${createSettingDto.key}' already exists`);
    }

    const setting = this.settingRepository.create({
      ...createSettingDto,
      tenantId,
    });

    return this.settingRepository.save(setting);
  }

  async findAll(tenantId: string, category?: string): Promise<Setting[]> {
    const where: any = { tenantId };
    if (category) {
      where.category = category;
    }

    return this.settingRepository.find({ where });
  }

  async findOne(tenantId: string, key: string): Promise<Setting> {
    const setting = await this.settingRepository.findOne({
      where: { tenantId, key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    return setting;
  }

  async update(tenantId: string, key: string, updateSettingDto: UpdateSettingDto): Promise<Setting> {
    const setting = await this.findOne(tenantId, key);

    Object.assign(setting, updateSettingDto);

    return this.settingRepository.save(setting);
  }

  async remove(tenantId: string, key: string): Promise<void> {
    const setting = await this.findOne(tenantId, key);
    await this.settingRepository.remove(setting);
  }

  async getPublicSettings(tenantId: string): Promise<Setting[]> {
    return this.settingRepository.find({
      where: { tenantId, isPublic: true },
    });
  }

  async bulkUpsert(tenantId: string, settings: CreateSettingDto[]): Promise<Setting[]> {
    const results: Setting[] = [];

    for (const settingDto of settings) {
      const existing = await this.settingRepository.findOne({
        where: { tenantId, key: settingDto.key },
      });

      if (existing) {
        // Update existing
        Object.assign(existing, settingDto);
        results.push(await this.settingRepository.save(existing));
      } else {
        // Create new
        const setting = this.settingRepository.create({
          ...settingDto,
          tenantId,
        });
        results.push(await this.settingRepository.save(setting));
      }
    }

    return results;
  }
}
