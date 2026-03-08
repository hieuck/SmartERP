import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { IssuePriority, IssueType } from '../../issue-tracking/entities/issue.entity';
import { TicketChannel } from './ticket.entity';

export enum AssignmentStrategy {
  ROUND_ROBIN = 'round_robin',
  LEAST_ACTIVE = 'least_active',
  SKILL_BASED = 'skill_based',
  RANDOM = 'random',
}

@Entity('assignment_rules')
@Index(['tenantId', 'isActive'])
export class AssignmentRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: AssignmentStrategy,
    default: AssignmentStrategy.ROUND_ROBIN,
  })
  strategy: AssignmentStrategy;

  @Column({
    type: 'enum',
    enum: IssuePriority,
    nullable: true,
  })
  priority: IssuePriority;

  @Column({
    type: 'enum',
    enum: IssueType,
    nullable: true,
  })
  type: IssueType;

  @Column({
    type: 'enum',
    enum: TicketChannel,
    nullable: true,
  })
  channel: TicketChannel;

  @Column('simple-array', { nullable: true })
  assigneeIds: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ default: 0 })
  priority_order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
