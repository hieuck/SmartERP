import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material, MaterialType } from './entities/material.entity';
import { CacheService } from '../../../common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '../../../common/cache/cache.config';

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(tenantId: string, type?: MaterialType): Promise<Material[]> {
    const query = this.materialRepository
      .createQueryBuilder('material')
      .where('material.tenantId = :tenantId', { tenantId })
      .andWhere('material.deletedAt IS NULL');

    if (type) {
      query.andWhere('material.type = :type', { type });
    }

    return query.orderBy('material.code', 'ASC').getMany();
  }

  async findById(id: string, tenantId: string): Promise<Material> {
    const cacheKey = generateCacheKey('material', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const material = await this.materialRepository.findOne({ where: { id, tenantId } });
        if (!material) {
          throw new NotFoundException(`Material with ID ${id} not found`);
        }
        return material;
      },
      CacheTTL.MEDIUM,
    );
  }

  async create(data: Partial<Material>, tenantId: string): Promise<Material> {
    const material = this.materialRepository.create({ ...data, tenantId });
    return this.materialRepository.save(material);
  }

  async update(id: string, data: Partial<Material>, tenantId: string): Promise<Material> {
    await this.materialRepository.update({ id, tenantId }, data);
    const updated = await this.findById(id, tenantId);

    const cacheKey = generateCacheKey('material', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.materialRepository.softDelete({ id, tenantId });

    const cacheKey = generateCacheKey('material', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async findLowStock(tenantId: string): Promise<Material[]> {
    return this.materialRepository
      .createQueryBuilder('material')
      .where('material.tenantId = :tenantId', { tenantId })
      .andWhere('material.stockQuantity <= material.reorderPoint')
      .andWhere('material.deletedAt IS NULL')
      .orderBy('material.stockQuantity', 'ASC')
      .getMany();
  }
}
