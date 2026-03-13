import { TenantStatus } from '../enums/tenant-status.enum';
import { SubscriptionPlan } from '../enums/subscription-plan.enum';
import { BillingCycle } from '../enums/billing-cycle.enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

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

  @Column({ name: 'date_format', default: 'DD/MM/YYYY' })
  dateFormat: string;

  @Column({ name: 'number_format', default: '#,##0.00' })
  numberFormat: string;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 10 })
  taxRate: number;

  // Company Info
  @Column({ name: 'company_name', nullable: true })
  companyName: string;

  @Column({ name: 'company_address', nullable: true })
  companyAddress: string;

  @Column({ name: 'company_phone', nullable: true })
  companyPhone: string;

  @Column({ name: 'company_email', nullable: true })
  companyEmail: string;

  @Column({ name: 'company_tax_code', nullable: true })
  companyTaxCode: string;

  @Column({ name: 'company_website', nullable: true })
  companyWebsite: string;

  // Subscription
  @Column({
    name: 'subscription_plan',
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  subscriptionPlan: SubscriptionPlan;

  @Column({ name: 'subscription_start_date', type: 'timestamp', nullable: true })
  subscriptionStartDate: Date;

  @Column({ name: 'subscription_end_date', type: 'timestamp', nullable: true })
  subscriptionEndDate: Date;

  @Column({ name: 'max_users', type: 'int', default: 5 })
  maxUsers: number;

  @Column({ name: 'max_storage', type: 'bigint', default: 1073741824 }) // 1GB in bytes
  maxStorage: number;

  @Column({ name: 'current_storage', type: 'bigint', default: 0 })
  currentStorage: number;

  @Column({ type: 'simple-array', nullable: true })
  features: string[];

  @Column({
    name: 'billing_cycle',
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @Column({ name: 'subscription_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  subscriptionAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;
}
