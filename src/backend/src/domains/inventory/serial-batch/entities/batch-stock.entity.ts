import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Batch } from './batch.entity';

@Entity('batch_stocks')
@Index(['tenantId', 'batchId', 'warehouseId'], { unique: true })
@Index(['tenantId', 'warehouseId'])
export class BatchStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'batch_id' })
  batchId: string;

  @ManyToOne(() => Batch, batch => batch.stocks)
  @JoinColumn({ name: 'batch_id' })
  batch: Batch;

  @Column({ name: 'warehouse_id' })
  warehouseId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  quantity: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
