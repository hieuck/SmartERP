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
import { StockService } from './stock.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
@ApiTags('stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post()
  @ApiOperation({ summary: 'Create stock' })
  create(
    @CurrentUser() user: User,
    @Body() createInventoryDto: CreateInventoryDto,
    @Request() _req: Express.Request & { user?: { id: string } },
  ) {
    return this.stockService.create(user, createInventoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  findAll(
    @CurrentUser() user: User,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    if (productId) {
      return this.stockService.findByProduct(user, productId);
    }
    if (warehouseId) {
      return this.stockService.findByWarehouse(user, warehouseId);
    }
    return this.stockService.findAll(user);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get inventory count' })
  count(@CurrentUser() user: User) {
    return this.stockService.count(user);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock items' })
  getLowStock(@CurrentUser() user: User) {
    return this.stockService.getLowStockItems(user);
  }

  @Get('out-of-stock')
  @ApiOperation({ summary: 'Get out of stock items' })
  getOutOfStock(@CurrentUser() user: User) {
    return this.stockService.getOutOfStockItems(user);
  }

  @Get('total-value')
  @ApiOperation({ summary: 'Get total inventory value' })
  getTotalValue(@CurrentUser() user: User) {
    return this.stockService.getTotalValue(user);
  }

  @Get('product/:productId/warehouse/:warehouseId')
  @ApiOperation({ summary: 'Get inventory by product and warehouse' })
  findByProductAndWarehouse(
    @Param('productId') productId: string,
    @CurrentUser() user: User,
    @Param('warehouseId') warehouseId: string,
  ) {
    return this.stockService.findByProductAndWarehouse(user, productId, warehouseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.stockService.findOne(user, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update inventory' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @Request() _req: Express.Request & { user?: { id: string } },
  ) {
    return this.stockService.update(user, id, updateInventoryDto);
  }

  @Patch(':id/adjust')
  @ApiOperation({ summary: 'Adjust inventory quantity' })
  adjust(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() adjustInventoryDto: AdjustInventoryDto,
    @Request() _req: Express.Request & { user?: { id: string } },
  ) {
    return this.stockService.adjustQuantity(user, id, adjustInventoryDto);
  }

  @Patch(':id/reserve')
  @ApiOperation({ summary: 'Reserve inventory' })
  reserve(@Param('id') id: string, @Body() body: { quantity: number }, @CurrentUser() user: User) {
    return this.stockService.reserve(user, id, body.quantity);
  }

  @Patch(':id/release')
  @ApiOperation({ summary: 'Release reserved inventory' })
  release(@Param('id') id: string, @Body() body: { quantity: number }, @CurrentUser() user: User) {
    return this.stockService.release(user, id, body.quantity);
  }

  @Patch(':id/fulfill')
  @ApiOperation({ summary: 'Fulfill reservation' })
  fulfill(@Param('id') id: string, @Body() body: { quantity: number }, @CurrentUser() user: User) {
    return this.stockService.fulfillReservation(user, id, body.quantity);
  }

  @Patch(':id/count')
  @ApiOperation({ summary: 'Update stock count' })
  updateCount(
    @Param('id') id: string,
    @Body() body: { countedQuantity: number },
    @CurrentUser() user: User,
    @Request() _req: Express.Request & { user?: { id: string } },
  ) {
    return this.stockService.updateStockCount(user, id, body.countedQuantity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inventory' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.stockService.remove(user, id);
    return { message: 'Inventory deleted successfully' };
  }
}
