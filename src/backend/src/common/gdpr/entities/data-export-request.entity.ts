import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../core/user/entities/user.entity';
import { ExportFormat } from '../enums/export-format.enum';
import { ExportStatus } from '../enums/export-status.enum';

@Entity('data_export_requests')
export class DataExportRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: ExportStatus, default: ExportStatus.PENDING })
  status: ExportStatus;

  @Column({ type: 'enum', enum: ExportFormat, default: ExportFormat.JSON })
  format: ExportFormat;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  // Auto-set expiry date (7 days from creation)
  @BeforeInsert()
  setExpiryDate() {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    this.expiresAt = expiryDate;
  }

  // Computed property
  get isExpired(): boolean {
    return this.expiresAt && new Date() > this.expiresAt;
  }
}
