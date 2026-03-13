import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { TimeEntry } from './entities/time-entry.entity';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { TimeTrackingService } from './time-tracking.service';

@ApiTags('time-tracking')
@ApiBearerAuth()
@Controller('time-tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Post()
  @Roles('admin', 'manager', 'project_manager', 'user')
  @ApiOperation({ summary: 'Log time entry' })
  @ApiResponse({ status: 201, description: 'Time entry created successfully', type: TimeEntry })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() dto: CreateTimeEntryDto, @Request() req): Promise<TimeEntry> {
    return this.timeTrackingService.create(dto, req.user.tenantId, req.user);
  }

  @Get()
  @Roles('admin', 'manager', 'project_manager', 'user')
  @ApiOperation({ summary: 'Get all time entries' })
  @ApiResponse({
    status: 200,
    description: 'Time entries retrieved successfully',
    type: [TimeEntry],
  })
  async findAll(
    @Request() req,
    @Query('userId') userId?: string,
    @Query('taskId') taskId?: string,
    @Query('projectId') projectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('isBillable') isBillable?: string,
  ): Promise<TimeEntry[]> {
    return this.timeTrackingService.findAll(req.user.tenantId, {
      userId,
      taskId,
      projectId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      isBillable: isBillable ? isBillable === 'true' : undefined,
    });
  }

  @Get(':id')
  @Roles('admin', 'manager', 'project_manager', 'user')
  @ApiOperation({ summary: 'Get time entry by ID' })
  @ApiResponse({ status: 200, description: 'Time entry retrieved successfully', type: TimeEntry })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  async findOne(@Param('id') id: string, @Request() req): Promise<TimeEntry> {
    return this.timeTrackingService.findOne(id, req.user.tenantId);
  }

  @Put(':id')
  @Roles('admin', 'manager', 'project_manager', 'user')
  @ApiOperation({ summary: 'Update time entry' })
  @ApiResponse({ status: 200, description: 'Time entry updated successfully', type: TimeEntry })
  @ApiResponse({ status: 400, description: 'Bad request (can only update own entries)' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  async update(
    @Param('id') id: string,
    @Body('hours') hours: number,
    @Body('description') description: string,
    @Request() req,
  ): Promise<TimeEntry> {
    return this.timeTrackingService.update(id, hours, description, req.user.tenantId, req.user);
  }

  @Delete(':id')
  @Roles('admin', 'manager', 'project_manager', 'user')
  @ApiOperation({ summary: 'Delete time entry' })
  @ApiResponse({ status: 200, description: 'Time entry deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request (can only delete own entries)' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.timeTrackingService.remove(id, req.user.tenantId, req.user);
  }

  @Get('task/:taskId/total')
  @Roles('admin', 'manager', 'project_manager', 'user')
  @ApiOperation({ summary: 'Get total hours by task' })
  @ApiResponse({ status: 200, description: 'Total hours retrieved successfully' })
  async getTotalHoursByTask(
    @Param('taskId') taskId: string,
    @Request() req,
  ): Promise<{ totalHours: number }> {
    const totalHours = await this.timeTrackingService.getTotalHoursByTask(
      taskId,
      req.user.tenantId,
    );
    return { totalHours };
  }

  @Get('project/:projectId/total')
  @Roles('admin', 'manager', 'project_manager', 'user')
  @ApiOperation({ summary: 'Get total hours by project' })
  @ApiResponse({ status: 200, description: 'Total hours retrieved successfully' })
  async getTotalHoursByProject(
    @Param('projectId') projectId: string,
    @Request() req,
  ): Promise<{ totalHours: number }> {
    const totalHours = await this.timeTrackingService.getTotalHoursByProject(
      projectId,
      req.user.tenantId,
    );
    return { totalHours };
  }

  @Get('user/:userId/total')
  @Roles('admin', 'manager', 'project_manager')
  @ApiOperation({ summary: 'Get total hours by user' })
  @ApiResponse({ status: 200, description: 'Total hours retrieved successfully' })
  async getTotalHoursByUser(
    @Param('userId') userId: string,
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ totalHours: number }> {
    const totalHours = await this.timeTrackingService.getTotalHoursByUser(
      userId,
      req.user.tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return { totalHours };
  }

  @Get('billable/summary')
  @Roles('admin', 'manager', 'project_manager')
  @ApiOperation({ summary: 'Get billable hours summary' })
  @ApiResponse({ status: 200, description: 'Billable hours summary retrieved successfully' })
  async getBillableHours(
    @Request() req,
    @Query('userId') userId?: string,
    @Query('projectId') projectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ totalHours: number; totalCost: number }> {
    return this.timeTrackingService.getBillableHours(req.user.tenantId, {
      userId,
      projectId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }
}
