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
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create product' })
  create(
    @CurrentUser() user: User, @Body() createProductDto: CreateProductDto,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.productService.create(user, createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'status', enum: ProductStatus, required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  findAll(
    @CurrentUser() user: User,
    @Query('status') status?: ProductStatus,
    @Query('categoryId') categoryId?: string,
  ) {
    if (status) {
      return this.productService.findByStatus(user, status);
    }
    if (categoryId) {
      return this.productService.findByCategory(user, categoryId);
    }
    return this.productService.findAll(user);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get product count' })
  @ApiQuery({ name: 'status', enum: ProductStatus, required: false })
  count(@CurrentUser() user: User, @Query('status') status?: ProductStatus) {
    if (status) {
      return this.productService.countByStatus(user, status);
    }
    return this.productService.count(user);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiQuery({ name: 'q', required: true })
  search(@CurrentUser() user: User, @Query('q') query: string) {
    return this.productService.search(user, query);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock products' })
  getLowStock(@CurrentUser() user: User) {
    return this.productService.getLowStockProducts(user);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  getFeatured(@CurrentUser() user: User) {
    return this.productService.getFeaturedProducts(user);
  }

  @Get('sku/:sku')
  @ApiOperation({ summary: 'Get product by SKU' })
  findBySku(@CurrentUser() user: User, @Param('sku') sku: string) {
    return this.productService.findBySku(user, sku);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productService.findOne(user, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body() updateProductDto: UpdateProductDto,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.productService.update(user, id, updateProductDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update product' })
  partialUpdate(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body() updateProductDto: UpdateProductDto,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.productService.update(user, id, updateProductDto);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Update product stock' })
  updateStock(
    @Param('id') id: string,
    @Body() body: { quantity: number },
    @CurrentUser() user: User,
  ) {
    return this.productService.updateStock(user, id, body.quantity);
  }

  @Patch(':id/stock/adjust')
  @ApiOperation({ summary: 'Adjust product stock' })
  adjustStock(
    @Param('id') id: string,
    @Body() body: { adjustment: number },
    @CurrentUser() user: User,
  ) {
    return this.productService.adjustStock(user, id, body.adjustment);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate product' })
  activate(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productService.activate(user, id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate product' })
  deactivate(@CurrentUser() user: User, @Param('id') id: string) {
    return this.productService.deactivate(user, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.productService.remove(user, id);
    return { message: 'Product deleted successfully' };
  }
}
