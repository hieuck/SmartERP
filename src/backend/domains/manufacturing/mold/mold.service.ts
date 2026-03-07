import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mold, MoldStatus } from './entities/mold.entity';
import { CacheService } from '../../../common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '../../../common/cache/cache.config';

@Injectable()
export class MoldService {
  constructor(
    @InjectRepository(Mold)
    private readonly moldRepository: Repository<Mold>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(tenantId: string, status?: MoldStatus): Promise<Mold[]> {
    const query = this.moldRepository
      .createQueryBuilder('mold')
      .where('mold.tenantId = :tenantId', { tenantId })
      .andWhere('mold.deletedAt IS NULL')
      .orderBy('mold.code', 'ASC');

    if (status) {
      query.andWhere('mold.status = :status', { status });
    }

    return query.getMany();
  }

  async findById(id: string, tenantId: string): Promise<Mold> {
    const cacheKey = generateCacheKey('mold', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const mold = await this.moldRepository.findOne({ where: { id, tenantId } });
        if (!mold) {
          throw new NotFoundException(`Mold with ID ${id} not found`);
        }
        return mold;
      },
      CacheTTL.MEDIUM,
    );
  }

  async create(data: Partial<Mold>, tenantId: string): Promise<Mold> {
    const mold = this.moldRepository.create({ ...data, tenantId });
    return this.moldRepository.save(mold);
  }

  async update(id: string, data: Partial<Mold>, tenantId: string): Promise<Mold> {
    await this.moldRepository.update({ id, tenantId }, data);
    const updated = await this.findById(id, tenantId);

    const cacheKey = generateCacheKey('mold', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.moldRepository.softDelete({ id, tenantId });

    const cacheKey = generateCacheKey('mold', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async findNeedingMaintenance(tenantId: string): Promise<Mold[]> {
    const today = new Date();
    return this.moldRepository
      .createQueryBuilder('mold')
      .where('mold.tenantId = :tenantId', { tenantId })
      .andWhere('mold.status = :status', { status: MoldStatus.ACTIVE })
      .andWhere('mold.nextMaintenanceDate <= :today', { today })
      .andWhere('mold.deletedAt IS NULL')
      .orderBy('mold.nextMaintenanceDate', 'ASC')
      .getMany();
  }

  async recordUsage(id: string, tenantId: string): Promise<Mold> {
    const mold = await this.findById(id, tenantId);
    mold.usageCount += 1;

    if (mold.maxUsageCount && mold.usageCount >= mold.maxUsageCount) {
      mold.status = MoldStatus.MAINTENANCE;
    }

    const updated = await this.moldRepository.save(mold);

    const cacheKey = generateCacheKey('mold', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }
}
