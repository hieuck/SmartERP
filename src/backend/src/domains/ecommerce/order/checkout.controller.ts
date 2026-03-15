import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { CheckoutDto } from './dto/checkout.dto';

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate checkout process' })
  @ApiResponse({ status: 200, description: 'Checkout initiated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async initiateCheckout(@Body() dto: CheckoutDto, @Req() req: any) {
    const _tenantId = req.user?.tenantId || 'default';
    const user = req.user;
    return this.checkoutService.initiateCheckout(dto, user);
  }

  @Post('create-order')
  @ApiOperation({ summary: 'Create order from cart' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async createOrder(@Body() dto: CheckoutDto, @Req() req: any) {
    const _tenantId = req.user?.tenantId || 'default';
    const user = req.user;
    return this.checkoutService.createOrderFromCart(dto, user);
  }
}
