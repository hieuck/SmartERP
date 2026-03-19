import { Controller, Get, Post, Body, Param, Patch, Delete, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { TenantGuard } from '@common/guards/tenant.guard';
import { WorkCenterService } from './work-center.service';
import { CreateWorkCenterDto } from './dto/create-work-center.dto';
import { UpdateWorkCenterDto } from './dto/update-work-center.dto';
import { Roles } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
@ApiTags('manufacturing-work-centers')
@ApiBearerAuth()
@Controller('manufacturing/work-centers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class WorkCenterController {
  constructor(private readonly workCenterService: WorkCenterService) {}

  @Post()
  @Roles('manager', 'admin', 'production_manager')
  @ApiOperation({ summary: 'Create a new work center' })
  @ApiResponse({ status: 201, description: 'Work center created successfully' })
  async create(@Body() dto: CreateWorkCenterDto, @Request() req) {
    return this.workCenterService.create(req.user.tenantId, dto);
  }

  @Get()
  @Roles('manager', 'admin', 'production_manager', 'production_user')
  @ApiOperation({ summary: 'Get all work centers' })
  @ApiResponse({ status: 200, description: 'Work centers found' })
  async findAll(@Request() req) {
    return this.workCenterService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @Roles('manager', 'admin', 'production_manager', 'production_user')
  @ApiOperation({ summary: 'Get work center by ID' })
  @ApiResponse({ status: 200, description: 'Work center found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.workCenterService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  @Roles('manager', 'admin', 'production_manager')
  @ApiOperation({ summary: 'Update work center' })
  @ApiResponse({ status: 200, description: 'Work center updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateWorkCenterDto, @Request() req) {
    return this.workCenterService.update(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Delete work center' })
  @ApiResponse({ status: 200, description: 'Work center deleted successfully' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.workCenterService.remove(req.user.tenantId, id);
    return { message: 'Work center deleted successfully' };
  }
}
