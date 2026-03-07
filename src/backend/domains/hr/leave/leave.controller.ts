import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { RequestLeaveDto } from './dto/request-leave.dto';
import { ApproveLeaveDto } from './dto/approve-leave.dto';
import { RejectLeaveDto } from './dto/reject-leave.dto';
import { AllocateLeaveDto } from './dto/allocate-leave.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('Leave')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post('request')
  @Roles('employee', 'manager', 'admin', 'hr_manager')
  @ApiOperation({ summary: 'Request leave' })
  async requestLeave(@Body() dto: RequestLeaveDto, @CurrentUser() user: User) {
    return this.leaveService.requestLeave(
      dto.employeeId,
      dto.leaveType,
      new Date(dto.startDate),
      new Date(dto.endDate),
      dto.reason,
      user,
    );
  }

  @Post('approve')
  @Roles('manager', 'admin', 'hr_manager')
  @ApiOperation({ summary: 'Approve leave request' })
  async approveLeave(@Body() dto: ApproveLeaveDto, @CurrentUser() user: User) {
    return this.leaveService.approveLeave(dto.leaveId, user);
  }

  @Post('reject')
  @Roles('manager', 'admin', 'hr_manager')
  @ApiOperation({ summary: 'Reject leave request' })
  async rejectLeave(@Body() dto: RejectLeaveDto, @CurrentUser() user: User) {
    return this.leaveService.rejectLeave(dto.leaveId, dto.rejectionReason, user);
  }

  @Post('allocate')
  @Roles('admin', 'hr_manager')
  @ApiOperation({ summary: 'Allocate leave days to employee' })
  async allocateLeave(@Body() dto: AllocateLeaveDto, @CurrentUser() user: User) {
    return this.leaveService.allocateLeave(
      dto.employeeId,
      dto.leaveType,
      dto.year,
      dto.days,
      user.tenantId,
    );
  }

  @Get('pending')
  @Roles('manager', 'admin', 'hr_manager')
  @ApiOperation({ summary: 'Get pending leave requests' })
  async getPendingLeaves(@CurrentUser() user: User) {
    return this.leaveService.getPendingLeaves(user.tenantId);
  }

  @Get('balance/:employeeId/:leaveType/:year')
  @Roles('employee', 'manager', 'admin', 'hr_manager')
  @ApiOperation({ summary: 'Get leave balance' })
  async getBalance(
    @Param('employeeId') employeeId: string,
    @Param('leaveType') leaveType: string,
    @Param('year') year: string,
    @CurrentUser() user: User,
  ) {
    return this.leaveService.getLeaveBalance(
      employeeId,
      leaveType as any,
      parseInt(year),
      user.tenantId,
    );
  }
}
