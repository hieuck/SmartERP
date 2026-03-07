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
import { SupplierService } from './supplier.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
@ApiTags('suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  @ApiOperation({ summary: 'Get all suppliers' })
  findAll(@CurrentUser() user: User) {
    return this.supplierService.findAll(user);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search suppliers' })
  search(@Query('q') query: string, @CurrentUser() user: User) {
    return this.supplierService.search(query, user);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get suppliers by status' })
  findByStatus(@Param('status') status: string, @CurrentUser() user: User) {
    return this.supplierService.findByStatus(status, user);
  }

  @Get('top/:limit')
  @ApiOperation({ summary: 'Get top suppliers by balance' })
  getTopSuppliers(@Param('limit') limit: number, @CurrentUser() user: User) {
    return this.supplierService.getTopSuppliers(limit, user);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get supplier count' })
  count(@CurrentUser() user: User) {
    return this.supplierService.count(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.supplierService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create supplier' })
  create(@Body() createSupplierDto: CreateSupplierDto, @CurrentUser() user: User) {
    return this.supplierService.create(createSupplierDto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update supplier' })
  update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @CurrentUser() user: User,
  ) {
    return this.supplierService.update(id, updateSupplierDto, user);
  }

  @Patch(':id/balance')
  @ApiOperation({ summary: 'Update supplier balance' })
  updateBalance(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @CurrentUser() user: User,
  ) {
    return this.supplierService.updateBalance(id, amount, user);
  }

  @Patch(':id/payment-terms')
  @ApiOperation({ summary: 'Update supplier payment terms' })
  updatePaymentTerms(
    @Param('id') id: string,
    @Body('paymentTerms') paymentTerms: number,
    @CurrentUser() user: User,
  ) {
    return this.supplierService.updatePaymentTerms(id, paymentTerms, user);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate supplier' })
  activate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.supplierService.activate(id, user);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate supplier' })
  deactivate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.supplierService.deactivate(id, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete supplier' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.supplierService.remove(id, user);
    return { message: 'Supplier deleted successfully' };
  }
}
