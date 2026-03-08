import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';

// Stub entity - will be properly implemented in Week 51-52
@Entity('users')
export class User extends BaseEntity {
  @Column()
  username: string;

  @Column({ nullable: true })
  email?: string;
}
