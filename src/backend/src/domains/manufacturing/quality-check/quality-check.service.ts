import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityCheck, QualityCheckResult } from './entities/quality-check.entity';
import { CacheService } from '../../../common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '../../../common/cache/cache.config';

@Injectable()
export class QualityCheckService {
  constructor(
    @InjectRepository(QualityCheck)
    private readonly qualityCheckRepository: Repository<QualityCheck>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(tenantId: string, workOrderId?: string): Promise<QualityCheck[]> {
    const query = this.qualityCheckRepository
      .createQueryBuilder('qualityCheck')
      .where('qualityCheck.tenantId = :tenantId', { tenantId })
      .andWhere('qualityCheck.deletedAt IS NULL')
      .orderBy('qualityCheck.checkDate', 'DESC');

    if (workOrderId) {
      query.andWhere('qualityCheck.workOrderId = :workOrderId', { workOrderId });
    }

    return query.getMany();
  }

  async findById(id: string, tenantId: string): Promise<QualityCheck> {
    const cacheKey = generateCacheKey('qualitycheck', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const check = await this.qualityCheckRepository.findOne({ where: { id, tenantId } });
        if (!check) {
          throw new NotFoundException(`Quality Check with ID ${id} not found`);
        }
        return check;
      },
      CacheTTL.MEDIUM,
    );
  }

  async create(data: Partial<QualityCheck>, tenantId: string): Promise<QualityCheck> {
    if (!data.checkNumber) {
      const count = await this.qualityCheckRepository.count({ where: { tenantId } });
      data.checkNumber = `QC-${String(count + 1).padStart(6, '0')}`;
    }

    if (data.result === QualityCheckResult.PASSED) {
      data.quantityPassed = data.quantityChecked;
      data.quantityFailed = 0;
    } else if (data.result === QualityCheckResult.FAILED) {
      data.quantityPassed = 0;
      data.quantityFailed = data.quantityChecked;
    }

    const check = this.qualityCheckRepository.create({ ...data, tenantId });
    return this.qualityCheckRepository.save(check);
  }

  async update(id: string, data: Partial<QualityCheck>, tenantId: string): Promise<QualityCheck> {
    await this.qualityCheckRepository.update({ id, tenantId }, data);
    const updated = await this.findById(id, tenantId);

    const cacheKey = generateCacheKey('qualitycheck', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.qualityCheckRepository.softDelete({ id, tenantId });

    const cacheKey = generateCacheKey('qualitycheck', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async approve(id: string, approvedBy: string, tenantId: string): Promise<QualityCheck> {
    const check = await this.findById(id, tenantId);

    check.approvedBy = approvedBy;
    check.approvedAt = new Date();

    const updated = await this.qualityCheckRepository.save(check);

    const cacheKey = generateCacheKey('qualitycheck', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async getStatistics(tenantId: string, startDate?: Date, endDate?: Date) {
    const query = this.qualityCheckRepository
      .createQueryBuilder('qc')
      .where('qc.tenantId = :tenantId', { tenantId })
      .andWhere('qc.deletedAt IS NULL');

    if (startDate) {
      query.andWhere('qc.checkDate >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('qc.checkDate <= :endDate', { endDate });
    }

    const checks = await query.getMany();

    const totalChecks = checks.length;
    const passedChecks = checks.filter((c) => c.result === QualityCheckResult.PASSED).length;
    const failedChecks = checks.filter((c) => c.result === QualityCheckResult.FAILED).length;
    const conditionalChecks = checks.filter(
      (c) => c.result === QualityCheckResult.CONDITIONAL,
    ).length;

    const totalQuantityChecked = checks.reduce((sum, c) => sum + Number(c.quantityChecked), 0);
    const totalQuantityPassed = checks.reduce((sum, c) => sum + Number(c.quantityPassed), 0);
    const totalQuantityFailed = checks.reduce((sum, c) => sum + Number(c.quantityFailed), 0);

    return {
      totalChecks,
      passedChecks,
      failedChecks,
      conditionalChecks,
      passRate: totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0,
      totalQuantityChecked,
      totalQuantityPassed,
      totalQuantityFailed,
      quantityPassRate:
        totalQuantityChecked > 0 ? (totalQuantityPassed / totalQuantityChecked) * 100 : 0,
    };
  }
}
