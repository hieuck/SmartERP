import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create inventory' })
  create(
    @Body() createInventoryDto: CreateInventoryDto,
    @TenantId() tenantId: string,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.inventoryService.create(createInventoryDto, tenantId, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    if (productId) {
      return this.inventoryService.findByProduct(productId, tenantId);
    }
    if (warehouseId) {
      return this.inventoryService.findByWarehouse(warehouseId, tenantId);
    }
    return this.inventoryService.findAll(tenantId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get inventory count' })
  count(@TenantId() tenantId: string) {
    return this.inventoryService.count(tenantId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock items' })
  getLowStock(@TenantId() tenantId: string) {
    return this.inventoryService.getLowStockItems(tenantId);
  }

  @Get('out-of-stock')
  @ApiOperation({ summary: 'Get out of stock items' })
  getOutOfStock(@TenantId() tenantId: string) {
    return this.inventoryService.getOutOfStockItems(tenantId);
  }

  @Get('total-value')
  @ApiOperation({ summary: 'Get total inventory value' })
  getTotalValue(@TenantId() tenantId: string) {
    return this.inventoryService.getTotalValue(tenantId);
  }

  @Get('product/:productId/warehouse/:warehouseId')
  @ApiOperation({ summary: 'Get inventory by product and warehouse' })
  findByProductAndWarehouse(
    @Param('productId') productId: string,
    @Param('warehouseId') warehouseId: string,
    @TenantId() tenantId: string,
  ) {
    return this.inventoryService.findByProductAndWarehouse(productId, warehouseId, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.inventoryService.findOne(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update inventory' })
  update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @TenantId() tenantId: string,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.inventoryService.update(id, updateInventoryDto, tenantId, req.user?.id);
  }

  @Patch(':id/adjust')
  @ApiOperation({ summary: 'Adjust inventory quantity' })
  adjust(
    @Param('id') id: string,
    @Body() adjustInventoryDto: AdjustInventoryDto,
    @TenantId() tenantId: string,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.inventoryService.adjustQuantity(id, adjustInventoryDto, tenantId, req.user?.id);
  }

  @Patch(':id/reserve')
  @ApiOperation({ summary: 'Reserve inventory' })
  reserve(
    @Param('id') id: string,
    @Body() body: { quantity: number },
    @TenantId() tenantId: string,
  ) {
    return this.inventoryService.reserve(id, body.quantity, tenantId);
  }

  @Patch(':id/release')
  @ApiOperation({ summary: 'Release reserved inventory' })
  release(
    @Param('id') id: string,
    @Body() body: { quantity: number },
    @TenantId() tenantId: string,
  ) {
    return this.inventoryService.release(id, body.quantity, tenantId);
  }

  @Patch(':id/fulfill')
  @ApiOperation({ summary: 'Fulfill reservation' })
  fulfill(
    @Param('id') id: string,
    @Body() body: { quantity: number },
    @TenantId() tenantId: string,
  ) {
    return this.inventoryService.fulfillReservation(id, body.quantity, tenantId);
  }

  @Patch(':id/count')
  @ApiOperation({ summary: 'Update stock count' })
  updateCount(
    @Param('id') id: string,
    @Body() body: { countedQuantity: number },
    @TenantId() tenantId: string,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.inventoryService.updateStockCount(id, body.countedQuantity, tenantId, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inventory' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.inventoryService.remove(id, tenantId);
    return { message: 'Inventory deleted successfully' };
  }
}
