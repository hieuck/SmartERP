import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { User } from '@/common/security/permission.service';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async create(user: User, createSettingDto: CreateSettingDto): Promise<Setting> {
    const tenantId = user.tenantId;
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

  async findAll(user: User, category?: string): Promise<Setting[]> {
    const where: any = { tenantId: user.tenantId };
    if (category) {
      where.category = category;
    }

    return this.settingRepository.find({ where });
  }

  async findOne(user: User, key: string): Promise<Setting> {
    const setting = await this.settingRepository.findOne({
      where: { tenantId: user.tenantId, key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    return setting;
  }

  async update(user: User, key: string, updateSettingDto: UpdateSettingDto): Promise<Setting> {
    const setting = await this.findOne(user, key);

    Object.assign(setting, updateSettingDto);

    return this.settingRepository.save(setting);
  }

  async remove(user: User, key: string): Promise<void> {
    const setting = await this.findOne(user, key);
    await this.settingRepository.remove(setting);
  }

  async getPublicSettings(user: User): Promise<Setting[]> {
    return this.settingRepository.find({
      where: { tenantId: user.tenantId, isPublic: true },
    });
  }

  async bulkUpsert(user: User, settings: CreateSettingDto[]): Promise<Setting[]> {
    const tenantId = user.tenantId;
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
