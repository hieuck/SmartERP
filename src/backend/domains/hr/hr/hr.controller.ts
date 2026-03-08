import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
// import { TenantId } from '../../common/decorators/tenant-id.decorator'; // Not implemented yet
import { Employee } from './entities/employee.entity';
import { Attendance } from './entities/attendance.entity';
import { Leave } from './entities/leave.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { CreateLeaveDto } from './dto/create-leave.dto';

import { User } from '@/common/security/permission.service';
@Controller('hr')
@UseGuards(JwtAuthGuard)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // Employee Endpoints
  @Get('employees')
  async findAllEmployees(@CurrentUser() user: User): Promise<Employee[]> {
    return this.hrService.findAllEmployees(user);
  }

  @Get('employees/:id')
  async findEmployeeById(@CurrentUser() user: User, @Param('id') id: string): Promise<Employee> {
    return this.hrService.findEmployeeById(user, id);
  }

  @Post('employees')
  async createEmployee(
    @CurrentUser() user: User,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ): Promise<Employee> {
    return this.hrService.createEmployee(user, createEmployeeDto);
  }

  @Put('employees/:id')
  async updateEmployee(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    return this.hrService.updateEmployee(user, id, updateEmployeeDto);
  }

  @Delete('employees/:id')
  async deleteEmployee(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    return this.hrService.deleteEmployee(user, id);
  }

  // Attendance Endpoints
  @Get('attendance')
  async findAllAttendance(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Attendance[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.hrService.findAllAttendance(user, undefined, start, end);
  }

  @Get('attendance/employee/:employeeId')
  async findAttendanceByEmployee(
    @CurrentUser() user: User,
    @Param('employeeId') employeeId: string,
  ): Promise<Attendance[]> {
    return this.hrService.findAllAttendance(user, employeeId);
  }

  @Post('attendance')
  async createAttendance(
    @CurrentUser() user: User,
    @Body() createAttendanceDto: CreateAttendanceDto,
  ): Promise<Attendance> {
    return this.hrService.createAttendance(user, createAttendanceDto);
  }

  @Put('attendance/:id')
  async updateAttendance(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ): Promise<Attendance> {
    return this.hrService.updateAttendance(user, id, updateAttendanceDto);
  }

  // Leave Endpoints
  @Get('leaves')
  async findAllLeaves(@CurrentUser() user: User): Promise<Leave[]> {
    return this.hrService.findAllLeaves(user);
  }

  @Get('leaves/employee/:employeeId')
  async findLeavesByEmployee(
    @CurrentUser() user: User,
    @Param('employeeId') employeeId: string,
  ): Promise<Leave[]> {
    return this.hrService.findAllLeaves(user, employeeId);
  }

  @Post('leaves')
  async createLeave(
    @CurrentUser() user: User,
    @Body() createLeaveDto: CreateLeaveDto,
  ): Promise<Leave> {
    return this.hrService.createLeave(user, createLeaveDto);
  }

  @Post('leaves/:id/approve')
  async approveLeave(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
  ): Promise<Leave> {
    return this.hrService.approveLeave(user, id, approvedBy);
  }

  @Post('leaves/:id/reject')
  async rejectLeave(@CurrentUser() user: User, @Param('id') id: string): Promise<Leave> {
    return this.hrService.rejectLeave(user, id);
  }
}
