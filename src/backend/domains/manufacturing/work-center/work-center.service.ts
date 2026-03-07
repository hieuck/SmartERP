import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkCenter } from './entities/work-center.entity';

@Injectable()
export class WorkCenterService {
  constructor(
    @InjectRepository(WorkCenter)
    private readonly workCenterRepository: Repository<WorkCenter>,
  ) {}

  async create(tenantId: string, dto: any): Promise<WorkCenter> {
    const workCenter = this.workCenterRepository.create({
      tenantId,
      ...dto,
    });

    return this.workCenterRepository.save(workCenter);
  }

  async findOne(tenantId: string, id: string): Promise<WorkCenter> {
    const workCenter = await this.workCenterRepository.findOne({
      where: { id, tenantId },
    });

    if (!workCenter) {
      throw new NotFoundException(`Work Center with ID ${id} not found`);
    }

    return workCenter;
  }

  async findActive(tenantId: string): Promise<WorkCenter[]> {
    return this.workCenterRepository.find({
      where: { tenantId, isActive: true },
    });
  }

  async update(tenantId: string, id: string, dto: any): Promise<WorkCenter> {
    const workCenter = await this.findOne(tenantId, id);

    Object.assign(workCenter, dto);

    return this.workCenterRepository.save(workCenter);
  }
}
