import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '@core/user/entities/user.entity';

@Entity('canned_responses')
@Index(['tenantId', 'isActive'])
export class CannedResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  shortcut: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'usage_count', default: 0 })
  usageCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
