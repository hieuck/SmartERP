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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  findAll(@TenantId() tenantId: string) {
    return this.customerService.findAll(tenantId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search customers' })
  search(@Query('q') query: string, @TenantId() tenantId: string) {
    return this.customerService.search(query, tenantId);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get customers by status' })
  findByStatus(@Param('status') status: string, @TenantId() tenantId: string) {
    return this.customerService.findByStatus(status, tenantId);
  }

  @Get('top/:limit')
  @ApiOperation({ summary: 'Get top customers by balance' })
  getTopCustomers(@Param('limit') limit: number, @TenantId() tenantId: string) {
    return this.customerService.getTopCustomers(limit, tenantId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get customer count' })
  count(@TenantId() tenantId: string) {
    return this.customerService.count(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.customerService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create customer' })
  create(@Body() createCustomerDto: CreateCustomerDto, @TenantId() tenantId: string) {
    return this.customerService.create(createCustomerDto, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @TenantId() tenantId: string,
  ) {
    return this.customerService.update(id, updateCustomerDto, tenantId);
  }

  @Patch(':id/balance')
  @ApiOperation({ summary: 'Update customer balance' })
  updateBalance(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @TenantId() tenantId: string,
  ) {
    return this.customerService.updateBalance(id, amount, tenantId);
  }

  @Patch(':id/credit-limit')
  @ApiOperation({ summary: 'Update customer credit limit' })
  updateCreditLimit(
    @Param('id') id: string,
    @Body('creditLimit') creditLimit: number,
    @TenantId() tenantId: string,
  ) {
    return this.customerService.updateCreditLimit(id, creditLimit, tenantId);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate customer' })
  activate(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.customerService.activate(id, tenantId);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate customer' })
  deactivate(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.customerService.deactivate(id, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.customerService.remove(id, tenantId);
    return { message: 'Customer deleted successfully' };
  }
}
