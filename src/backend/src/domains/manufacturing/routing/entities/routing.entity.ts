import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BOM } from '../../bom/entities/bom.entity';
import { Operation } from './operation.entity';

@Entity('routings')
@Index(['tenantId', 'bomId'])
export class Routing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column({ name: 'bom_id' })
  bomId: string;

  @ManyToOne(() => BOM)
  @JoinColumn({ name: 'bom_id' })
  bom: BOM;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @OneToMany(() => Operation, operation => operation.routing, { cascade: true, eager: true })
  operations: Operation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
