import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ManagementService } from './management.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { User } from '@/common/security/permission.service';
@Controller('hr')
@UseGuards(JwtAuthGuard)
export class ManagementController {
  constructor(private readonly managementService: ManagementService) {}

  // Employee Endpoints
  @Get('employees')
  async findAllEmployees(@CurrentUser() user: User): Promise<unknown[]> {
    return this.managementService.findAllEmployees(user);
  }

  @Get('employees/:id')
  async findEmployeeById(@CurrentUser() user: User, @Param('id') id: string): Promise<unknown> {
    return this.managementService.findEmployeeById(user, id);
  }

  @Post('employees')
  async createEmployee(
    @CurrentUser() user: User,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ): Promise<unknown> {
    return this.managementService.createEmployee(user, createEmployeeDto);
  }

  @Put('employees/:id')
  async updateEmployee(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<unknown> {
    return this.managementService.updateEmployee(user, id, updateEmployeeDto);
  }

  @Delete('employees/:id')
  async deleteEmployee(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    return this.managementService.deleteEmployee(user, id);
  }

  // Attendance Endpoints
  @Get('attendance')
  async findAllAttendance(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<unknown[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.managementService.findAllAttendance(user, undefined, start, end);
  }

  @Get('attendance/employee/:employeeId')
  async findAttendanceByEmployee(
    @CurrentUser() user: User,
    @Param('employeeId') employeeId: string,
  ): Promise<unknown[]> {
    return this.managementService.findAllAttendance(user, employeeId);
  }

  @Post('attendance')
  async createAttendance(
    @CurrentUser() user: User,
    @Body() createAttendanceDto: CreateAttendanceDto,
  ): Promise<unknown> {
    return this.managementService.createAttendance(user, createAttendanceDto);
  }

  @Put('attendance/:id')
  async updateAttendance(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ): Promise<unknown> {
    return this.managementService.updateAttendance(user, id, updateAttendanceDto);
  }

  // Leave Endpoints
  @Get('leaves')
  async findAllLeaves(@CurrentUser() user: User): Promise<unknown[]> {
    return this.managementService.findAllLeaves(user);
  }

  @Get('leaves/employee/:employeeId')
  async findLeavesByEmployee(
    @CurrentUser() user: User,
    @Param('employeeId') employeeId: string,
  ): Promise<unknown[]> {
    return this.managementService.findAllLeaves(user, employeeId);
  }

  @Post('leaves')
  async createLeave(
    @CurrentUser() user: User,
    @Body() createLeaveDto: CreateLeaveDto,
  ): Promise<unknown> {
    return this.managementService.createLeave(user, createLeaveDto);
  }

  @Post('leaves/:id/approve')
  async approveLeave(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
  ): Promise<unknown> {
    return this.managementService.approveLeave(user, id, approvedBy);
  }

  @Post('leaves/:id/reject')
  async rejectLeave(@CurrentUser() user: User, @Param('id') id: string): Promise<unknown> {
    return this.managementService.rejectLeave(user, id);
  }
}
