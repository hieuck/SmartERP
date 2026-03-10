import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';

// Stub entity - will be properly implemented in Week 51-52
@Entity('employees')
export class Employee extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;
}
