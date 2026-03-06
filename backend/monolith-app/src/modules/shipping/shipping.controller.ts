import { Controller, Get, Post, Body, Query, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { ShippingService } from './shipping.service';
import {
  CreateShipmentDto,
  CalculateShippingFeeDto,
  TrackShipmentDto,
  CancelShipmentDto,
} from './dto/create-shipment.dto';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  /**
   * Create shipment
   * POST /shipping/create
   */
  @Post('create')
  async createShipment(
    @Req() req: Request & { tenantId?: string },
    @Body() dto: CreateShipmentDto,
  ) {
    const tenantId = req.tenantId || 'default-tenant';
    return this.shippingService.createShipment(tenantId, dto);
  }

  /**
   * Calculate shipping fee
   * POST /shipping/calculate-fee
   */
  @Post('calculate-fee')
  async calculateFee(
    @Req() req: Request & { tenantId?: string },
    @Body() dto: CalculateShippingFeeDto,
  ) {
    const tenantId = req.tenantId || 'default-tenant';
    return this.shippingService.calculateFee(tenantId, dto);
  }

  /**
   * Track shipment
   * POST /shipping/track
   */
  @Post('track')
  async trackShipment(@Req() req: Request & { tenantId?: string }, @Body() dto: TrackShipmentDto) {
    const tenantId = req.tenantId || 'default-tenant';
    return this.shippingService.trackShipment(tenantId, dto);
  }

  /**
   * Cancel shipment
   * POST /shipping/cancel
   */
  @Post('cancel')
  async cancelShipment(
    @Req() req: Request & { tenantId?: string },
    @Body() dto: CancelShipmentDto,
  ) {
    const tenantId = req.tenantId || 'default-tenant';
    return this.shippingService.cancelShipment(tenantId, dto);
  }

  /**
   * Get shipment
   * GET /shipping/:id
   */
  @Get(':id')
  async getShipment(@Req() req: Request & { tenantId?: string }, @Param('id') id: string) {
    const tenantId = req.tenantId || 'default-tenant';
    return this.shippingService.getShipment(tenantId, id);
  }

  /**
   * List shipments
   * GET /shipping
   */
  @Get()
  async listShipments(
    @Req() req: Request & { tenantId?: string },
    @Query('orderId') orderId?: string,
    @Query('provider') provider?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const tenantId = req.tenantId || 'default-tenant';
    return this.shippingService.listShipments(tenantId, {
      orderId,
      provider,
      status,
      limit,
      offset,
    });
  }
}
