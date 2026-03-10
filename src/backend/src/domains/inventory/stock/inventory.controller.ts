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
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create inventory' })
  create(
    @CurrentUser() user: User, @Body() createInventoryDto: CreateInventoryDto,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.inventoryService.create(user, createInventoryDto);
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
      return this.inventoryService.findByProduct(user, productId);
    }
    if (warehouseId) {
      return this.inventoryService.findByWarehouse(user, warehouseId);
    }
    return this.inventoryService.findAll(user);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get inventory count' })
  count(@CurrentUser() user: User) {
    return this.inventoryService.count(user);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock items' })
  getLowStock(@CurrentUser() user: User) {
    return this.inventoryService.getLowStockItems(user);
  }

  @Get('out-of-stock')
  @ApiOperation({ summary: 'Get out of stock items' })
  getOutOfStock(@CurrentUser() user: User) {
    return this.inventoryService.getOutOfStockItems(user);
  }

  @Get('total-value')
  @ApiOperation({ summary: 'Get total inventory value' })
  getTotalValue(@CurrentUser() user: User) {
    return this.inventoryService.getTotalValue(user);
  }

  @Get('product/:productId/warehouse/:warehouseId')
  @ApiOperation({ summary: 'Get inventory by product and warehouse' })
  findByProductAndWarehouse(
    @Param('productId') productId: string,
    @CurrentUser() user: User, @Param('warehouseId') warehouseId: string,
  ) {
    return this.inventoryService.findByProductAndWarehouse(user, productId, warehouseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.inventoryService.findOne(user, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update inventory' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body() updateInventoryDto: UpdateInventoryDto,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.inventoryService.update(user, id, updateInventoryDto);
  }

  @Patch(':id/adjust')
  @ApiOperation({ summary: 'Adjust inventory quantity' })
  adjust(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body() adjustInventoryDto: AdjustInventoryDto,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.inventoryService.adjustQuantity(user, id, adjustInventoryDto);
  }

  @Patch(':id/reserve')
  @ApiOperation({ summary: 'Reserve inventory' })
  reserve(
    @Param('id') id: string,
    @Body() body: { quantity: number },
    @CurrentUser() user: User,
  ) {
    return this.inventoryService.reserve(user, id, body.quantity);
  }

  @Patch(':id/release')
  @ApiOperation({ summary: 'Release reserved inventory' })
  release(
    @Param('id') id: string,
    @Body() body: { quantity: number },
    @CurrentUser() user: User,
  ) {
    return this.inventoryService.release(user, id, body.quantity);
  }

  @Patch(':id/fulfill')
  @ApiOperation({ summary: 'Fulfill reservation' })
  fulfill(
    @Param('id') id: string,
    @Body() body: { quantity: number },
    @CurrentUser() user: User,
  ) {
    return this.inventoryService.fulfillReservation(user, id, body.quantity);
  }

  @Patch(':id/count')
  @ApiOperation({ summary: 'Update stock count' })
  updateCount(
    @Param('id') id: string,
    @Body() body: { countedQuantity: number },
    @CurrentUser() user: User,
    @Request() req: Express.Request & { user?: { id: string } },
  ) {
    return this.inventoryService.updateStockCount(user, id, body.countedQuantity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inventory' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.inventoryService.remove(user, id);
    return { message: 'Inventory deleted successfully' };
  }
}
