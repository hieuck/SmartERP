import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Request,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CacheTTL } from '@/common/decorators/cache-ttl.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { CacheInterceptor } from '@/common/interceptors/cache.interceptor';
import { User } from '@/common/security/permission.service';
import { CacheTTL as CacheTTLConstant } from '@/config/cache.config';
import { AddColumnDto } from './dto/add-column.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { ExecuteReportDto } from './dto/execute-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportService } from './report.service';
import { ReportTemplateService } from './report-template.service';
@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly templateService: ReportTemplateService,
  ) {}

  @Post()
  @Roles('manager', 'admin', 'analyst')
  @ApiOperation({ summary: 'Create new report definition' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  async create(@Body() dto: CreateReportDto, @Request() req) {
    return this.reportService.create(dto, req.user.tenantId, req.user);
  }

  @Get()
  @Roles('manager', 'admin', 'analyst', 'user')
  @ApiOperation({ summary: 'Get all reports for tenant' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async findAll(@Request() req) {
    return this.reportService.findAll(req.user.tenantId);
  }

  @Get('public')
  @Roles('manager', 'admin', 'analyst', 'user')
  @ApiOperation({ summary: 'Get public reports accessible by all users' })
  @ApiResponse({ status: 200, description: 'Public reports retrieved successfully' })
  async findPublic(@Request() req) {
    return this.reportService.findPublic(req.user.tenantId);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CacheTTLConstant.LONG) // 1 hour - report definitions don't change often
  @Roles('manager', 'admin', 'analyst', 'user')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiResponse({ status: 200, description: 'Report found' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.reportService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @Roles('manager', 'admin', 'analyst')
  @ApiOperation({ summary: 'Update report definition' })
  @ApiResponse({ status: 200, description: 'Report updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
    @Request() req,
  ) {
    return this.reportService.update(id, dto, req.user.tenantId, req.user);
  }

  @Delete(':id')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Delete report' })
  @ApiResponse({ status: 200, description: 'Report deleted successfully' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.reportService.remove(id, req.user.tenantId, req.user);
    return { message: 'Report deleted successfully' };
  }

  @Post(':id/columns')
  @Roles('manager', 'admin', 'analyst')
  @ApiOperation({ summary: 'Add column to report' })
  @ApiResponse({ status: 201, description: 'Column added successfully' })
  async addColumn(
    @Param('id') id: string,
    @Body() dto: AddColumnDto,
    @Request() req,
  ) {
    return this.reportService.addColumn(id, dto, req.user.tenantId, req.user);
  }

  @Delete(':id/columns/:columnId')
  @Roles('manager', 'admin', 'analyst')
  @ApiOperation({ summary: 'Remove column from report' })
  @ApiResponse({ status: 200, description: 'Column removed successfully' })
  async removeColumn(
    @Param('id') id: string,
    @Param('columnId') columnId: string,
    @Request() req,
  ) {
    await this.reportService.removeColumn(
      id,
      columnId,
      req.user.tenantId,
      req.user,
    );
    return { message: 'Column removed successfully' };
  }

  @Post(':id/execute')
  @Roles('manager', 'admin', 'analyst', 'user')
  @ApiOperation({ summary: 'Execute report and get results' })
  @ApiResponse({ status: 200, description: 'Report executed successfully' })
  async execute(
    @Param('id') id: string,
    @Body() dto: ExecuteReportDto,
    @Request() req,
  ) {
    return this.reportService.execute(
      id,
      dto.parameters,
      req.user.tenantId,
      req.user,
    );
  }

  @Get(':id/executions')
  @Roles('manager', 'admin', 'analyst')
  @ApiOperation({ summary: 'Get execution history for report' })
  @ApiResponse({ status: 200, description: 'Execution history retrieved' })
  async getExecutionHistory(
    @Param('id') id: string,
    @Query('limit') limit: number = 10,
    @Request() req,
  ) {
    return this.reportService.getExecutionHistory(
      id,
      req.user.tenantId,
      limit,
    );
  }

  @Get('executions/:executionId')
  @Roles('manager', 'admin', 'analyst', 'user')
  @ApiOperation({ summary: 'Get execution result by ID' })
  @ApiResponse({ status: 200, description: 'Execution found' })
  @ApiResponse({ status: 404, description: 'Execution not found' })
  async getExecution(
    @Param('executionId') executionId: string,
    @Request() req,
  ) {
    return this.reportService.getExecution(executionId, req.user.tenantId);
  }

  @Get('templates')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CacheTTLConstant.VERY_LONG) // 24 hours - templates never change
  @Roles('manager', 'admin', 'analyst', 'user')
  @ApiOperation({ summary: 'Get all standard report templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getTemplates() {
    return this.templateService.getStandardTemplates();
  }

  @Get('templates/categories')
  @Roles('manager', 'admin', 'analyst', 'user')
  @ApiOperation({ summary: 'Get all report categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories() {
    return this.templateService.getCategories();
  }

  @Get('templates/category/:category')
  @Roles('manager', 'admin', 'analyst', 'user')
  @ApiOperation({ summary: 'Get templates by category' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getTemplatesByCategory(@Param('category') category: string) {
    return this.templateService.getTemplatesByCategory(category as any);
  }

  @Post('templates/:templateName/create')
  @Roles('manager', 'admin', 'analyst')
  @ApiOperation({ summary: 'Create report from template' })
  @ApiResponse({ status: 201, description: 'Report created from template' })
  async createFromTemplate(
    @Param('templateName') templateName: string,
    @Request() req,
  ) {
    return this.templateService.createFromTemplate(
      templateName,
      req.user.tenantId,
      req.user,
    );
  }
}
