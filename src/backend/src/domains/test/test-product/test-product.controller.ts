import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TestProductService } from './test-product.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
import { CreateTestProductDto } from './dto/create-test-product.dto';
import { UpdateTestProductDto } from './dto/update-test-product.dto';

/**
 * TestProductController - Odoo/ERPNext Style Controller
 * 
 * ARCHITECTURE PRINCIPLES:
 * - RESTful API design
 * - JWT authentication required
 * - Tenant isolation enforced
 * - Swagger documentation
 * - Consistent response format
 * 
 * SECURITY CHECKLIST:
 * ✅ @UseGuards(JwtAuthGuard, TenantGuard) - Authentication & tenant isolation
 * ✅ @CurrentUser() decorator - Extract user from JWT
 * ✅ @ApiBearerAuth() - Swagger auth documentation
 * ✅ User passed to service methods - For permission checks
 * 
 * NAMING CONVENTIONS:
 * - Routes: kebab-case (e.g., /api/test-products)
 * - Methods: camelCase (e.g., findAll, findOne, create)
 * - DTOs: PascalCase (e.g., CreateTestProductDto)
 */
@ApiTags('test-products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('test-products')
export class TestProductController {
  constructor(private readonly TestProductService: TestProductService) {}

  /**
   * Get all TestProducts with pagination
   * GET /api/test-products?page=1&limit=20
   */
  @Get()
  @ApiOperation({ summary: 'Get all TestProducts' })
  @ApiResponse({ status: 200, description: 'Returns paginated TestProducts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Tenant isolation' })
  findAll(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.TestProductService.findAll(user, page, limit);
  }

  /**
   * Get TestProduct by ID
   * GET /api/test-products/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get TestProduct by ID' })
  @ApiResponse({ status: 200, description: 'Returns TestProduct' })
  @ApiResponse({ status: 404, description: 'TestProduct not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No read permission' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.TestProductService.findOne(user, id);
  }

  /**
   * Create new TestProduct
   * POST /api/test-products
   */
  @Post()
  @ApiOperation({ summary: 'Create TestProduct' })
  @ApiResponse({ status: 201, description: 'TestProduct created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  @ApiResponse({ status: 409, description: 'Conflict - Duplicate entry' })
  create(
    @CurrentUser() user: User,
    @Body() createTestProductDto: CreateTestProductDto,
  ) {
    return this.TestProductService.create(user, createTestProductDto);
  }

  /**
   * Update TestProduct
   * PATCH /api/test-products/:id
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update TestProduct' })
  @ApiResponse({ status: 200, description: 'TestProduct updated successfully' })
  @ApiResponse({ status: 404, description: 'TestProduct not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No write permission' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateTestProductDto: UpdateTestProductDto,
  ) {
    return this.TestProductService.update(user, id, updateTestProductDto);
  }

  /**
   * Delete TestProduct
   * DELETE /api/test-products/:id
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete TestProduct' })
  @ApiResponse({ status: 200, description: 'TestProduct deleted successfully' })
  @ApiResponse({ status: 404, description: 'TestProduct not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No delete permission' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.TestProductService.remove(user, id);
    return { message: 'TestProduct deleted successfully' };
  }

  /**
   * Get TestProduct count
   * GET /api/test-products/count
   */
  @Get('count')
  @ApiOperation({ summary: 'Get TestProduct count' })
  @ApiResponse({ status: 200, description: 'Returns count' })
  count(@CurrentUser() user: User) {
    return this.TestProductService.count(user);
  }

  // ==========================================
  // CUSTOM ENDPOINTS
  // Add your domain-specific endpoints below
  // ==========================================

  /**
   * Example: Get TestProducts by status
   * GET /api/test-products/status/:status
   */
  @Get('status/:status')
  @ApiOperation({ summary: 'Get TestProducts by status' })
  @ApiResponse({ status: 200, description: 'Returns TestProducts with specified status' })
  findByStatus(@CurrentUser() user: User, @Param('status') status: string) {
    return this.TestProductService.findByStatus(user, status);
  }

  /**
   * Example: Update TestProduct status
   * PATCH /api/test-products/:id/status
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update TestProduct status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  updateStatus(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    if (!status) {
      throw new BadRequestException('Status is required');
    }
    return this.TestProductService.updateStatus(user, id, status);
  }
}
