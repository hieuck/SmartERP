import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@ApiTags('employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('employees')
export class EmployeeController {
  constructor(private readonly service: EmployeeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all employees' })
  findAll(@CurrentUser() user: User, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.service.findAll(user, +page, +limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search employees' })
  search(@CurrentUser() user: User, @Query('q') query: string) {
    return this.service.search(user, query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get employee statistics' })
  getStatistics(@CurrentUser() user: User) {
    return this.service.getStatistics(user);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get employees by status' })
  findByStatus(@CurrentUser() user: User, @Param('status') status: string) {
    return this.service.findByStatus(user, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.findOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create employee' })
  create(@CurrentUser() user: User, @Body() dto: CreateEmployeeDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee' })
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete employee' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.service.remove(user, id);
    return { message: 'Employee deleted successfully' };
  }
}
