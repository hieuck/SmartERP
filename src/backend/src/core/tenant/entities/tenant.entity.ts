import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ nullable: true })
  logo: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  // Settings
  @Column({ default: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  @Column({ default: 'VND' })
  currency: string;

  @Column({ default: 'vi' })
  language: string;

  @Column({ default: 'DD/MM/YYYY' })
  dateFormat: string;

  @Column({ default: '#,##0.00' })
  numberFormat: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  taxRate: number;

  // Company Info
  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  companyAddress: string;

  @Column({ nullable: true })
  companyPhone: string;

  @Column({ nullable: true })
  companyEmail: string;

  @Column({ nullable: true })
  companyTaxCode: string;

  @Column({ nullable: true })
  companyWebsite: string;

  // Subscription
  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  subscriptionPlan: SubscriptionPlan;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionStartDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionEndDate: Date;

  @Column({ type: 'int', default: 5 })
  maxUsers: number;

  @Column({ type: 'bigint', default: 1073741824 }) // 1GB in bytes
  maxStorage: number;

  @Column({ type: 'bigint', default: 0 })
  currentStorage: number;

  @Column({ type: 'simple-array', nullable: true })
  features: string[];

  @Column({
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subscriptionAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;
}
