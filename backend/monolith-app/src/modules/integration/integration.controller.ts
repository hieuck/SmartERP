import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { IntegrationService, IntegrationConfig } from './integration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get()
  async listIntegrations(@TenantId() tenantId: string): Promise<IntegrationConfig[]> {
    return this.integrationService.listIntegrations(tenantId);
  }

  @Get(':name')
  async getIntegration(
    @TenantId() tenantId: string,
    @Param('name') name: string,
  ): Promise<IntegrationConfig | undefined> {
    return this.integrationService.getIntegration(tenantId, name);
  }

  @Post()
  async configure(
    @TenantId() tenantId: string,
    @Body() integration: IntegrationConfig,
  ): Promise<void> {
    return this.integrationService.configure(tenantId, integration);
  }

  @Delete(':name')
  async removeIntegration(
    @TenantId() tenantId: string,
    @Param('name') name: string,
  ): Promise<void> {
    return this.integrationService.removeIntegration(tenantId, name);
  }

  @Post('payment/process')
  async processPayment(
    @TenantId() tenantId: string,
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
    return this.integrationService.processPayment(tenantId, gateway, amount, orderId);
  }

  @Post('shipments')
  async createShipment(
    @TenantId() tenantId: string,
    @Body('provider') provider: string,
    @Body('shipmentData') shipmentData: Record<string, unknown>,
  ): Promise<{
    success: boolean;
    trackingNumber: string;
    provider: string;
    shipmentData: Record<string, unknown>;
  }> {
    return this.integrationService.createShipment(tenantId, provider, shipmentData);
  }
}
