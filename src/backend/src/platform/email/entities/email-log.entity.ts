import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { EmailStatus } from '../enums/email-status.enum';

@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column()
  to: string;

  @Column({ nullable: true })
  cc: string;

  @Column({ nullable: true })
  bcc: string;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.PENDING,
  })
  status: EmailStatus;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'uuid', nullable: true })
  templateId: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
