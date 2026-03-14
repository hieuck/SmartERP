import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApprovalStatus } from '../enums/approval-status.enum';

@Entity('approval_requests')
export class ApprovalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityType: string; // 'SalesOrder', 'PurchaseOrder', 'JournalEntry', etc.

  @Column()
  entityId: string;

  @Column()
  workflowId: string;

  @Column()
  currentState: string;

  @Column()
  requestedBy: string;

  @Column()
  requestedAt: Date;

  @Column({ nullable: true })
  approvedBy?: string;

  @Column({ nullable: true })
  approvedAt?: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // Additional context data

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
