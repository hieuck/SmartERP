import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('error_logs')
@Index(['tenantId', 'severity'])
@Index(['tenantId', 'errorType'])
@Index(['createdAt'])
@Index(['resolved'])
export class ErrorLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  errorType: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  stackTrace: string;

  @Column({
    type: 'enum',
    enum: ErrorSeverity,
    default: ErrorSeverity.MEDIUM,
  })
  severity: ErrorSeverity;

  @Column({ type: 'jsonb', nullable: true })
  context: any;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  endpoint: string;

  @Column({ nullable: true })
  method: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ default: false })
  resolved: boolean;

  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @CreateDateColumn()
  createdAt: Date;
}
