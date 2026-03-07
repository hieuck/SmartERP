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
import { Project } from './project.entity';
import { TaskDependency } from './task-dependency.entity';
import { TimeEntry } from './time-entry.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('tasks')
@Index(['tenantId', 'projectId'])
@Index(['tenantId', 'assigneeId'])
@Index(['tenantId', 'status'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ unique: true, length: 50 })
  code: string; // Auto-generated: TSK-YYYY-NNNN

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  @Index()
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @ManyToOne(() => Project, (project) => project.tasks, { nullable: false })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Task, { nullable: true })
  @JoinColumn({ name: 'parent_task_id' })
  parentTask?: Task;

  @Column({ name: 'parent_task_id', nullable: true })
  parentTaskId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee?: User;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId?: string;

  @Column({ type: 'date', nullable: true, name: 'start_date' })
  startDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'due_date' })
  dueDate?: Date;

  @Column({ type: 'date', nullable: true, name: 'completed_date' })
  completedDate?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'estimated_hours' })
  estimatedHours?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'actual_hours' })
  actualHours: number;

  @Column({ type: 'int', default: 0 })
  progress: number; // 0-100

  @Column({ type: 'text', nullable: true, name: 'blocked_reason' })
  blockedReason?: string;

  @OneToMany(() => TaskDependency, (dep) => dep.task)
  dependencies: TaskDependency[];

  @OneToMany(() => TaskDependency, (dep) => dep.dependsOnTask)
  dependentTasks: TaskDependency[];

  @OneToMany(() => TimeEntry, (entry) => entry.task)
  timeEntries: TimeEntry[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;

  // Auto-generate task code before insert
  @BeforeInsert()
  async generateCode() {
    if (!this.code) {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      this.code = `TSK-${year}-${random}`;
    }
  }

  // Validate dates
  @BeforeInsert()
  @BeforeUpdate()
  validateDates() {
    if (this.startDate && this.dueDate && this.startDate > this.dueDate) {
      throw new Error('Start date must be before due date');
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

  // Auto-set completed date when status changes to completed
  @BeforeUpdate()
  updateCompletedDate() {
    if (this.status === TaskStatus.COMPLETED && !this.completedDate) {
      this.completedDate = new Date();
      this.progress = 100;
    }
  }

  // Computed properties
  get isOverdue(): boolean {
    if (!this.dueDate || this.status === TaskStatus.COMPLETED) {
      return false;
    }
    return new Date() > this.dueDate;
  }

  get daysRemaining(): number | null {
    if (!this.dueDate || this.status === TaskStatus.COMPLETED) {
      return null;
    }
    const today = new Date();
    const due = new Date(this.dueDate);
    const diff = due.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  get isOverEstimate(): boolean {
    return this.estimatedHours ? this.actualHours > this.estimatedHours : false;
  }
}
