import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Patch,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStatus } from './entities/product.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create product' })
  create(
    @Body() createProductDto: CreateProductDto,
    @TenantId() tenantId: string,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.productService.create(createProductDto, tenantId, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'status', enum: ProductStatus, required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('status') status?: ProductStatus,
    @Query('categoryId') categoryId?: string,
  ) {
    if (status) {
      return this.productService.findByStatus(status, tenantId);
    }
    if (categoryId) {
      return this.productService.findByCategory(categoryId, tenantId);
    }
    return this.productService.findAll(tenantId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get product count' })
  @ApiQuery({ name: 'status', enum: ProductStatus, required: false })
  count(@TenantId() tenantId: string, @Query('status') status?: ProductStatus) {
    if (status) {
      return this.productService.countByStatus(status, tenantId);
    }
    return this.productService.count(tenantId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiQuery({ name: 'q', required: true })
  search(@Query('q') query: string, @TenantId() tenantId: string) {
    return this.productService.search(query, tenantId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock products' })
  getLowStock(@TenantId() tenantId: string) {
    return this.productService.getLowStockProducts(tenantId);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  getFeatured(@TenantId() tenantId: string) {
    return this.productService.getFeaturedProducts(tenantId);
  }

  @Get('sku/:sku')
  @ApiOperation({ summary: 'Get product by SKU' })
  findBySku(@Param('sku') sku: string, @TenantId() tenantId: string) {
    return this.productService.findBySku(sku, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productService.findOne(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @TenantId() tenantId: string,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.productService.update(id, updateProductDto, tenantId, req.user?.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update product' })
  partialUpdate(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @TenantId() tenantId: string,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.productService.update(id, updateProductDto, tenantId, req.user?.id);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Update product stock' })
  updateStock(
    @Param('id') id: string,
    @Body() body: { quantity: number },
    @TenantId() tenantId: string,
  ) {
    return this.productService.updateStock(id, body.quantity, tenantId);
  }

  @Patch(':id/stock/adjust')
  @ApiOperation({ summary: 'Adjust product stock' })
  adjustStock(
    @Param('id') id: string,
    @Body() body: { adjustment: number },
    @TenantId() tenantId: string,
  ) {
    return this.productService.adjustStock(id, body.adjustment, tenantId);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate product' })
  activate(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productService.activate(id, tenantId);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate product' })
  deactivate(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productService.deactivate(id, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.productService.remove(id, tenantId);
    return { message: 'Product deleted successfully' };
  }
}
