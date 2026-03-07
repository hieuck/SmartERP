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
import { Product } from '../../../inventory/product/entities/product.entity';
import { BOM } from '../../bom/entities/bom.entity';
import { User } from '../../../../core/user/entities/user.entity';

export enum WorkOrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

@Entity('work_orders')
@Index(['tenantId', 'productId'])
@Index(['tenantId', 'status'])
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ unique: true })
  reference: string; // WO-2026-0001

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'bom_id', nullable: true })
  bomId: string;

  @ManyToOne(() => BOM)
  @JoinColumn({ name: 'bom_id' })
  bom: BOM;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'qty_to_produce' })
  qtyToProduce: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'qty_produced', default: 0 })
  qtyProduced: number;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.DRAFT,
  })
  status: WorkOrderStatus;

  @Column({ type: 'timestamp', name: 'date_planned_start', nullable: true })
  datePlannedStart: Date;

  @Column({ type: 'timestamp', name: 'date_planned_finished', nullable: true })
  datePlannedFinished: Date;

  @Column({ type: 'timestamp', name: 'date_start', nullable: true })
  dateStart: Date;

  @Column({ type: 'timestamp', name: 'date_finished', nullable: true })
  dateFinished: Date;

  @Column({ name: 'responsible_id', nullable: true })
  responsibleId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'responsible_id' })
  responsible: User;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  validate() {
    if (this.qtyToProduce <= 0) {
      throw new Error('Quantity to produce must be greater than 0');
    }
    if (this.qtyProduced < 0) {
      throw new Error('Quantity produced cannot be negative');
    }
    if (this.qtyProduced > this.qtyToProduce) {
      throw new Error('Quantity produced cannot exceed quantity to produce');
    }
  }
}
