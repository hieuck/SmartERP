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
import { TenantGuard } from '../../../common/guards/tenant.guard';
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
  search(@CurrentUser() user: User, @Query('q') query: string) {
    return this.customerService.search(user, query);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get customers by status' })
  findByStatus(@CurrentUser() user: User, @Param('status') status: string) {
    return this.customerService.findByStatus(user, status);
  }

  @Get('top/:limit')
  @ApiOperation({ summary: 'Get top customers by balance' })
  getTopCustomers(@CurrentUser() user: User, @Param('limit') limit: number) {
    return this.customerService.getTopCustomers(user, limit);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get customer count' })
  count(@CurrentUser() user: User) {
    return this.customerService.count(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.customerService.findOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create customer' })
  create(@CurrentUser() user: User, @Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(user, createCustomerDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customerService.update(user, id, updateCustomerDto);
  }

  @Patch(':id/balance')
  @ApiOperation({ summary: 'Update customer balance' })
  updateBalance(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('amount') amount: number,
  ) {
    return this.customerService.updateBalance(user, id, amount);
  }

  @Patch(':id/credit-limit')
  @ApiOperation({ summary: 'Update customer credit limit' })
  updateCreditLimit(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('creditLimit') creditLimit: number,
  ) {
    return this.customerService.updateCreditLimit(user, id, creditLimit);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate customer' })
  activate(@CurrentUser() user: User, @Param('id') id: string) {
    return this.customerService.activate(user, id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate customer' })
  deactivate(@CurrentUser() user: User, @Param('id') id: string) {
    return this.customerService.deactivate(user, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.customerService.remove(user, id);
    return { message: 'Customer deleted successfully' };
  }
}
