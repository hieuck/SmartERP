import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '@/core/user/entities/user.entity';

@Entity('salary_structures')
@Index(['tenantId', 'employeeId'])
export class SalaryStructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'employee_id' })
  employee: User;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'base_salary' })
  baseSalary: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  allowances: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  deductions: number;

  @Column({ type: 'date', name: 'effective_from' })
  effectiveFrom: Date;

  @Column({ type: 'date', name: 'effective_to', nullable: true })
  effectiveTo: Date | null;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
