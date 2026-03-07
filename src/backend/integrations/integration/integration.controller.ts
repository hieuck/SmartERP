import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { IntegrationService, IntegrationConfig } from './integration.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

import { User } from '@/common/security/permission.service';
@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get()
  async listIntegrations(@CurrentUser() user: User): Promise<IntegrationConfig[]> {
    return this.integrationService.listIntegrations(user);
  }

  @Get(':name')
  async getIntegration(
    @CurrentUser() user: User,
    @Param('name') name: string,
  ): Promise<IntegrationConfig | undefined> {
    return this.integrationService.getIntegration(user, name);
  }

  @Post()
  async configure(
    @CurrentUser() user: User,
    @Body() integration: IntegrationConfig,
  ): Promise<void> {
    return this.integrationService.configure(user, integration);
  }

  @Delete(':name')
  async removeIntegration(
    @CurrentUser() user: User,
    @Param('name') name: string,
  ): Promise<void> {
    return this.integrationService.removeIntegration(user, name);
  }

  @Post('payment/process')
  async processPayment(
    @CurrentUser() user: User,
    @Body('gateway') gateway: string,
    @Body('amount') amount: number,
    @Body('orderId') orderId: string,
  ): Promise<{
    success: boolean;
    transactionId: string;
    gateway: string;
    amount: number;
    orderId: string;
  }> {
    return this.integrationService.processPayment(user, gateway, amount, orderId);
  }

  @Post('shipments')
  async createShipment(
    @CurrentUser() user: User,
    @Body('provider') provider: string,
    @Body('shipmentData') shipmentData: Record<string, unknown>,
  ): Promise<{
    success: boolean;
    trackingNumber: string;
    provider: string;
    shipmentData: Record<string, unknown>;
  }> {
    return this.integrationService.createShipment(user, provider, shipmentData);
  }
}
