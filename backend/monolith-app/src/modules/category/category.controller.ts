import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create category' })
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @TenantId() tenantId: string,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.categoryService.create(createCategoryDto, tenantId, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  findAll(@TenantId() tenantId: string) {
    return this.categoryService.findAll(tenantId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get category count' })
  count(@TenantId() tenantId: string) {
    return this.categoryService.count(tenantId);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get category tree' })
  getTree(@TenantId() tenantId: string) {
    return this.categoryService.findTree(tenantId);
  }

  @Get('root')
  @ApiOperation({ summary: 'Get root categories' })
  getRootCategories(@TenantId() tenantId: string) {
    return this.categoryService.findRootCategories(tenantId);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get category by code' })
  findByCode(@Param('code') code: string, @TenantId() tenantId: string) {
    return this.categoryService.findByCode(code, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.categoryService.findOne(id, tenantId);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get category children' })
  getChildren(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.categoryService.findChildren(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @TenantId() tenantId: string,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.categoryService.update(id, updateCategoryDto, tenantId, req.user?.id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate category' })
  activate(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.categoryService.activate(id, tenantId);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate category' })
  deactivate(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.categoryService.deactivate(id, tenantId);
  }

  @Patch(':id/reorder')
  @ApiOperation({ summary: 'Reorder category' })
  reorder(
    @Param('id') id: string,
    @Body() body: { sortOrder: number },
    @TenantId() tenantId: string,
  ) {
    return this.categoryService.reorder(id, body.sortOrder, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.categoryService.remove(id, tenantId);
    return { message: 'Category deleted successfully' };
  }
}
