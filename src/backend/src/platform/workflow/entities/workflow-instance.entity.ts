import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export const WorkflowInstanceStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export type WorkflowInstanceStatus = typeof WorkflowInstanceStatus[keyof typeof WorkflowInstanceStatus];

@Entity('workflow_instances')
export class WorkflowInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  workflowId: string;

  @Column()
  entityType: string;

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({
    type: 'enum',
    enum: WorkflowInstanceStatus,
    default: WorkflowInstanceStatus.PENDING,
  })
  status: WorkflowInstanceStatus;

  @Column({ type: 'int', default: 0 })
  currentStep: number;

  @Column({ type: 'jsonb', nullable: true })
  stepHistory: Record<string, unknown>[];

  @Column({ type: 'uuid' })
  initiatedBy: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
