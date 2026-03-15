import { Controller, Get, Post, Body, Query, Param, Req } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
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
   * POST /shipping
   */
  @Post()
  async createShipment(
    @CurrentUser() user: User,
    @Req() req: Request & { tenantId?: string },
    @Body() dto: CreateShipmentDto,
  ) {
    return this.shippingService.createShipment(user, dto);
  }

  /**
   * Calculate shipping fee
   * POST /shipping/calculate-fee
   */
  @Post('calculate-fee')
  async calculateFee(
    @CurrentUser() user: User,
    @Req() req: Request & { tenantId?: string },
    @Body() dto: CalculateShippingFeeDto,
  ) {
    return this.shippingService.calculateFee(user, dto);
  }

  /**
   * Track shipment
   * POST /shipping/track
   */
  @Post('track')
  async trackShipment(
    @CurrentUser() user: User,
    @Req() req: Request & { tenantId?: string },
    @Body() dto: TrackShipmentDto,
  ) {
    return this.shippingService.trackShipment(user, dto);
  }

  /**
   * Cancel shipment
   * POST /shipping/cancel
   */
  @Post('cancel')
  async cancelShipment(
    @CurrentUser() user: User,
    @Req() req: Request & { tenantId?: string },
    @Body() dto: CancelShipmentDto,
  ) {
    return this.shippingService.cancelShipment(user, dto);
  }

  /**
   * Get shipment
   * GET /shipping/:id
   */
  @Get(':id')
  async getShipment(
    @CurrentUser() user: User,
    @Req() req: Request & { tenantId?: string },
    @Param('id') id: string,
  ) {
    return this.shippingService.getShipment(user, id);
  }

  /**
   * List shipments
   * GET /shipping
   */
  @Get()
  async listShipments(
    @CurrentUser() user: User,
    @Req() req: Request & { tenantId?: string },
    @Query('orderId') orderId?: string,
    @Query('provider') provider?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.shippingService.listShipments(user, {
      orderId,
      provider,
      status,
      limit,
      offset,
    });
  }
}
