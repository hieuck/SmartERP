import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('settings')
@Index(['tenantId', 'key'], { unique: true })
@Index(['tenantId', 'category'])
export class Setting extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: false })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'varchar', length: 20, name: 'data_type', default: 'STRING' })
  dataType: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', name: 'is_public', default: false })
  isPublic: boolean;
}
