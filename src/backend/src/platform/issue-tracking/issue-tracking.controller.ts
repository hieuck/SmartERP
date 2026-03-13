import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { User } from '@/core/user/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssueStatus } from './enums';
import { IssueTrackingService } from './issue-tracking.service';

@ApiTags('Issue Tracking')
@ApiBearerAuth()
@Controller('issues')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IssueTrackingController {
  constructor(private readonly issueTrackingService: IssueTrackingService) {}

  @Post()
  @Roles('user', 'manager', 'admin')
  @ApiOperation({ summary: 'Create a new issue' })
  @ApiResponse({ status: 201, description: 'Issue created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@CurrentUser() user: User, @Body() createDto: CreateIssueDto) {
    return await this.issueTrackingService.create(user, createDto);
  }

  @Get()
  @Roles('user', 'manager', 'admin')
  @ApiOperation({ summary: 'Get all issues with pagination' })
  @ApiResponse({ status: 200, description: 'Issues retrieved successfully' })
  async findAll(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: IssueStatus,
  ) {
    return await this.issueTrackingService.findAll(user, { page, limit, status });
  }

  @Get(':id')
  @Roles('user', 'manager', 'admin')
  @ApiOperation({ summary: 'Get issue by ID' })
  @ApiResponse({ status: 200, description: 'Issue retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Issue not found' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.issueTrackingService.findOne(user, id);
  }

  @Put(':id')
  @Roles('user', 'manager', 'admin')
  @ApiOperation({ summary: 'Update issue' })
  @ApiResponse({ status: 200, description: 'Issue updated successfully' })
  @ApiResponse({ status: 404, description: 'Issue not found' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateDto: UpdateIssueDto,
  ) {
    return await this.issueTrackingService.update(user, id, updateDto);
  }

  @Patch(':id/status')
  @Roles('user', 'manager', 'admin')
  @ApiOperation({ summary: 'Update issue status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'Issue not found' })
  async updateStatus(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('status') status: IssueStatus,
  ) {
    return await this.issueTrackingService.updateStatus(user, id, status);
  }

  @Patch(':id/assign')
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Assign issue to a user' })
  @ApiResponse({ status: 200, description: 'Issue assigned successfully' })
  @ApiResponse({ status: 404, description: 'Issue not found' })
  async assign(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string,
  ) {
    return await this.issueTrackingService.assign(user, id, assigneeId);
  }

  @Post(':id/comments')
  @Roles('user', 'manager', 'admin')
  @ApiOperation({ summary: 'Add comment to issue' })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  @ApiResponse({ status: 404, description: 'Issue not found' })
  async addComment(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() commentDto: CreateCommentDto,
  ) {
    return await this.issueTrackingService.addComment(user, id, commentDto);
  }

  @Get(':id/comments')
  @Roles('user', 'manager', 'admin')
  @ApiOperation({ summary: 'Get all comments for an issue' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Issue not found' })
  async getComments(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.issueTrackingService.getComments(user, id);
  }
}
