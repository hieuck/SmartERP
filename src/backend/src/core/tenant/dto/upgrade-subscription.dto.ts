import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BillingCycle } from '../enums/billing-cycle.enum';
import { SubscriptionPlan } from '../enums/subscription-plan.enum';

export class UpgradeSubscriptionDto {
  @ApiProperty({
    description: 'Subscription plan',
    enum: SubscriptionPlan,
    example: SubscriptionPlan.PRO,
  })
  @IsNotEmpty()
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({
    description: 'Billing cycle',
    enum: BillingCycle,
    example: BillingCycle.MONTHLY,
  })
  @IsNotEmpty()
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiProperty({
    description: 'Payment method ID (from payment gateway)',
    example: 'pm_1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
