import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { SubscriptionService } from './subscription.service';
import { OnboardingService } from './onboarding.service';
import { Tenant } from './entities/tenant.entity';
import { User } from '../user/entities/user.entity';
import { CacheModule } from '@/common/cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, User]), CacheModule],
  controllers: [TenantController],
  providers: [TenantService, SubscriptionService, OnboardingService],
  exports: [TenantService, SubscriptionService, OnboardingService],
})
export class TenantModule {}
