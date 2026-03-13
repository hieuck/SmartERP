import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../core/user/entities/user.entity';
import { ConsentType } from '../enums/consent-type.enum';

@Entity('consents')
export class Consent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: ConsentType })
  type: ConsentType;

  @Column({ default: false })
  granted: boolean;

  @Column({ nullable: true })
  version: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date;

  // Computed property
  get isActive(): boolean {
    return this.granted && !this.revokedAt;
  }
}
