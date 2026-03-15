import { User } from '@/common/security/permission.service';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChartType } from '../enums/chart-type.enum';
import { ReportType } from '../enums/report-type.enum';
import { ReportColumn } from './report-column.entity';

/**
 * Report entity for storing report definitions
 *
 * Security Notes:
 * - Query field should be validated to prevent SQL injection
 * - Only allow queries on authorized entities
 * - Sanitize all user inputs in filters
 */
@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ReportType, default: ReportType.TABLE })
  type: ReportType;

  @Column({ type: 'enum', enum: ChartType, nullable: true })
  chartType: ChartType;

  @Column()
  sourceEntity: string;

  @Column({ type: 'jsonb', nullable: true })
  query: unknown;

  @Column({ type: 'jsonb', nullable: true })
  filters: unknown;

  @Column({ type: 'jsonb', nullable: true })
  groupBy: string[];

  @Column({ type: 'jsonb', nullable: true })
  orderBy: unknown;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: false })
  isScheduled: boolean;

  @Column()
  tenantId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column()
  createdBy: string;

  @OneToMany(() => ReportColumn, (column) => column.report, {
    cascade: true,
    eager: true,
  })
  columns: ReportColumn[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateReference() {
    if (!this.reference) {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      this.reference = `RPT-${year}-${random}`;
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Report name is required');
    }

    if (!this.sourceEntity || this.sourceEntity.trim().length === 0) {
      throw new Error('Source entity is required');
    }

    if (this.type === ReportType.CHART && !this.chartType) {
      throw new Error('Chart type is required for chart reports');
    }

    if (this.groupBy && !Array.isArray(this.groupBy)) {
      throw new Error('groupBy must be an array');
    }
  }
}
