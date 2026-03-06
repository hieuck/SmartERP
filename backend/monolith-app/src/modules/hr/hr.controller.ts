import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Employee } from './entities/employee.entity';
import { Attendance } from './entities/attendance.entity';
import { Leave } from './entities/leave.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { CreateLeaveDto } from './dto/create-leave.dto';

@Controller('hr')
@UseGuards(JwtAuthGuard)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // Employee Endpoints
  @Get('employees')
  async findAllEmployees(@TenantId() tenantId: string): Promise<Employee[]> {
    return this.hrService.findAllEmployees(tenantId);
  }

  @Get('employees/:id')
  async findEmployeeById(@TenantId() tenantId: string, @Param('id') id: string): Promise<Employee> {
    return this.hrService.findEmployeeById(tenantId, id);
  }

  @Post('employees')
  async createEmployee(
    @TenantId() tenantId: string,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ): Promise<Employee> {
    return this.hrService.createEmployee(tenantId, createEmployeeDto);
  }

  @Put('employees/:id')
  async updateEmployee(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    return this.hrService.updateEmployee(tenantId, id, updateEmployeeDto);
  }

  @Delete('employees/:id')
  async deleteEmployee(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.hrService.deleteEmployee(tenantId, id);
  }

  // Attendance Endpoints
  @Get('attendance')
  async findAllAttendance(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Attendance[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.hrService.findAllAttendance(tenantId, undefined, start, end);
  }

  @Get('attendance/employee/:employeeId')
  async findAttendanceByEmployee(
    @TenantId() tenantId: string,
    @Param('employeeId') employeeId: string,
  ): Promise<Attendance[]> {
    return this.hrService.findAllAttendance(tenantId, employeeId);
  }

  @Post('attendance')
  async createAttendance(
    @TenantId() tenantId: string,
    @Body() createAttendanceDto: CreateAttendanceDto,
  ): Promise<Attendance> {
    return this.hrService.createAttendance(tenantId, createAttendanceDto);
  }

  @Put('attendance/:id')
  async updateAttendance(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ): Promise<Attendance> {
    return this.hrService.updateAttendance(tenantId, id, updateAttendanceDto);
  }

  // Leave Endpoints
  @Get('leaves')
  async findAllLeaves(@TenantId() tenantId: string): Promise<Leave[]> {
    return this.hrService.findAllLeaves(tenantId);
  }

  @Get('leaves/employee/:employeeId')
  async findLeavesByEmployee(
    @TenantId() tenantId: string,
    @Param('employeeId') employeeId: string,
  ): Promise<Leave[]> {
    return this.hrService.findAllLeaves(tenantId, employeeId);
  }

  @Post('leaves')
  async createLeave(
    @TenantId() tenantId: string,
    @Body() createLeaveDto: CreateLeaveDto,
  ): Promise<Leave> {
    return this.hrService.createLeave(tenantId, createLeaveDto);
  }

  @Post('leaves/:id/approve')
  async approveLeave(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
  ): Promise<Leave> {
    return this.hrService.approveLeave(tenantId, id, approvedBy);
  }

  @Post('leaves/:id/reject')
  async rejectLeave(@TenantId() tenantId: string, @Param('id') id: string): Promise<Leave> {
    return this.hrService.rejectLeave(tenantId, id);
  }
}
