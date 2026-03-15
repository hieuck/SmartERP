import { Controller, Post, Get, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ValuationService } from './valuation.service';
import { CalculateFIFODto } from './dto/calculate-fifo.dto';
import { AddStockValuationDto } from './dto/add-stock-valuation.dto';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Stock Valuation')
@ApiBearerAuth()
@Controller('inventory/valuation')
export class ValuationController {
  constructor(private readonly valuationService: ValuationService) {}

  @Post('calculate-fifo')
  @Roles('manager', 'admin', 'warehouse_manager', 'accountant')
  @ApiOperation({ summary: 'Calculate FIFO cost for a quantity' })
  async calculateFIFO(@Body() dto: CalculateFIFODto) {
    return this.valuationService.calculateFIFO(dto.productId, dto.warehouseId, dto.quantity);
  }

  @Post('add')
  @Roles('manager', 'admin', 'warehouse_manager')
  @ApiOperation({ summary: 'Add stock valuation (when stock is received)' })
  async addStockValuation(@Body() dto: AddStockValuationDto, @Request() req: unknown) {
    return this.valuationService.addStockValuation(
      dto.productId,
      dto.warehouseId,
      dto.quantity,
      dto.unitCost,
      dto.referenceType,
      dto.referenceId,
      req.user.tenantId,
    );
  }

  @Get('average-cost/:productId/:warehouseId')
  @Roles('manager', 'admin', 'warehouse_manager', 'accountant')
  @ApiOperation({ summary: 'Get average cost for a product in a warehouse' })
  async getAverageCost(
    @Param('productId') productId: string,
    @Param('warehouseId') warehouseId: string,
  ) {
    const avgCost = await this.valuationService.getAverageCost(productId, warehouseId);
    return { productId, warehouseId, averageCost: avgCost };
  }

  @Get('report/:productId/:warehouseId')
  @Roles('manager', 'admin', 'warehouse_manager', 'accountant')
  @ApiOperation({ summary: 'Get valuation report for a product' })
  async getValuationReport(
    @Param('productId') productId: string,
    @Param('warehouseId') warehouseId: string,
  ) {
    return this.valuationService.getValuationReport(productId, warehouseId);
  }
}
