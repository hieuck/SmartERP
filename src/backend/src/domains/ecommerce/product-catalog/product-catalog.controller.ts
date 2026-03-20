import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { User } from '@/common/security/permission.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { CacheTTL } from '../../../common/decorators/cache-ttl.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CacheInterceptor } from '../../../common/interceptors/cache.interceptor';
import { CacheTTL as CacheTTLConstant } from '../../../config/cache.config';
import { EcommerceCreateProductDto } from './dto/create-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { EcommerceUpdateProductDto } from './dto/update-product.dto';
import { ProductCatalogService } from './product-catalog.service';

@ApiTags('ecommerce-products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('ecommerce/products')
export class ProductCatalogController {
  constructor(private readonly productCatalogService: ProductCatalogService) {}

  private getAuthenticatedUser(request: { user?: User }): User {
    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    return request.user;
  }

  @Post()
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  async create(@Body() dto: EcommerceCreateProductDto, @Request() req) {
    return this.productCatalogService.create(dto as any, this.getAuthenticatedUser(req));
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CacheTTLConstant.MEDIUM) // 5 minutes
  @ApiOperation({ summary: 'Search products with filters' })
  @ApiResponse({ status: 200, description: 'Products found' })
  async search(@Query() dto: SearchProductDto, @Request() req) {
    return this.productCatalogService.search(dto.search || '', this.getAuthenticatedUser(req));
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CacheTTLConstant.LONG) // 1 hour - products don't change often
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.productCatalogService.findOne(id, this.getAuthenticatedUser(req));
  }

  @Get('sku/:sku')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CacheTTLConstant.LONG) // 1 hour
  @ApiOperation({ summary: 'Get product by SKU' })
  @ApiResponse({ status: 200, description: 'Product found' })
  async findBySku(@Param('sku') sku: string, @Request() req) {
    return this.productCatalogService.findBySku(sku, this.getAuthenticatedUser(req));
  }

  @Get('slug/:slug')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CacheTTLConstant.LONG) // 1 hour
  @ApiOperation({ summary: 'Get product by slug (URL-friendly name)' })
  @ApiResponse({ status: 200, description: 'Product found' })
  async findBySlug(@Param('slug') slug: string, @Request() req) {
    return this.productCatalogService.findBySlug(slug, this.getAuthenticatedUser(req));
  }

  @Patch(':id')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  async update(@Param('id') id: string, @Body() dto: EcommerceUpdateProductDto, @Request() req) {
    return this.productCatalogService.update(id, dto as any, this.getAuthenticatedUser(req));
  }

  @Delete(':id')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.productCatalogService.remove(id, this.getAuthenticatedUser(req));
  }

  @Patch(':id/publish')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Publish product (make visible to customers)' })
  @ApiResponse({ status: 200, description: 'Product published' })
  async publish(@Param('id') id: string, @Request() req) {
    return this.productCatalogService.publish(id, this.getAuthenticatedUser(req));
  }

  @Patch(':id/unpublish')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Unpublish product (hide from customers)' })
  @ApiResponse({ status: 200, description: 'Product unpublished' })
  async unpublish(@Param('id') id: string, @Request() req) {
    return this.productCatalogService.unpublish(id, this.getAuthenticatedUser(req));
  }

  @Patch(':id/stock')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Update product stock quantity' })
  @ApiResponse({ status: 200, description: 'Stock updated' })
  async updateStock(@Param('id') id: string, @Body('quantity') quantity: number, @Request() req) {
    return this.productCatalogService.updateStock(id, quantity, this.getAuthenticatedUser(req));
  }

  @Get('inventory/low-stock')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiResponse({ status: 200, description: 'Low stock products found' })
  async findLowStock(@Request() req) {
    return this.productCatalogService.findLowStock(this.getAuthenticatedUser(req));
  }

  @Get('inventory/out-of-stock')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Get out of stock products' })
  @ApiResponse({ status: 200, description: 'Out of stock products found' })
  async findOutOfStock(@Request() req) {
    return this.productCatalogService.findOutOfStock(this.getAuthenticatedUser(req));
  }
}
