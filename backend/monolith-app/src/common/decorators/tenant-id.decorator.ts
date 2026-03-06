import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * @TenantId() decorator
 * Extracts tenantId from JWT payload in request.user
 * 
 * Security: Ensures tenantId is always present from authenticated JWT
 * 
 * Usage:
 * @Get('products')
 * @UseGuards(JwtAuthGuard)
 * async getProducts(@TenantId() tenantId: string) {
 *   return this.productService.findAll(tenantId);
 * }
 * 
 * @throws UnauthorizedException if tenantId not found in request
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Security: Validate user object exists (from JWT strategy)
    if (!user) {
      throw new UnauthorizedException('Authentication required. User not found in request.');
    }

    // Security: Validate tenantId exists in JWT payload
    if (!user.tenantId) {
      throw new UnauthorizedException('TenantId not found in JWT token. Invalid authentication.');
    }

    return user.tenantId;
  },
);
