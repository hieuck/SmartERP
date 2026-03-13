import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@/core/user/entities/user.entity';
import { IssuePriority } from '../enums/issue-priority.enum';
import { IssueStatus } from '../enums/issue-status.enum';
import { IssueType } from '../enums/issue-type.enum';
import { IssueAttachment } from './issue-attachment.entity';
import { IssueComment } from './issue-comment.entity';

@Entity('issues')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'assigneeId'])
@Index(['tenantId', 'reporterId'])
export class Issue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ unique: true })
  reference: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: IssueStatus,
    default: IssueStatus.NEW,
  })
  status: IssueStatus;

  @Column({
    type: 'enum',
    enum: IssuePriority,
    default: IssuePriority.MEDIUM,
  })
  priority: IssuePriority;

  @Column({
    type: 'enum',
    enum: IssueType,
    default: IssueType.TASK,
  })
  type: IssueType;

  @Column({ name: 'reporter_id' })
  reporterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;

  @OneToMany(() => IssueComment, (comment) => comment.issue, { cascade: true })
  comments: IssueComment[];

  @OneToMany(() => IssueAttachment, (attachment) => attachment.issue, {
    cascade: true,
  })
  attachments: IssueAttachment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt: Date;

  @Column({ name: 'closed_at', nullable: true })
  closedAt: Date;

  @BeforeInsert()
  generateReference() {
    if (!this.reference) {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      this.reference = `ISS-${year}-${random}`;
    }
  }
}
