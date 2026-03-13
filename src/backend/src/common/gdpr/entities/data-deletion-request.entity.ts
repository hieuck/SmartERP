import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../core/user/entities/user.entity';
import { DeletionStatus } from '../enums/deletion-status.enum';

@Entity('data_deletion_requests')
export class DataDeletionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: DeletionStatus, default: DeletionStatus.PENDING })
  status: DeletionStatus;

  @Column({ type: 'text' })
  reason: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  // Computed property
  get isPending(): boolean {
    return this.status === DeletionStatus.PENDING;
  }

  get isApproved(): boolean {
    return this.status === DeletionStatus.APPROVED;
  }
}
