import { User } from '@/common/security/permission.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';
import { TenantStatus } from './entities/tenant.entity';
import { OnboardingService } from './onboarding.service';
import { SubscriptionService } from './subscription.service';
import { TenantService } from './tenant.service';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly subscriptionService: SubscriptionService,
    private readonly onboardingService: OnboardingService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create tenant' })
  create(
    @Body() createTenantDto: CreateTenantDto,
    @Request() req: ExpressRequest & { user?: { id: string } },
  ) {
    return this.tenantService.create(createTenantDto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  findAll(@Query('status') status?: TenantStatus) {
    if (status) {
      return this.tenantService.findByStatus(status);
    }
    return this.tenantService.findAll();
  }

  @Get('count')
  @ApiOperation({ summary: 'Get tenant count' })
  count() {
    return this.tenantService.count();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  findOne(@CurrentUser() user: User) {
    return this.tenantService.findOne(user);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get tenant by code' })
  findByCode(@Param('code') code: string) {
    return this.tenantService.findByCode(code);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Get users by tenant' })
  getUsersByTenant(@CurrentUser() user: User) {
    return this.tenantService.getUsersByTenant(user.tenantId);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Get tenant usage report' })
  getUsageReport(@CurrentUser() user: User) {
    return this.tenantService.getUsageReport(user);
  }

  // Onboarding Endpoints
  @Get(':id/onboarding/status')
  @ApiOperation({ summary: 'Get onboarding status' })
  getOnboardingStatus(@Param('id') id: string) {
    return this.onboardingService.getOnboardingStatus(id);
  }

  @Post(':id/onboarding/complete')
  @ApiOperation({ summary: 'Complete onboarding process' })
  completeOnboarding(
    @Param('id') id: string,
    @Body() dto: CompleteOnboardingDto,
    @Request() req: ExpressRequest & { user?: { id: string } },
  ) {
    return this.onboardingService.completeOnboarding(id, dto, req.user?.id);
  }

  @Post(':id/onboarding/skip')
  @ApiOperation({ summary: 'Skip onboarding' })
  skipOnboarding(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user?: { id: string } },
  ) {
    return this.onboardingService.skipOnboarding(id, req.user?.id);
  }

  @Post(':id/onboarding/invite')
  @ApiOperation({ summary: 'Invite team member' })
  inviteTeamMember(
    @Param('id') id: string,
    @Body() body: { email: string },
    @Request() req: ExpressRequest & { user?: { id: string } },
  ) {
    return this.onboardingService.inviteTeamMember(id, body.email, req.user?.id);
  }

  // Subscription Management Endpoints
  @Public()
  @Get('subscription/pricing')
  @ApiOperation({ summary: 'Get pricing information for all plans' })
  getPricing() {
    return this.subscriptionService.getPricing();
  }

  @Get(':id/subscription')
  @ApiOperation({ summary: 'Get current subscription details' })
  getSubscription(@CurrentUser() user: User) {
    return this.subscriptionService.getSubscription(user);
  }

  @Post(':id/subscription/upgrade')
  @ApiOperation({ summary: 'Upgrade or change subscription plan' })
  upgradeSubscription(@CurrentUser() user: User, @Body() upgradeDto: UpgradeSubscriptionDto) {
    return this.subscriptionService.upgradeSubscription(user, upgradeDto);
  }

  @Post(':id/subscription/cancel')
  @ApiOperation({ summary: 'Cancel subscription (downgrade to free)' })
  cancelSubscription(@CurrentUser() user: User) {
    return this.subscriptionService.cancelSubscription(user);
  }

  @Get(':id/subscription/history')
  @ApiOperation({ summary: 'Get subscription history' })
  getSubscriptionHistory(@CurrentUser() user: User) {
    return this.subscriptionService.getSubscriptionHistory(user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tenant' })
  update(@CurrentUser() user: User, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantService.update(user, updateTenantDto);
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend tenant' })
  suspend(@CurrentUser() user: User) {
    return this.tenantService.suspend(user);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate tenant' })
  activate(@CurrentUser() user: User) {
    return this.tenantService.activate(user);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel tenant' })
  cancel(@CurrentUser() user: User) {
    return this.tenantService.cancel(user);
  }

  @Patch(':id/storage')
  @ApiOperation({ summary: 'Update tenant storage usage' })
  updateStorage(@CurrentUser() user: User, @Body() body: { storageUsed: number }) {
    return this.tenantService.updateStorage(user, body.storageUsed);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tenant' })
  async remove(@CurrentUser() user: User) {
    await this.tenantService.remove(user);
    return { message: 'Tenant deleted successfully' };
  }
}
