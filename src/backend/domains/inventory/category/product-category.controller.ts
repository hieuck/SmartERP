import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { User } from '@/common/security/permission.service';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoryService } from './product-category.service';

@ApiTags('product-categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('product-categories')
export class ProductCategoryController {
  constructor(private readonly categoryService: ProductCategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create product category' })
  create(@CurrentUser() user: User, @Body() createDto: CreateProductCategoryDto) {
    return this.categoryService.create(user, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product categories' })
  findAll(@CurrentUser() user: User, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.categoryService.findAll(user, page, limit);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active categories' })
  findActive(@CurrentUser() user: User) {
    return this.categoryService.findActive(user);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get category count' })
  count(@CurrentUser() user: User) {
    return this.categoryService.count(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.categoryService.findOne(user, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateDto: UpdateProductCategoryDto,
  ) {
    return this.categoryService.update(user, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.categoryService.remove(user, id);
    return { message: 'Category deleted successfully' };
  }
}
