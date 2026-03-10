import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { IssuePriority } from '../../issue-tracking/entities/issue.entity';

@Entity('slas')
@Index(['tenantId', 'isActive'])
export class SLA {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: IssuePriority,
  })
  priority: IssuePriority;

  @Column({ name: 'response_time_hours' })
  responseTimeHours: number;

  @Column({ name: 'resolution_time_hours' })
  resolutionTimeHours: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
