import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SettingCategory {
  GENERAL = 'general',
  EMAIL = 'email',
  NOTIFICATION = 'notification',
  SECURITY = 'security',
  BACKUP = 'backup',
  INTEGRATION = 'integration',
  PERFORMANCE = 'performance',
}

export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
}

@Entity('system_settings')
@Index(['tenantId', 'key'], { unique: true })
@Index(['tenantId', 'category'])
export class SystemSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ unique: false })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({
    type: 'enum',
    enum: SettingType,
    default: SettingType.STRING,
  })
  type: SettingType;

  @Column({
    type: 'enum',
    enum: SettingCategory,
    default: SettingCategory.GENERAL,
  })
  category: SettingCategory;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  isSecret: boolean;

  @Column({ default: true })
  isEditable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  updatedBy: string;
}
