import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { User } from '../../../core/user/entities/user.entity';
import { Task } from './task.entity';
import { Project } from './project.entity';

@Entity('time_entries')
@Index(['tenantId', 'userId'])
@Index(['tenantId', 'taskId'])
@Index(['tenantId', 'projectId'])
@Index(['tenantId', 'date'])
export class TimeEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Task, (task) => task.timeEntries, { nullable: false })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'task_id' })
  taskId: string;

  @ManyToOne(() => Project, { nullable: false })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hours: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false, name: 'is_billable' })
  isBillable: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'hourly_rate' })
  hourlyRate?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  cost?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;

  // Validate hours
  @BeforeInsert()
  @BeforeUpdate()
  validateHours() {
    if (this.hours <= 0) {
      throw new Error('Hours must be greater than 0');
    }
    if (this.hours > 24) {
      throw new Error('Hours cannot exceed 24 per day');
    }
  }

  // Auto-calculate cost
  @BeforeInsert()
  @BeforeUpdate()
  calculateCost() {
    if (this.hourlyRate) {
      this.cost = this.hours * this.hourlyRate;
    }
  }
}
