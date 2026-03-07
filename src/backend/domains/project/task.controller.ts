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
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskDependencyDto } from './dto/create-task-dependency.dto';
import { Task, TaskStatus } from './entities/task.entity';
import { TaskDependency } from './entities/task-dependency.entity';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';

import { User } from '@/common/security/permission.service';
@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @Roles('admin', 'manager', 'project_manager')
  @ApiOperation({ summary: 'Create new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully', type: Task })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() dto: CreateTaskDto, @Request() req): Promise<Task> {
    return this.taskService.create(dto, req.user.tenantId, req.user);
  }

  @Get()
  @Roles('admin', 'manager', 'project_manager', 'user')
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully', type: [Task] })
  async findAll(
    @Request() req,
    @Query('projectId') projectId?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('status') status?: TaskStatus,
    @Query('parentTaskId') parentTaskId?: string,
  ): Promise<Task[]> {
    return this.taskService.findAll(req.user.tenantId, {
      projectId,
      assigneeId,
      status,
      parentTaskId,
    });
  }

  @Get(':id')
  @Roles('admin', 'manager', 'project_manager', 'user')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully', type: Task })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(@Param('id') id: string, @Request() req): Promise<Task> {
    return this.taskService.findOne(id, req.user.tenantId);
  }

  @Get('code/:code')
  @Roles('admin', 'manager', 'project_manager', 'user')
  @ApiOperation({ summary: 'Get task by code' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully', type: Task })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findByCode(@Param('code') code: string, @Request() req): Promise<Task> {
    return this.taskService.findByCode(code, req.user.tenantId);
  }

  @Put(':id')
  @Roles('admin', 'manager', 'project_manager')
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully', type: Task })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Request() req,
  ): Promise<Task> {
    return this.taskService.update(id, dto, req.user.tenantId, req.user);
  }

  @Put(':id/status')
  @Roles('admin', 'manager', 'project_manager', 'user')
  @ApiOperation({ summary: 'Update task status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully', type: Task })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TaskStatus,
    @Request() req,
  ): Promise<Task> {
    return this.taskService.updateStatus(id, status, req.user.tenantId, req.user);
  }

  @Delete(':id')
  @Roles('admin', 'manager', 'project_manager')
  @ApiOperation({ summary: 'Delete task (soft delete)' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.taskService.remove(id, req.user.tenantId, req.user);
  }

  @Post('dependencies')
  @Roles('admin', 'manager', 'project_manager')
  @ApiOperation({ summary: 'Add task dependency' })
  @ApiResponse({ status: 201, description: 'Dependency added successfully', type: TaskDependency })
  @ApiResponse({ status: 400, description: 'Bad request (circular dependency or already exists)' })
  async addDependency(
    @Body() dto: CreateTaskDependencyDto,
    @Request() req,
  ): Promise<TaskDependency> {
    return this.taskService.addDependency(dto, req.user.tenantId, req.user);
  }

  @Delete('dependencies/:id')
  @Roles('admin', 'manager', 'project_manager')
  @ApiOperation({ summary: 'Remove task dependency' })
  @ApiResponse({ status: 200, description: 'Dependency removed successfully' })
  @ApiResponse({ status: 404, description: 'Dependency not found' })
  async removeDependency(@Param('id') id: string, @Request() req): Promise<void> {
    return this.taskService.removeDependency(id, req.user.tenantId);
  }

  @Get(':id/dependencies')
  @Roles('admin', 'manager', 'project_manager', 'user')
  @ApiOperation({ summary: 'Get task dependencies' })
  @ApiResponse({ status: 200, description: 'Dependencies retrieved successfully', type: [TaskDependency] })
  async getDependencies(@Param('id') id: string, @Request() req): Promise<TaskDependency[]> {
    return this.taskService.getDependencies(id, req.user.tenantId);
  }

  @Get('project/:projectId/gantt')
  @Roles('admin', 'manager', 'project_manager', 'user')
  @ApiOperation({ summary: 'Get Gantt chart data for project' })
  @ApiResponse({ status: 200, description: 'Gantt data retrieved successfully' })
  async getGanttData(@Param('projectId') projectId: string, @Request() req) {
    return this.taskService.getGanttData(projectId, req.user.tenantId);
  }
}
