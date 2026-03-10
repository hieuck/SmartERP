import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { User as UserEntity } from '@/core/user/entities/user.entity';
import { User } from '@/common/security/permission.service';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @Roles('employee', 'manager', 'admin', 'hr_manager')
  @ApiOperation({ summary: 'Check-in employee' })
  async checkIn(@CurrentUser() user: User, @Body() dto: CheckInDto) {
    return this.attendanceService.checkIn(
      dto.employeeId,
      new Date(dto.date),
      dto.checkInTime,
      user,
    );
  }

  @Post('check-out')
  @Roles('employee', 'manager', 'admin', 'hr_manager')
  @ApiOperation({ summary: 'Check-out employee' })
  async checkOut(@CurrentUser() user: User, @Body() dto: CheckOutDto) {
    return this.attendanceService.checkOut(
      dto.employeeId,
      new Date(dto.date),
      dto.checkOutTime,
      user,
    );
  }

  @Get('employee')
  @Roles('employee', 'manager', 'admin', 'hr_manager')
  @ApiOperation({ summary: 'Get attendance records for employee' })
  async getByEmployee(
    @Query('employeeId') employeeId: string,
    @Query('startDate') startDate: string,
    @CurrentUser() user: User, @Query('endDate') endDate: string,
  ) {
    return this.attendanceService.getAttendanceByEmployee(
      employeeId,
      new Date(startDate),
      new Date(endDate),
      user.tenantId,
    );
  }

  @Get('report')
  @Roles('manager', 'admin', 'hr_manager')
  @ApiOperation({ summary: 'Get attendance report with statistics' })
  async getReport(
    @Query('employeeId') employeeId: string,
    @Query('startDate') startDate: string,
    @CurrentUser() user: User, @Query('endDate') endDate: string,
  ) {
    return this.attendanceService.getAttendanceReport(
      employeeId,
      new Date(startDate),
      new Date(endDate),
      user.tenantId,
    );
  }
}
