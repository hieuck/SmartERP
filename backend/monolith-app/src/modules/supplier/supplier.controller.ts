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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@ApiTags('suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  @ApiOperation({ summary: 'Get all suppliers' })
  findAll(@TenantId() tenantId: string) {
    return this.supplierService.findAll(tenantId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search suppliers' })
  search(@Query('q') query: string, @TenantId() tenantId: string) {
    return this.supplierService.search(query, tenantId);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get suppliers by status' })
  findByStatus(@Param('status') status: string, @TenantId() tenantId: string) {
    return this.supplierService.findByStatus(status, tenantId);
  }

  @Get('top/:limit')
  @ApiOperation({ summary: 'Get top suppliers by balance' })
  getTopSuppliers(@Param('limit') limit: number, @TenantId() tenantId: string) {
    return this.supplierService.getTopSuppliers(limit, tenantId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get supplier count' })
  count(@TenantId() tenantId: string) {
    return this.supplierService.count(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.supplierService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create supplier' })
  create(@Body() createSupplierDto: CreateSupplierDto, @TenantId() tenantId: string) {
    return this.supplierService.create(createSupplierDto, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update supplier' })
  update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @TenantId() tenantId: string,
  ) {
    return this.supplierService.update(id, updateSupplierDto, tenantId);
  }

  @Patch(':id/balance')
  @ApiOperation({ summary: 'Update supplier balance' })
  updateBalance(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @TenantId() tenantId: string,
  ) {
    return this.supplierService.updateBalance(id, amount, tenantId);
  }

  @Patch(':id/payment-terms')
  @ApiOperation({ summary: 'Update supplier payment terms' })
  updatePaymentTerms(
    @Param('id') id: string,
    @Body('paymentTerms') paymentTerms: number,
    @TenantId() tenantId: string,
  ) {
    return this.supplierService.updatePaymentTerms(id, paymentTerms, tenantId);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate supplier' })
  activate(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.supplierService.activate(id, tenantId);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate supplier' })
  deactivate(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.supplierService.deactivate(id, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete supplier' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.supplierService.remove(id, tenantId);
    return { message: 'Supplier deleted successfully' };
  }
}
