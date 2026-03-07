import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductCatalogService } from './product-catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CacheInterceptor } from '../../../common/interceptors/cache.interceptor';
import { CacheTTL } from '../../../common/decorators/cache-ttl.decorator';
import { CacheTTL as CacheTTLConstant } from '../../../config/cache.config';

import { User } from '@/common/security/permission.service';
@ApiTags('ecommerce-products')
@ApiBearerAuth()
@Controller('ecommerce/products')
export class ProductCatalogController {
  constructor(
    private readonly productCatalogService: ProductCatalogService,
  ) {}

  @Post()
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  async create(@Body() dto: CreateProductDto, @Request() req) {
    return this.productCatalogService.create(
      dto,
      req.user.tenantId,
      req.user,
    );
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CacheTTLConstant.MEDIUM) // 5 minutes
  @ApiOperation({ summary: 'Search products with filters' })
  @ApiResponse({ status: 200, description: 'Products found' })
  async search(@Query() dto: SearchProductDto, @Request() req) {
    return this.productCatalogService.search(dto, req.user.tenantId);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CacheTTLConstant.LONG) // 1 hour - products don't change often
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.productCatalogService.findOne(id, req.user.tenantId);
  }

  @Get('sku/:sku')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CacheTTLConstant.LONG) // 1 hour
  @ApiOperation({ summary: 'Get product by SKU' })
  @ApiResponse({ status: 200, description: 'Product found' })
  async findBySku(@Param('sku') sku: string, @Request() req) {
    return this.productCatalogService.findBySku(sku, req.user.tenantId);
  }

  @Get('slug/:slug')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CacheTTLConstant.LONG) // 1 hour
  @ApiOperation({ summary: 'Get product by slug (URL-friendly name)' })
  @ApiResponse({ status: 200, description: 'Product found' })
  async findBySlug(@Param('slug') slug: string, @Request() req) {
    return this.productCatalogService.findBySlug(slug, req.user.tenantId);
  }

  @Patch(':id')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Request() req,
  ) {
    return this.productCatalogService.update(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.productCatalogService.remove(id, req.user.tenantId);
  }

  @Patch(':id/publish')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Publish product (make visible to customers)' })
  @ApiResponse({ status: 200, description: 'Product published' })
  async publish(@Param('id') id: string, @Request() req) {
    return this.productCatalogService.publish(id, req.user.tenantId);
  }

  @Patch(':id/unpublish')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Unpublish product (hide from customers)' })
  @ApiResponse({ status: 200, description: 'Product unpublished' })
  async unpublish(@Param('id') id: string, @Request() req) {
    return this.productCatalogService.unpublish(id, req.user.tenantId);
  }

  @Patch(':id/stock')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Update product stock quantity' })
  @ApiResponse({ status: 200, description: 'Stock updated' })
  async updateStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Request() req,
  ) {
    return this.productCatalogService.updateStock(
      id,
      quantity,
      req.user.tenantId,
    );
  }

  @Get('inventory/low-stock')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiResponse({ status: 200, description: 'Low stock products found' })
  async findLowStock(@Request() req) {
    return this.productCatalogService.findLowStock(req.user.tenantId);
  }

  @Get('inventory/out-of-stock')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Get out of stock products' })
  @ApiResponse({ status: 200, description: 'Out of stock products found' })
  async findOutOfStock(@Request() req) {
    return this.productCatalogService.findOutOfStock(req.user.tenantId);
  }
}
