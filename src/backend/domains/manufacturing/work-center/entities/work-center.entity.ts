import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('work_centers')
@Index(['tenantId', 'code'], { unique: true })
export class WorkCenter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'time_efficiency', default: 100 })
  timeEfficiency: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'capacity_per_cycle', default: 1 })
  capacityPerCycle: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'cost_per_hour', default: 0 })
  costPerHour: number;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
