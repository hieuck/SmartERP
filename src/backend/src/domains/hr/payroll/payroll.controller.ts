import { Controller, Get, Post, Body, Param, Request, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import { GeneratePayslipDto } from './dto/generate-payslip.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('payroll')
@ApiBearerAuth()
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('salary-structures')
  @Roles('hr_manager', 'admin')
  @ApiOperation({ summary: 'Create salary structure for employee' })
  @ApiResponse({ status: 201, description: 'Salary structure created' })
  async createSalaryStructure(@Body() dto: CreateSalaryStructureDto, @Request() req) {
    return this.payrollService.createSalaryStructure(dto, req.user.tenantId);
  }

  @Get('salary-structures/:id')
  @Roles('hr_manager', 'admin', 'manager')
  @ApiOperation({ summary: 'Get salary structure by ID' })
  @ApiResponse({ status: 200, description: 'Salary structure found' })
  async getSalaryStructure(@Param('id') id: string, @Request() req) {
    return this.payrollService.getSalaryStructure(id, req.user.tenantId);
  }

  @Get('salary-structures/employee/:employeeId')
  @Roles('hr_manager', 'admin', 'manager')
  @ApiOperation({ summary: 'Get salary structures by employee' })
  @ApiResponse({ status: 200, description: 'Salary structures found' })
  async getSalaryStructuresByEmployee(@Param('employeeId') employeeId: string, @Request() req) {
    return this.payrollService.getSalaryStructuresByEmployee(employeeId, req.user.tenantId);
  }

  @Post('payslips/generate')
  @Roles('hr_manager', 'admin')
  @ApiOperation({ summary: 'Generate payslip from salary structure' })
  @ApiResponse({ status: 201, description: 'Payslip generated' })
  async generatePayslip(@Body() dto: GeneratePayslipDto, @Request() req) {
    return this.payrollService.generatePayslip(
      dto.salaryStructureId,
      dto.month,
      dto.year,
      req.user.tenantId,
    );
  }

  @Get('payslips/:id')
  @Roles('hr_manager', 'admin', 'manager', 'employee')
  @ApiOperation({ summary: 'Get payslip by ID' })
  @ApiResponse({ status: 200, description: 'Payslip found' })
  async getPayslip(@Param('id') id: string, @Request() req) {
    return this.payrollService.getPayslip(id, req.user.tenantId);
  }

  @Get('payslips/employee/:employeeId')
  @Roles('hr_manager', 'admin', 'manager', 'employee')
  @ApiOperation({ summary: 'Get payslips by employee' })
  @ApiResponse({ status: 200, description: 'Payslips found' })
  async getPayslipsByEmployee(@Param('employeeId') employeeId: string, @Request() req) {
    return this.payrollService.getPayslipsByEmployee(employeeId, req.user.tenantId);
  }

  @Get('payslips/month/:year/:month')
  @Roles('hr_manager', 'admin', 'manager')
  @ApiOperation({ summary: 'Get all payslips for a specific month' })
  @ApiResponse({ status: 200, description: 'Payslips found' })
  async getPayslipsByMonth(
    @Param('year') year: number,
    @Param('month') month: number,
    @Request() req,
  ) {
    return this.payrollService.getPayslipsByMonth(month, year, req.user.tenantId);
  }

  @Patch('payslips/:id/submit')
  @Roles('hr_manager', 'admin')
  @ApiOperation({ summary: 'Submit payslip for approval' })
  @ApiResponse({ status: 200, description: 'Payslip submitted' })
  async submitPayslip(@Param('id') id: string, @Request() req) {
    return this.payrollService.submitPayslip(id, req.user.tenantId);
  }

  @Patch('payslips/:id/mark-paid')
  @Roles('hr_manager', 'admin')
  @ApiOperation({ summary: 'Mark payslip as paid' })
  @ApiResponse({ status: 200, description: 'Payslip marked as paid' })
  async markAsPaid(@Param('id') id: string, @Body() dto: MarkPaidDto, @Request() req) {
    return this.payrollService.markAsPaid(id, dto.paymentDate, req.user.tenantId);
  }

  @Patch('payslips/:id/cancel')
  @Roles('hr_manager', 'admin')
  @ApiOperation({ summary: 'Cancel payslip' })
  @ApiResponse({ status: 200, description: 'Payslip cancelled' })
  async cancelPayslip(@Param('id') id: string, @Request() req) {
    return this.payrollService.cancelPayslip(id, req.user.tenantId);
  }
}
