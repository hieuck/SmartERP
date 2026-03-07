import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from '../../../core/user/entities/user.entity';
import { ReportColumn } from './report-column.entity';

export enum ReportType {
  TABLE = 'table',
  CHART = 'chart',
  PIVOT = 'pivot',
}

export enum ChartType {
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  AREA = 'area',
  DONUT = 'donut',
}

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
  reference: string; // Auto-generated: RPT-YYYY-NNNN

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ReportType, default: ReportType.TABLE })
  type: ReportType;

  @Column({ type: 'enum', enum: ChartType, nullable: true })
  chartType: ChartType;

  // Source table/entity to query (e.g., 'orders', 'products')
  @Column()
  sourceEntity: string;

  /**
   * Query configuration (JSON)
   * Format: { type: 'queryBuilder' | 'raw', config: {...} }
   * - queryBuilder: TypeORM QueryBuilder config (safe)
   * - raw: Raw SQL (admin only, sanitized)
   */
  @Column({ type: 'jsonb', nullable: true })
  query: any;

  /**
   * Filters configuration (JSON)
   * Format: [{ field: 'status', operator: '=', value: 'active' }]
   */
  @Column({ type: 'jsonb', nullable: true })
  filters: any;

  // Grouping configuration (array of field names)
  @Column({ type: 'jsonb', nullable: true })
  groupBy: string[];

  // Sorting configuration { field: 'createdAt', order: 'DESC' }
  @Column({ type: 'jsonb', nullable: true })
  orderBy: any;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPublic: boolean; // Can be viewed by all users in tenant

  @Column({ default: false })
  isScheduled: boolean; // Is this report scheduled to run?

  @Column()
  tenantId: string;

  @ManyToOne(() => User)
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

  // Auto-generate reference before insert
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

  // Validation
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

    // Validate groupBy is array if provided
    if (this.groupBy && !Array.isArray(this.groupBy)) {
      throw new Error('groupBy must be an array');
    }
  }
}
