import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { User } from '@/core/user/entities/user.entity';
import { EmploymentStatus, EmploymentType } from '../../enums/hr.enum';

@Entity('employees')
@Index(['tenantId', 'employeeCode'], { unique: true })
@Index(['tenantId', 'email'], { unique: true })
export class Employee extends BaseEntity {
  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'employee_code' })
  employeeCode: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  position?: string;

  @Column({
    type: 'enum',
    enum: EmploymentStatus,
    default: EmploymentStatus.ACTIVE,
  })
  status: EmploymentStatus;

  @Column({
    type: 'enum',
    enum: EmploymentType,
    default: EmploymentType.FULL_TIME,
    name: 'employment_type',
  })
  employmentType: EmploymentType;

  @Column({ type: 'date', nullable: true, name: 'hire_date' })
  hireDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'termination_date' })
  terminationDate?: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'base_salary' })
  baseSalary?: number;

  @Column({ name: 'manager_id', nullable: true })
  managerId?: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager?: Employee;

  @OneToMany(() => Employee, (employee) => employee.manager)
  subordinates?: Employee[];

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'emergency_contact' })
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}
