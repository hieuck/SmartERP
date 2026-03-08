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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SystemAdminService } from './system-admin.service';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { CreateBackgroundJobDto } from './dto/create-background-job.dto';
import { UpdateErrorLogDto } from './dto/update-error-log.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../core/user/entities/user.entity';
import { JobStatus } from './entities/background-job.entity';

@ApiTags('system-admin')
@ApiBearerAuth()
@Controller('system-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemAdminController {
  constructor(private readonly systemAdminService: SystemAdminService) {}

  // System Settings
  @Post('settings')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new system setting' })
  @ApiResponse({ status: 201, description: 'Setting created successfully' })
  async createSetting(@CurrentUser() user: User, @Body() createDto: CreateSystemSettingDto) {
    return this.systemAdminService.createSetting(user, createDto);
  }

  @Get('settings')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get all system settings' })
  async getAllSettings(@CurrentUser() user: User, @Query('category') category?: string) {
    return this.systemAdminService.getAllSettings(user, category);
  }

  @Get('settings/:key')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get a system setting by key' })
  async getSetting(@CurrentUser() user: User, @Param('key') key: string) {
    return this.systemAdminService.getSetting(user, key);
  }

  @Put('settings/:key')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a system setting' })
  async updateSetting(
    @CurrentUser() user: User,
    @Param('key') key: string,
    @Body() updateDto: UpdateSystemSettingDto,
  ) {
    return this.systemAdminService.updateSetting(user, key, updateDto);
  }

  @Delete('settings/:key')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a system setting' })
  async deleteSetting(@CurrentUser() user: User, @Param('key') key: string) {
    return this.systemAdminService.deleteSetting(user, key);
  }

  // Background Jobs
  @Post('jobs')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new background job' })
  async createJob(@CurrentUser() user: User, @Body() createDto: CreateBackgroundJobDto) {
    return this.systemAdminService.createJob(user, createDto);
  }

  @Get('jobs')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get all background jobs' })
  async getAllJobs(@CurrentUser() user: User, @Query('status') status?: JobStatus) {
    if (status) {
      return this.systemAdminService.getJobsByStatus(user, status);
    }
    return this.systemAdminService.getAllJobs(user);
  }

  @Get('jobs/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get a background job by ID' })
  async getJobById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.systemAdminService.getJobById(user, id);
  }

  // Error Logs
  @Get('error-logs')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get error logs with filters' })
  async getErrorLogs(@CurrentUser() user: User, @Query() filters: any) {
    return this.systemAdminService.getErrorLogs(user, filters);
  }

  @Put('error-logs/:id/resolve')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Resolve an error log' })
  async resolveErrorLog(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateDto: UpdateErrorLogDto,
  ) {
    return this.systemAdminService.resolveErrorLog(user, id, updateDto);
  }

  // System Health
  @Get('health')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get system health status' })
  async getSystemHealth(@CurrentUser() user: User) {
    return this.systemAdminService.getSystemHealth(user);
  }
}
