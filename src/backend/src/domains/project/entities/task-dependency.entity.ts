import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Task } from './task.entity';

export enum DependencyType {
  FINISH_TO_START = 'finish_to_start', // Task B starts after Task A finishes
  START_TO_START = 'start_to_start', // Task B starts when Task A starts
  FINISH_TO_FINISH = 'finish_to_finish', // Task B finishes when Task A finishes
  START_TO_FINISH = 'start_to_finish', // Task B finishes when Task A starts
}

@Entity('task_dependencies')
@Index(['tenantId', 'taskId'])
@Index(['tenantId', 'dependsOnTaskId'])
export class TaskDependency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @ManyToOne(() => Task, (task) => task.dependencies, { nullable: false })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'task_id' })
  taskId: string;

  @ManyToOne(() => Task, (task) => task.dependentTasks, { nullable: false })
  @JoinColumn({ name: 'depends_on_task_id' })
  dependsOnTask: Task;

  @Column({ name: 'depends_on_task_id' })
  dependsOnTaskId: string;

  @Column({
    type: 'enum',
    enum: DependencyType,
    default: DependencyType.FINISH_TO_START,
  })
  type: DependencyType;

  @Column({ type: 'int', default: 0, name: 'lag_days' })
  lagDays: number; // Delay in days (can be negative for lead time)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;
}
