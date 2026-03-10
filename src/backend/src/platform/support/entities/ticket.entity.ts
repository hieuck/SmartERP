import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Issue } from '../../issue-tracking/entities/issue.entity';
import { User } from '../../../core/user/entities/user.entity';

export enum TicketChannel {
  EMAIL = 'email',
  PHONE = 'phone',
  CHAT = 'chat',
  PORTAL = 'portal',
  SOCIAL_MEDIA = 'social_media',
}

export enum TicketSatisfactionRating {
  VERY_DISSATISFIED = 1,
  DISSATISFIED = 2,
  NEUTRAL = 3,
  SATISFIED = 4,
  VERY_SATISFIED = 5,
}

@Entity('tickets')
@Index(['tenantId', 'customerId'])
@Index(['tenantId', 'channel'])
@Index(['tenantId', 'slaId'])
export class Ticket extends Issue {
  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({
    type: 'enum',
    enum: TicketChannel,
    default: TicketChannel.PORTAL,
  })
  channel: TicketChannel;

  @Column({ name: 'sla_id', nullable: true })
  slaId: string;

  @Column({ name: 'response_due_at', nullable: true })
  responseDueAt: Date;

  @Column({ name: 'resolution_due_at', nullable: true })
  resolutionDueAt: Date;

  @Column({ name: 'first_response_at', nullable: true })
  firstResponseAt: Date;

  @Column({ name: 'satisfaction_rating', nullable: true })
  satisfactionRating: TicketSatisfactionRating;

  @Column({ name: 'satisfaction_comment', type: 'text', nullable: true })
  satisfactionComment: string;

  @Column({ name: 'is_escalated', default: false })
  isEscalated: boolean;

  @Column({ name: 'escalated_at', nullable: true })
  escalatedAt: Date;

  @Column({ name: 'escalated_to_id', nullable: true })
  escalatedToId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'escalated_to_id' })
  escalatedTo: User;
}
