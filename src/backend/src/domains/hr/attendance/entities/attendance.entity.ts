import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Employee } from '../../employee/entities/employee.entity';

@Entity('attendances')
@Index(['tenantId', 'employeeId', 'date'], { unique: true })
@Index(['tenantId', 'date'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  @Index()
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time' })
  checkIn: string;

  @Column({ type: 'time', nullable: true })
  checkOut: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  hoursWorked: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Auto-calculate hours worked when check-out is set
   */
  @BeforeInsert()
  @BeforeUpdate()
  calculateHoursWorked() {
    if (this.checkIn && this.checkOut) {
      const checkInTime = this.parseTime(this.checkIn);
      const checkOutTime = this.parseTime(this.checkOut);
      
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      this.hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    }
  }

  private parseTime(timeStr: string): Date {
    const [hours, minutes, seconds = '00'] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    date.setSeconds(parseInt(seconds, 10));
    return date;
  }
}
