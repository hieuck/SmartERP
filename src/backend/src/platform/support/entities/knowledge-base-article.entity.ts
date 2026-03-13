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
import { ArticleStatus } from '@platform/support/enums/article-status.enum';


@Entity('knowledge_base_articles')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'categoryId'])
export class KnowledgeBaseArticle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({
    type: 'enum',
    enum: ArticleStatus,
    default: ArticleStatus.DRAFT,
  })
  status: ArticleStatus;

  @Column({ name: 'author_id' })
  authorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'helpful_count', default: 0 })
  helpfulCount: number;

  @Column({ name: 'not_helpful_count', default: 0 })
  notHelpfulCount: number;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'published_at', nullable: true })
  publishedAt: Date;
}
