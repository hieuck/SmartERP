import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project, ProjectStatus } from './entities/project.entity';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';

import { User } from '@/common/security/permission.service';
@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @Roles('admin', 'manager', 'project_manager')
  @ApiOperation({ summary: 'Create new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully', type: Project })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() dto: CreateProjectDto, @Request() req): Promise<Project> {
    return this.projectService.create(dto, req.user.tenantId, req.user);
  }

  @Get()
  @Roles('admin', 'manager', 'project_manager', 'user')
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully', type: [Project] })
  async findAll(
    @Request() req,
    @Query('status') status?: ProjectStatus,
    @Query('projectManagerId') projectManagerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Project[]> {
    return this.projectService.findAll(req.user.tenantId, {
      status,
      projectManagerId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('statistics')
  @Roles('admin', 'manager', 'project_manager')
  @ApiOperation({ summary: 'Get project statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalBudget: number;
    totalActualCost: number;
    averageProgress: number;
    projectsByStatus: Record<ProjectStatus, number>;
  }> {
    return this.projectService.getStatistics(
      req.user.tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  @Roles('admin', 'manager', 'project_manager', 'user')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully', type: Project })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id') id: string, @Request() req): Promise<Project> {
    return this.projectService.findOne(id, req.user.tenantId);
  }

  @Get('code/:code')
  @Roles('admin', 'manager', 'project_manager', 'user')
  @ApiOperation({ summary: 'Get project by code' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully', type: Project })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findByCode(@Param('code') code: string, @Request() req): Promise<Project> {
    return this.projectService.findByCode(code, req.user.tenantId);
  }

  @Put(':id')
  @Roles('admin', 'manager', 'project_manager')
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully', type: Project })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Request() req,
  ): Promise<Project> {
    return this.projectService.update(id, dto, req.user.tenantId, req.user);
  }

  @Put(':id/status')
  @Roles('admin', 'manager', 'project_manager')
  @ApiOperation({ summary: 'Update project status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully', type: Project })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProjectStatus,
    @Request() req,
  ): Promise<Project> {
    return this.projectService.updateStatus(id, status, req.user.tenantId, req.user);
  }

  @Put(':id/progress')
  @Roles('admin', 'manager', 'project_manager')
  @ApiOperation({ summary: 'Update project progress' })
  @ApiResponse({ status: 200, description: 'Progress updated successfully', type: Project })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async updateProgress(
    @Param('id') id: string,
    @Body('progress') progress: number,
    @Request() req,
  ): Promise<Project> {
    return this.projectService.updateProgress(id, progress, req.user.tenantId, req.user);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Delete project (soft delete)' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.projectService.remove(id, req.user.tenantId, req.user);
  }
}
