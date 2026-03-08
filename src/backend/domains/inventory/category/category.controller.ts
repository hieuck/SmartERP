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
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create category' })
  create(
    @CurrentUser() user: User, @Body() createCategoryDto: CreateCategoryDto,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.categoryService.create(user, createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  findAll(@CurrentUser() user: User) {
    return this.categoryService.findAll(user);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get category count' })
  count(@CurrentUser() user: User) {
    return this.categoryService.count(user);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get category tree' })
  getTree(@CurrentUser() user: User) {
    return this.categoryService.findTree(user);
  }

  @Get('root')
  @ApiOperation({ summary: 'Get root categories' })
  getRootCategories(@CurrentUser() user: User) {
    return this.categoryService.findRootCategories(user);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get category by code' })
  findByCode(@CurrentUser() user: User, @Param('code') code: string) {
    return this.categoryService.findByCode(user, code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.categoryService.findOne(user, id);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get category children' })
  getChildren(@CurrentUser() user: User, @Param('id') id: string) {
    return this.categoryService.findChildren(user, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body() updateCategoryDto: UpdateCategoryDto,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.categoryService.update(user, id, updateCategoryDto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate category' })
  activate(@CurrentUser() user: User, @Param('id') id: string) {
    return this.categoryService.activate(user, id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate category' })
  deactivate(@CurrentUser() user: User, @Param('id') id: string) {
    return this.categoryService.deactivate(user, id);
  }

  @Patch(':id/reorder')
  @ApiOperation({ summary: 'Reorder category' })
  reorder(
    @Param('id') id: string,
    @Body() body: { sortOrder: number },
    @CurrentUser() user: User,
  ) {
    return this.categoryService.reorder(user, id, body.sortOrder);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.categoryService.remove(user, id);
    return { message: 'Category deleted successfully' };
  }
}
