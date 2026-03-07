import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { User } from '../../../core/user/entities/user.entity';
import { Task } from './task.entity';

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('projects')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'projectManagerId'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ unique: true, length: 50 })
  code: string; // Auto-generated: PRJ-YYYY-NNNN

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
  })
  @Index()
  status: ProjectStatus;

  @Column({
    type: 'enum',
    enum: ProjectPriority,
    default: ProjectPriority.MEDIUM,
  })
  priority: ProjectPriority;

  @Column({ type: 'date', nullable: true, name: 'start_date' })
  startDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'actual_start_date' })
  actualStartDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'actual_end_date' })
  actualEndDate?: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'estimated_hours' })
  estimatedHours?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'actual_hours' })
  actualHours: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  budget?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'actual_cost' })
  actualCost: number;

  @Column({ type: 'int', default: 0 })
  progress: number; // 0-100

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'project_manager_id' })
  projectManager?: User;

  @Column({ name: 'project_manager_id', nullable: true })
  projectManagerId?: string;

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;

  // Auto-generate project code before insert
  @BeforeInsert()
  async generateCode() {
    if (!this.code) {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      this.code = `PRJ-${year}-${random}`;
    }
  }

  // Validate dates
  @BeforeInsert()
  @BeforeUpdate()
  validateDates() {
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      throw new Error('Start date must be before end date');
    }
    if (this.actualStartDate && this.actualEndDate && this.actualStartDate > this.actualEndDate) {
      throw new Error('Actual start date must be before actual end date');
    }
  }

  // Validate progress
  @BeforeInsert()
  @BeforeUpdate()
  validateProgress() {
    if (this.progress < 0 || this.progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
  }

  // Computed properties
  get isOverBudget(): boolean {
    return this.budget ? this.actualCost > this.budget : false;
  }

  get isOverdue(): boolean {
    if (!this.endDate || this.status === ProjectStatus.COMPLETED) {
      return false;
    }
    return new Date() > this.endDate;
  }

  get daysRemaining(): number | null {
    if (!this.endDate || this.status === ProjectStatus.COMPLETED) {
      return null;
    }
    const today = new Date();
    const end = new Date(this.endDate);
    const diff = end.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
