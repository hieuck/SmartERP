import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PieceRateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}

@Entity('piece_rate_works')
export class PieceRateWork {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({ type: 'uuid', nullable: true })
  workOrderId: string;

  @Column({ type: 'date' })
  workDate: Date;

  @Column()
  taskName: string;

  @Column({ type: 'int' })
  quantityCompleted: number;

  @Column()
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  ratePerUnit: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalEarnings: number;

  @Column({
    type: 'enum',
    enum: PieceRateStatus,
    default: PieceRateStatus.PENDING,
  })
  status: PieceRateStatus;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
