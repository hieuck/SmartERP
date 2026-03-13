import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Employee } from '../../employee/entities/employee.entity';
import { LeaveType } from '../enums/leave-type.enum';

@Entity('leave_balances')
@Index(['tenantId', 'employeeId', 'leaveType', 'year'], { unique: true })
export class LeaveBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  @Index()
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({
    type: 'enum',
    enum: LeaveType,
  })
  leaveType: LeaveType;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  allocated: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  used: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  remaining: number;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
