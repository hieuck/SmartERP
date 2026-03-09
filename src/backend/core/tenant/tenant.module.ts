import { CacheModule } from '@/common/cache/cache.module';
import { SecurityModule } from '@/common/security/security.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Tenant } from './entities/tenant.entity';
import { OnboardingService } from './onboarding.service';
import { SubscriptionService } from './subscription.service';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, User]), CacheModule, SecurityModule],
  controllers: [TenantController],
  providers: [TenantService, SubscriptionService, OnboardingService],
  exports: [TenantService, SubscriptionService, OnboardingService],
})
export class TenantModule {}
