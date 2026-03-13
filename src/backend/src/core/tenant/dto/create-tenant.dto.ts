import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { BillingCycle } from '../enums/billing-cycle.enum';
import { SubscriptionPlan } from '../enums/subscription-plan.enum';
import { TenantStatus } from '../enums/tenant-status.enum';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ACME-001', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'acme.smart-erp.com', required: false })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ enum: TenantStatus, default: TenantStatus.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  // Settings
  @ApiProperty({ example: 'Asia/Ho_Chi_Minh', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: 'VND', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 'vi', required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ example: 'DD/MM/YYYY', required: false })
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiProperty({ example: '#,##0.00', required: false })
  @IsOptional()
  @IsString()
  numberFormat?: string;

  @ApiProperty({ example: 10, minimum: 0, maximum: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  // Company Info
  @ApiProperty({ example: 'Acme Corporation Ltd.', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ example: '123 Main St, City, Country', required: false })
  @IsOptional()
  @IsString()
  companyAddress?: string;

  @ApiProperty({ example: '+84 123 456 789', required: false })
  @IsOptional()
  @IsString()
  companyPhone?: string;

  @ApiProperty({ example: 'contact@acme.com', required: false })
  @IsOptional()
  @IsString()
  companyEmail?: string;

  @ApiProperty({ example: '0123456789', required: false })
  @IsOptional()
  @IsString()
  companyTaxCode?: string;

  @ApiProperty({ example: 'https://acme.com', required: false })
  @IsOptional()
  @IsString()
  companyWebsite?: string;

  // Subscription
  @ApiProperty({ enum: SubscriptionPlan, default: SubscriptionPlan.FREE, required: false })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  subscriptionPlan?: SubscriptionPlan;

  @ApiProperty({ example: 5, minimum: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsers?: number;

  @ApiProperty({ example: 1073741824, minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStorage?: number;

  @ApiProperty({ example: ['inventory', 'crm', 'accounting'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({ enum: BillingCycle, default: BillingCycle.MONTHLY, required: false })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiProperty({ example: 0, minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  subscriptionAmount?: number;
}
