import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Report } from './report.entity';

export enum ColumnType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DATETIME = 'datetime',
  BOOLEAN = 'boolean',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
}

export enum AggregationType {
  NONE = 'none',
  SUM = 'sum',
  AVG = 'avg',
  COUNT = 'count',
  MIN = 'min',
  MAX = 'max',
}

/**
 * ReportColumn entity for defining report columns
 * Each column represents a field in the report output
 */
@Entity('report_columns')
export class ReportColumn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Report, (report) => report.columns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reportId' })
  report: Report;

  @Column()
  reportId: string;

  // Field name from source entity (e.g., 'customer.name', 'totalAmount')
  @Column()
  fieldName: string;

  // Display label for the column
  @Column()
  label: string;

  @Column({ type: 'enum', enum: ColumnType, default: ColumnType.TEXT })
  type: ColumnType;

  // Aggregation function (for grouped reports)
  @Column({ type: 'enum', enum: AggregationType, default: AggregationType.NONE })
  aggregation: AggregationType;

  // Column width (for UI rendering)
  @Column({ nullable: true })
  width: number;

  // Display order
  @Column({ default: 0 })
  sequence: number;

  // Is this column visible?
  @Column({ default: true })
  isVisible: boolean;

  // Is this column sortable?
  @Column({ default: true })
  isSortable: boolean;

  // Format string (e.g., '0,0.00' for numbers, 'YYYY-MM-DD' for dates)
  @Column({ nullable: true })
  format: string;

  @Column()
  tenantId: string;

  // Validation
  @BeforeInsert()
  @BeforeUpdate()
  validate() {
    if (!this.fieldName || this.fieldName.trim().length === 0) {
      throw new Error('Field name is required');
    }

    if (!this.label || this.label.trim().length === 0) {
      throw new Error('Column label is required');
    }

    if (this.sequence < 0) {
      throw new Error('Sequence must be non-negative');
    }

    if (this.width && this.width < 0) {
      throw new Error('Width must be non-negative');
    }
  }
}
