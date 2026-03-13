import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from '@/core/user/entities/user.entity';
import { PayslipStatus } from '../enums/payslip-status.enum';
import { SalaryStructure } from './salary-structure.entity';

@Entity('payslips')
@Index(['tenantId', 'employeeId', 'month', 'year'], { unique: true })
export class Payslip {
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

  @Column({ name: 'salary_structure_id' })
  salaryStructureId: string;

  @ManyToOne(() => SalaryStructure)
  @JoinColumn({ name: 'salary_structure_id' })
  salaryStructure: SalaryStructure;

  @Column({ type: 'int' })
  month: number; // 1-12

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'base_salary' })
  baseSalary: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  allowances: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  deductions: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'tax_amount', default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'gross_salary' })
  grossSalary: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'net_salary' })
  netSalary: number;

  @Column({
    type: 'enum',
    enum: PayslipStatus,
    default: PayslipStatus.DRAFT,
  })
  status: PayslipStatus;

  @Column({ type: 'date', name: 'payment_date', nullable: true })
  paymentDate: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed fields
  @BeforeInsert()
  @BeforeUpdate()
  calculateSalary() {
    // Gross salary = base + allowances
    this.grossSalary = Number(this.baseSalary) + Number(this.allowances);

    // Calculate tax (progressive tax: 0% up to 5M, 10% from 5M-10M, 20% above 10M)
    const taxableIncome = this.grossSalary;
    if (taxableIncome <= 5000000) {
      this.taxAmount = 0;
    } else if (taxableIncome <= 10000000) {
      this.taxAmount = (taxableIncome - 5000000) * 0.1;
    } else {
      this.taxAmount = 500000 + (taxableIncome - 10000000) * 0.2;
    }

    // Net salary = gross - deductions - tax
    this.netSalary = this.grossSalary - Number(this.deductions) - this.taxAmount;
  }

  @BeforeInsert()
  @BeforeUpdate()
  validate() {
    if (this.month < 1 || this.month > 12) {
      throw new Error('Month must be between 1 and 12');
    }

    if (this.year < 2000 || this.year > 2100) {
      throw new Error('Year must be between 2000 and 2100');
    }

    if (this.baseSalary < 0) {
      throw new Error('Base salary cannot be negative');
    }
  }
}
