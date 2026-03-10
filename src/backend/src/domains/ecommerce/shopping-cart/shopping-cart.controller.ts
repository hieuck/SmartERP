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
    return this.shoppingCartService.getOrCreateCart(
      req.user,
      sessionId,
    );
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  async addItem(@Body() dto: AddToCartDto, @Request() req) {
    const sessionId = req.sessionID || req.user?.id || 'guest';
    return this.shoppingCartService.addItem(
      req.user,
      sessionId,
      dto,
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
    const cart = await this.shoppingCartService.getOrCreateCart(req.user, sessionId);
    return this.shoppingCartService.updateItemQuantity(
      req.user,
      cart.id,
      itemId,
      dto.quantity,
    );
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed from cart' })
  async removeItem(@Param('itemId') itemId: string, @Request() req) {
    const sessionId = req.sessionID || req.user?.id || 'guest';
    const cart = await this.shoppingCartService.getOrCreateCart(req.user, sessionId);
    return this.shoppingCartService.removeItem(
      req.user,
      cart.id,
      itemId,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all items from cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  async clearCart(@Request() req) {
    const sessionId = req.sessionID || req.user?.id || 'guest';
    const cart = await this.shoppingCartService.getOrCreateCart(req.user, sessionId);
    return this.shoppingCartService.clearCart(req.user, cart.id);
  }

  @Post('coupon')
  @ApiOperation({ summary: 'Apply coupon code to cart' })
  @ApiResponse({ status: 200, description: 'Coupon applied' })
  async applyCoupon(@Body() dto: ApplyCouponDto, @Request() req) {
    const sessionId = req.sessionID || req.user?.id || 'guest';
    const cart = await this.shoppingCartService.getOrCreateCart(req.user, sessionId);
    return this.shoppingCartService.applyCoupon(
      req.user,
      cart.id,
      dto.couponCode,
    );
  }

  @Delete('coupon')
  @ApiOperation({ summary: 'Remove coupon from cart' })
  @ApiResponse({ status: 200, description: 'Coupon removed' })
  async removeCoupon(@Request() req) {
    const sessionId = req.sessionID || req.user?.id || 'guest';
    const cart = await this.shoppingCartService.getOrCreateCart(req.user, sessionId);
    return this.shoppingCartService.removeCoupon(req.user, cart.id);
  }

  @Patch('shipping-address')
  @ApiOperation({ summary: 'Update shipping address' })
  @ApiResponse({ status: 200, description: 'Shipping address updated' })
  async updateShippingAddress(@Body() dto: UpdateAddressDto, @Request() req) {
    const sessionId = req.sessionID || req.user?.id || 'guest';
    const cart = await this.shoppingCartService.getOrCreateCart(req.user, sessionId);
    return this.shoppingCartService.updateShippingAddress(
      req.user,
      cart.id,
      dto.address,
    );
  }

  @Patch('billing-address')
  @ApiOperation({ summary: 'Update billing address' })
  @ApiResponse({ status: 200, description: 'Billing address updated' })
  async updateBillingAddress(@Body() dto: UpdateAddressDto, @Request() req) {
    const sessionId = req.sessionID || req.user?.id || 'guest';
    const cart = await this.shoppingCartService.getOrCreateCart(req.user, sessionId);
    return this.shoppingCartService.updateBillingAddress(
      req.user,
      cart.id,
      dto.address,
    );
  }
}
