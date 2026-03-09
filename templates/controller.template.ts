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
import { {{EntityName}}Service } from './{{entity-name}}.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
import { Create{{EntityName}}Dto } from './dto/create-{{entity-name}}.dto';
import { Update{{EntityName}}Dto } from './dto/update-{{entity-name}}.dto';

/**
 * {{EntityName}}Controller - Odoo/ERPNext Style Controller
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
 * - Routes: kebab-case (e.g., /api/{{entity-name}}s)
 * - Methods: camelCase (e.g., findAll, findOne, create)
 * - DTOs: PascalCase (e.g., Create{{EntityName}}Dto)
 */
@ApiTags('{{entity-name}}s')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('{{entity-name}}s')
export class {{EntityName}}Controller {
  constructor(private readonly {{entityName}}Service: {{EntityName}}Service) {}

  /**
   * Get all {{entityName}}s with pagination
   * GET /api/{{entity-name}}s?page=1&limit=20
   */
  @Get()
  @ApiOperation({ summary: 'Get all {{entityName}}s' })
  @ApiResponse({ status: 200, description: 'Returns paginated {{entityName}}s' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Tenant isolation' })
  findAll(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.{{entityName}}Service.findAll(user, page, limit);
  }

  /**
   * Get {{entityName}} by ID
   * GET /api/{{entity-name}}s/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get {{entityName}} by ID' })
  @ApiResponse({ status: 200, description: 'Returns {{entityName}}' })
  @ApiResponse({ status: 404, description: '{{EntityName}} not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No read permission' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.{{entityName}}Service.findOne(user, id);
  }

  /**
   * Create new {{entityName}}
   * POST /api/{{entity-name}}s
   */
  @Post()
  @ApiOperation({ summary: 'Create {{entityName}}' })
  @ApiResponse({ status: 201, description: '{{EntityName}} created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  @ApiResponse({ status: 409, description: 'Conflict - Duplicate entry' })
  create(
    @CurrentUser() user: User,
    @Body() create{{EntityName}}Dto: Create{{EntityName}}Dto,
  ) {
    return this.{{entityName}}Service.create(user, create{{EntityName}}Dto);
  }

  /**
   * Update {{entityName}}
   * PATCH /api/{{entity-name}}s/:id
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update {{entityName}}' })
  @ApiResponse({ status: 200, description: '{{EntityName}} updated successfully' })
  @ApiResponse({ status: 404, description: '{{EntityName}} not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No write permission' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() update{{EntityName}}Dto: Update{{EntityName}}Dto,
  ) {
    return this.{{entityName}}Service.update(user, id, update{{EntityName}}Dto);
  }

  /**
   * Delete {{entityName}}
   * DELETE /api/{{entity-name}}s/:id
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete {{entityName}}' })
  @ApiResponse({ status: 200, description: '{{EntityName}} deleted successfully' })
  @ApiResponse({ status: 404, description: '{{EntityName}} not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No delete permission' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.{{entityName}}Service.remove(user, id);
    return { message: '{{EntityName}} deleted successfully' };
  }

  /**
   * Get {{entityName}} count
   * GET /api/{{entity-name}}s/count
   */
  @Get('count')
  @ApiOperation({ summary: 'Get {{entityName}} count' })
  @ApiResponse({ status: 200, description: 'Returns count' })
  count(@CurrentUser() user: User) {
    return this.{{entityName}}Service.count(user);
  }

  // ==========================================
  // CUSTOM ENDPOINTS
  // Add your domain-specific endpoints below
  // ==========================================

  /**
   * Example: Get {{entityName}}s by status
   * GET /api/{{entity-name}}s/status/:status
   */
  @Get('status/:status')
  @ApiOperation({ summary: 'Get {{entityName}}s by status' })
  @ApiResponse({ status: 200, description: 'Returns {{entityName}}s with specified status' })
  findByStatus(@CurrentUser() user: User, @Param('status') status: string) {
    return this.{{entityName}}Service.findByStatus(user, status);
  }

  /**
   * Example: Update {{entityName}} status
   * PATCH /api/{{entity-name}}s/:id/status
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update {{entityName}} status' })
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
    return this.{{entityName}}Service.updateStatus(user, id, status);
  }
}
