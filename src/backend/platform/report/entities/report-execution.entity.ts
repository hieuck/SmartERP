import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Report } from './report.entity';
import { User } from '../../../core/user/entities/user.entity';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * ReportExecution entity for tracking report execution history
 * Stores execution metadata and results
 */
@Entity('report_executions')
export class ReportExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Report)
  @JoinColumn({ name: 'reportId' })
  report: Report;

  @Column()
  reportId: string;

  @Column({ type: 'enum', enum: ExecutionStatus, default: ExecutionStatus.PENDING })
  status: ExecutionStatus;

  // Execution parameters (filters applied at runtime)
  @Column({ type: 'jsonb', nullable: true })
  parameters: any;

  // Execution result (data rows)
  @Column({ type: 'jsonb', nullable: true })
  result: any;

  // Number of rows returned
  @Column({ default: 0 })
  rowCount: number;

  // Execution time in milliseconds
  @Column({ nullable: true })
  executionTime: number;

  // Error message if failed
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'executedBy' })
  executor: User;

  @Column()
  executedBy: string;

  @CreateDateColumn()
  executedAt: Date;
}
