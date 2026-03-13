import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';

@Entity('work_centers')
@Index(['tenantId', 'code'], { unique: true })
export class WorkCenter extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'time_efficiency', default: 100 })
  timeEfficiency: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'capacity_per_cycle', default: 1 })
  capacityPerCycle: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'cost_per_hour', default: 0 })
  costPerHour: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;
}
