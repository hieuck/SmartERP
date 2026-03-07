import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ShoppingCartService } from './shopping-cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';

import { User } from '@/common/security/permission.service';
@ApiTags('ecommerce-cart')
@ApiBearerAuth()
@Controller('ecommerce/cart')
export class ShoppingCartController {
  constructor(private readonly shoppingCartService: ShoppingCartService) {}

  @Get()
  @ApiOperation({ summary: 'Get or create cart for current user/session' })
  @ApiResponse({ status: 200, description: 'Cart retrieved' })
  async getCart(@Request() req) {
    const sessionId = req.sessionID || req.user?.id || 'guest';
    const userId = req.user?.id;
    return this.shoppingCartService.getOrCreateCart(
      sessionId,
      req.user.tenantId,
      userId,
    );
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  async addItem(@Body() dto: AddToCartDto, @Request() req) {
    const sessionId = req.sessionID || req.user?.id || 'guest';
    const userId = req.user?.id;
    return this.shoppingCartService.addItem(
      sessionId,
      dto,
      req.user.tenantId,
      userId,
    );
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Cart item updated' })
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Request() req,
  ) {
    const sessionId = req.sessionID || req.user?.id || 'guest';
    return this.shoppingCartService.updateItemQuantity(
      sessionId,
      itemId,
      dto.quantity,
      req.user.tenantId,
    );
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed from cart' })
  async removeItem(@Param('itemId') itemId: string, @Request() req) {
    const sessionId = req.sessionID || req.user?.id || 'guest';
    return this.shoppingCartService.removeItem(
      sessionId,
      itemId,
      req.user.tenantId,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all items from cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  async clearCart(@Request() req) {
    const sessionId = req.sessionID || req.user?.id || 'guest';
    return this.shoppingCartService.clearCart(sessionId, req.user.tenantId);
  }

  @Post('coupon')
  @ApiOperation({ summary: 'Apply coupon code to cart' })
  @ApiResponse({ status: 200, description: 'Coupon applied' })
  async applyCoupon(@Body() dto: ApplyCouponDto, @Request() req) {
    const sessionId = req.sessionID || req.user?.id || 'guest';
    return this.shoppingCartService.applyCoupon(
      sessionId,
      dto.couponCode,
      req.user.tenantId,
    );
  }

  @Delete('coupon')
  @ApiOperation({ summary: 'Remove coupon from cart' })
  @ApiResponse({ status: 200, description: 'Coupon removed' })
  async removeCoupon(@Request() req) {
    const sessionId = req.sessionID || req.user?.id || 'guest';
    return this.shoppingCartService.removeCoupon(
      sessionId,
      req.user.tenantId,
    );
  }

  @Patch('shipping-address')
  @ApiOperation({ summary: 'Update shipping address' })
  @ApiResponse({ status: 200, description: 'Shipping address updated' })
  async updateShippingAddress(@Body() dto: UpdateAddressDto, @Request() req) {
    const sessionId = req.sessionID || req.user?.id || 'guest';
    return this.shoppingCartService.updateShippingAddress(
      sessionId,
      dto.address,
      req.user.tenantId,
    );
  }

  @Patch('billing-address')
  @ApiOperation({ summary: 'Update billing address' })
  @ApiResponse({ status: 200, description: 'Billing address updated' })
  async updateBillingAddress(@Body() dto: UpdateAddressDto, @Request() req) {
    const sessionId = req.sessionID || req.user?.id || 'guest';
    return this.shoppingCartService.updateBillingAddress(
      sessionId,
      dto.address,
      req.user.tenantId,
    );
  }
}
