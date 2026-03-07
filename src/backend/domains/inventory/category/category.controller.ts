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
import { TenantGuard } from '../../common/guards/tenant.guard';
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
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() user: User,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.categoryService.create(createCategoryDto, user, req.user?.id);
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
  findByCode(@Param('code') code: string, @CurrentUser() user: User) {
    return this.categoryService.findByCode(code, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.categoryService.findOne(id, user);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get category children' })
  getChildren(@Param('id') id: string, @CurrentUser() user: User) {
    return this.categoryService.findChildren(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser() user: User,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.categoryService.update(id, updateCategoryDto, user, req.user?.id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate category' })
  activate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.categoryService.activate(id, user);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate category' })
  deactivate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.categoryService.deactivate(id, user);
  }

  @Patch(':id/reorder')
  @ApiOperation({ summary: 'Reorder category' })
  reorder(
    @Param('id') id: string,
    @Body() body: { sortOrder: number },
    @CurrentUser() user: User,
  ) {
    return this.categoryService.reorder(id, body.sortOrder, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.categoryService.remove(id, user);
    return { message: 'Category deleted successfully' };
  }
}
