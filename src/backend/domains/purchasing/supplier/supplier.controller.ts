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
import { TenantGuard } from '../../../common/guards/tenant.guard';
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
  search(@CurrentUser() user: User, @Query('q') query: string) {
    return this.supplierService.search(user, query);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get suppliers by status' })
  findByStatus(@CurrentUser() user: User, @Param('status') status: string) {
    return this.supplierService.findByStatus(user, status);
  }

  @Get('top/:limit')
  @ApiOperation({ summary: 'Get top suppliers by balance' })
  getTopSuppliers(@CurrentUser() user: User, @Param('limit') limit: number) {
    return this.supplierService.getTopSuppliers(user, limit);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get supplier count' })
  count(@CurrentUser() user: User) {
    return this.supplierService.count(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.supplierService.findOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create supplier' })
  create(@CurrentUser() user: User, @Body() createSupplierDto: CreateSupplierDto) {
    return this.supplierService.create(user, createSupplierDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update supplier' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.supplierService.update(user, id, updateSupplierDto);
  }

  @Patch(':id/balance')
  @ApiOperation({ summary: 'Update supplier balance' })
  updateBalance(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body('amount') amount: number,
  ) {
    return this.supplierService.updateBalance(user, id, amount);
  }

  @Patch(':id/payment-terms')
  @ApiOperation({ summary: 'Update supplier payment terms' })
  updatePaymentTerms(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body('paymentTerms') paymentTerms: number,
  ) {
    return this.supplierService.updatePaymentTerms(user, id, paymentTerms);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate supplier' })
  activate(@CurrentUser() user: User, @Param('id') id: string) {
    return this.supplierService.activate(user, id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate supplier' })
  deactivate(@CurrentUser() user: User, @Param('id') id: string) {
    return this.supplierService.deactivate(user, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete supplier' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.supplierService.remove(user, id);
    return { message: 'Supplier deleted successfully' };
  }
}
