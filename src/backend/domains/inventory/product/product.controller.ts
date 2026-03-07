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
import { TenantGuard } from '../../common/guards/tenant.guard';
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
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: User,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.productService.create(createProductDto, user, req.user?.id);
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
      return this.productService.findByStatus(status, user);
    }
    if (categoryId) {
      return this.productService.findByCategory(categoryId, user);
    }
    return this.productService.findAll(user);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get product count' })
  @ApiQuery({ name: 'status', enum: ProductStatus, required: false })
  count(@CurrentUser() user: User, @Query('status') status?: ProductStatus) {
    if (status) {
      return this.productService.countByStatus(status, user);
    }
    return this.productService.count(user);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiQuery({ name: 'q', required: true })
  search(@Query('q') query: string, @CurrentUser() user: User) {
    return this.productService.search(query, user);
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
  findBySku(@Param('sku') sku: string, @CurrentUser() user: User) {
    return this.productService.findBySku(sku, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: User,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.productService.update(id, updateProductDto, user, req.user?.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update product' })
  partialUpdate(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: User,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.productService.update(id, updateProductDto, user, req.user?.id);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Update product stock' })
  updateStock(
    @Param('id') id: string,
    @Body() body: { quantity: number },
    @CurrentUser() user: User,
  ) {
    return this.productService.updateStock(id, body.quantity, user);
  }

  @Patch(':id/stock/adjust')
  @ApiOperation({ summary: 'Adjust product stock' })
  adjustStock(
    @Param('id') id: string,
    @Body() body: { adjustment: number },
    @CurrentUser() user: User,
  ) {
    return this.productService.adjustStock(id, body.adjustment, user);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate product' })
  activate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productService.activate(id, user);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate product' })
  deactivate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productService.deactivate(id, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.productService.remove(id, user);
    return { message: 'Product deleted successfully' };
  }
}
