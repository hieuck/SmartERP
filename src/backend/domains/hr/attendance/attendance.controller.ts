import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @Roles('employee', 'manager', 'admin', 'hr_manager')
  @ApiOperation({ summary: 'Check-in employee' })
  async checkIn(@Body() dto: CheckInDto, @CurrentUser() user: User) {
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
  async checkOut(@Body() dto: CheckOutDto, @CurrentUser() user: User) {
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
    @Query('endDate') endDate: string,
    @CurrentUser() user: User,
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
    @Query('endDate') endDate: string,
    @CurrentUser() user: User,
  ) {
    return this.attendanceService.getAttendanceReport(
      employeeId,
      new Date(startDate),
      new Date(endDate),
      user.tenantId,
    );
  }
}
