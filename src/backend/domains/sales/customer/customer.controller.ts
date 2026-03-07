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
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  findAll(@CurrentUser() user: User) {
    return this.customerService.findAll(user);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search customers' })
  search(@Query('q') query: string, @CurrentUser() user: User) {
    return this.customerService.search(query, user);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get customers by status' })
  findByStatus(@Param('status') status: string, @CurrentUser() user: User) {
    return this.customerService.findByStatus(status, user);
  }

  @Get('top/:limit')
  @ApiOperation({ summary: 'Get top customers by balance' })
  getTopCustomers(@Param('limit') limit: number, @CurrentUser() user: User) {
    return this.customerService.getTopCustomers(limit, user);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get customer count' })
  count(@CurrentUser() user: User) {
    return this.customerService.count(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.customerService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create customer' })
  create(@Body() createCustomerDto: CreateCustomerDto, @CurrentUser() user: User) {
    return this.customerService.create(createCustomerDto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @CurrentUser() user: User,
  ) {
    return this.customerService.update(id, updateCustomerDto, user);
  }

  @Patch(':id/balance')
  @ApiOperation({ summary: 'Update customer balance' })
  updateBalance(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @CurrentUser() user: User,
  ) {
    return this.customerService.updateBalance(id, amount, user);
  }

  @Patch(':id/credit-limit')
  @ApiOperation({ summary: 'Update customer credit limit' })
  updateCreditLimit(
    @Param('id') id: string,
    @Body('creditLimit') creditLimit: number,
    @CurrentUser() user: User,
  ) {
    return this.customerService.updateCreditLimit(id, creditLimit, user);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate customer' })
  activate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.customerService.activate(id, user);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate customer' })
  deactivate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.customerService.deactivate(id, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.customerService.remove(id, user);
    return { message: 'Customer deleted successfully' };
  }
}
