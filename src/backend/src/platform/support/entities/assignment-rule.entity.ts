import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IssuePriority } from '@platform/issue-tracking/enums/issue-priority.enum';
import { IssueType } from '@platform/issue-tracking/enums/issue-type.enum';
import { AssignmentStrategy } from '@platform/support/enums/assignment-strategy.enum';
import { TicketChannel } from '@platform/support/enums/ticket-channel.enum';

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
