import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Routing } from './routing.entity';
import { WorkCenter } from '../../work-center/entities/work-center.entity';

@Entity('operations')
@Index(['tenantId', 'routingId'])
export class Operation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'routing_id' })
  routingId: string;

  @ManyToOne(() => Routing, routing => routing.operations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routing_id' })
  routing: Routing;

  @Column({ name: 'work_center_id' })
  workCenterId: string;

  @ManyToOne(() => WorkCenter)
  @JoinColumn({ name: 'work_center_id' })
  workCenter: WorkCenter;

  @Column()
  name: string;

  @Column({ type: 'int' })
  sequence: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'duration_expected' })
  durationExpected: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'cost_per_hour', default: 0 })
  costPerHour: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_cost', default: 0 })
  totalCost: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  calculateTotalCost() {
    const hours = this.durationExpected / 60;
    this.totalCost = hours * (this.costPerHour || 0);
  }

  @BeforeInsert()
  @BeforeUpdate()
  validate() {
    if (this.durationExpected <= 0) {
      throw new Error('Duration must be greater than 0');
    }
    if (this.sequence < 0) {
      throw new Error('Sequence must be non-negative');
    }
  }
}
