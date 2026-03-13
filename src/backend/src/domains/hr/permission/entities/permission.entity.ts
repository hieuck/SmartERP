import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  Index,
  ManyToMany,
} from 'typeorm';
import { Role } from '../../role/entities/role.entity';

@Entity('permissions')
@Index(['tenantId', 'resource', 'action'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column()
  resource: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: false, name: 'is_system' })
  isSystem: boolean;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles?: Role[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;
}
