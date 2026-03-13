import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AccountType } from '../enums/account-type.enum';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('accounts')
@Index(['tenantId', 'code'], { unique: true })
export class Account extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  type: AccountType;

  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Account;

  @Column({ type: 'uuid', nullable: true, name: 'parent_id' })
  parentId?: string;

  @Column({ type: 'boolean', default: false })
  isGroup: boolean; // Group account (has children)

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Deprecated: Use isActive instead
  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;
}
