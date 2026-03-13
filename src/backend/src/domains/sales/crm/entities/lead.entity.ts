import { LeadStatus } from '../enums/lead-status.enum';
import { LeadSource } from '../enums/lead-source.enum';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  company: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'new',
  })
  status: LeadStatus;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'other',
  })
  source: LeadSource;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'estimated_value' })
  estimatedValue: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_to' })
  assignedTo: string;

  @Column({ type: 'uuid', nullable: true, name: 'converted_to_customer_id' })
  convertedToCustomerId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
