import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AggregationType } from '../enums/aggregation-type.enum';
import { ColumnType } from '../enums/column-type.enum';
import { Report } from './report.entity';

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

  @Column()
  fieldName: string;

  @Column()
  label: string;

  @Column({ type: 'enum', enum: ColumnType, default: ColumnType.TEXT })
  type: ColumnType;

  @Column({ type: 'enum', enum: AggregationType, default: AggregationType.NONE })
  aggregation: AggregationType;

  @Column({ nullable: true })
  width: number;

  @Column({ default: 0 })
  sequence: number;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ default: true })
  isSortable: boolean;

  @Column({ nullable: true })
  format: string;

  @Column()
  tenantId: string;

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
