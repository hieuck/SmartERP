import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
  Query,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { SubscriptionService } from './subscription.service';
import { OnboardingService } from './onboarding.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { TenantStatus } from './entities/tenant.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get tenant by code' })
  findByCode(@Param('code') code: string) {
    return this.tenantService.findByCode(code);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Get users by tenant' })
  getUsersByTenant(@Param('id') id: string) {
    return this.tenantService.getUsersByTenant(id);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Get tenant usage report' })
  getUsageReport(@Param('id') id: string) {
    return this.tenantService.getUsageReport(id);
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
  @Get('subscription/pricing')
  @ApiOperation({ summary: 'Get pricing information for all plans' })
  getPricing() {
    return this.subscriptionService.getPricing();
  }

  @Get(':id/subscription')
  @ApiOperation({ summary: 'Get current subscription details' })
  getSubscription(@Param('id') id: string) {
    return this.subscriptionService.getSubscription(id);
  }

  @Post(':id/subscription/upgrade')
  @ApiOperation({ summary: 'Upgrade or change subscription plan' })
  upgradeSubscription(
    @Param('id') id: string,
    @Body() upgradeDto: UpgradeSubscriptionDto,
    @Request() req: ExpressRequest & { user?: { id: string } },
  ) {
    return this.subscriptionService.upgradeSubscription(id, upgradeDto, req.user?.id);
  }

  @Post(':id/subscription/cancel')
  @ApiOperation({ summary: 'Cancel subscription (downgrade to free)' })
  cancelSubscription(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user?: { id: string } },
  ) {
    return this.subscriptionService.cancelSubscription(id, req.user?.id);
  }

  @Get(':id/subscription/history')
  @ApiOperation({ summary: 'Get subscription history' })
  getSubscriptionHistory(@Param('id') id: string) {
    return this.subscriptionService.getSubscriptionHistory(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tenant' })
  update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @Request() req: ExpressRequest & { user?: { id: string } },
  ) {
    return this.tenantService.update(id, updateTenantDto, req.user?.id);
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend tenant' })
  suspend(@Param('id') id: string, @Request() req: ExpressRequest & { user?: { id: string } }) {
    return this.tenantService.suspend(id, req.user?.id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate tenant' })
  activate(@Param('id') id: string, @Request() req: ExpressRequest & { user?: { id: string } }) {
    return this.tenantService.activate(id, req.user?.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel tenant' })
  cancel(@Param('id') id: string, @Request() req: ExpressRequest & { user?: { id: string } }) {
    return this.tenantService.cancel(id, req.user?.id);
  }

  @Patch(':id/storage')
  @ApiOperation({ summary: 'Update tenant storage usage' })
  updateStorage(@Param('id') id: string, @Body() body: { storageUsed: number }) {
    return this.tenantService.updateStorage(id, body.storageUsed);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tenant' })
  async remove(@Param('id') id: string) {
    await this.tenantService.remove(id);
    return { message: 'Tenant deleted successfully' };
  }
}
