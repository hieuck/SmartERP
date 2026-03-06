import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly cacheService: CacheService,
  ) {}

  async create(
    createInventoryDto: CreateInventoryDto,
    tenantId: string,
    userId?: string,
  ): Promise<Inventory> {
    // Check if inventory already exists for this product and warehouse
    const existing = await this.inventoryRepository.findOne({
      where: {
        productId: createInventoryDto.productId,
        warehouseId: createInventoryDto.warehouseId || null,
        tenantId,
      },
    });

    if (existing) {
      throw new ConflictException('Inventory already exists for this product and warehouse');
    }

    const quantity = createInventoryDto.quantity || 0;
    const unitCost = createInventoryDto.unitCost || 0;
    const totalValue = quantity * unitCost;

    const inventory = this.inventoryRepository.create({
      ...createInventoryDto,
      tenantId,
      quantity,
      availableQuantity: quantity,
      reservedQuantity: 0,
      totalValue,
      lastRestockDate: quantity > 0 ? new Date() : null,
      updatedBy: userId || 'system',
    });

    return await this.inventoryRepository.save(inventory);
  }

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Inventory[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const [data, total] = await this.inventoryRepository.findAndCount({
      where: { tenantId },
      relations: ['product'],
      order: { productId: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string): Promise<Inventory> {
    const cacheKey = generateCacheKey('inventory', tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const inventory = await this.inventoryRepository.findOne({
          where: { id, tenantId },
        });

        if (!inventory) {
          throw new NotFoundException(`Inventory with ID ${id} not found`);
        }

        return inventory;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findByProduct(productId: string, tenantId: string): Promise<Inventory[]> {
    return await this.inventoryRepository.find({
      where: { productId, tenantId },
      relations: ['product'],
      order: { warehouseId: 'ASC' },
    });
  }

  async findByWarehouse(warehouseId: string, tenantId: string): Promise<Inventory[]> {
    return await this.inventoryRepository.find({
      where: { warehouseId, tenantId },
      relations: ['product'],
      order: { productId: 'ASC' },
    });
  }

  async findByProductAndWarehouse(
    productId: string,
    warehouseId: string,
    tenantId: string,
  ): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { productId, warehouseId, tenantId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found for this product and warehouse');
    }

    return inventory;
  }

  async update(
    id: string,
    updateInventoryDto: UpdateInventoryDto,
    tenantId: string,
    userId?: string,
  ): Promise<Inventory> {
    const inventory = await this.findOne(id, tenantId);

    // Recalculate total value if quantity or unit cost changes
    const newQuantity =
      updateInventoryDto.quantity !== undefined ? updateInventoryDto.quantity : inventory.quantity;
    const newUnitCost =
      updateInventoryDto.unitCost !== undefined ? updateInventoryDto.unitCost : inventory.unitCost;
    const totalValue = newQuantity * (newUnitCost || 0);

    Object.assign(inventory, updateInventoryDto);
    inventory.totalValue = totalValue;
    inventory.updatedBy = userId || 'system';

    // Recalculate available quantity
    inventory.availableQuantity = inventory.quantity - inventory.reservedQuantity;

    const updated = await this.inventoryRepository.save(inventory);

    // Invalidate cache
    const cacheKey = generateCacheKey('inventory', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async adjustQuantity(
    id: string,
    adjustInventoryDto: AdjustInventoryDto,
    tenantId: string,
    userId?: string,
  ): Promise<Inventory> {
    const inventory = await this.findOne(id, tenantId);

    const newQuantity = inventory.quantity + adjustInventoryDto.adjustment;

    if (newQuantity < 0) {
      throw new BadRequestException('Insufficient inventory');
    }

    inventory.quantity = newQuantity;
    inventory.availableQuantity = newQuantity - inventory.reservedQuantity;
    inventory.totalValue = newQuantity * (inventory.unitCost || 0);
    inventory.updatedBy = userId || 'system';

    if (adjustInventoryDto.adjustment > 0) {
      inventory.lastRestockDate = new Date();
    }

    return await this.inventoryRepository.save(inventory);
  }

  async reserve(id: string, quantity: number, tenantId: string): Promise<Inventory> {
    const inventory = await this.findOne(id, tenantId);

    if (quantity < 0) {
      throw new BadRequestException('Reserve quantity must be positive');
    }

    if (inventory.availableQuantity < quantity) {
      throw new BadRequestException('Insufficient available inventory');
    }

    inventory.reservedQuantity += quantity;
    inventory.availableQuantity -= quantity;

    return await this.inventoryRepository.save(inventory);
  }

  async release(id: string, quantity: number, tenantId: string): Promise<Inventory> {
    const inventory = await this.findOne(id, tenantId);

    if (quantity < 0) {
      throw new BadRequestException('Release quantity must be positive');
    }

    if (inventory.reservedQuantity < quantity) {
      throw new BadRequestException('Cannot release more than reserved');
    }

    inventory.reservedQuantity -= quantity;
    inventory.availableQuantity += quantity;

    return await this.inventoryRepository.save(inventory);
  }

  async fulfillReservation(id: string, quantity: number, tenantId: string): Promise<Inventory> {
    const inventory = await this.findOne(id, tenantId);

    if (quantity < 0) {
      throw new BadRequestException('Fulfill quantity must be positive');
    }

    if (inventory.reservedQuantity < quantity) {
      throw new BadRequestException('Cannot fulfill more than reserved');
    }

    inventory.reservedQuantity -= quantity;
    inventory.quantity -= quantity;
    inventory.totalValue = inventory.quantity * (inventory.unitCost || 0);

    return await this.inventoryRepository.save(inventory);
  }

  async getLowStockItems(tenantId: string): Promise<Inventory[]> {
    return await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.tenantId = :tenantId', { tenantId })
      .andWhere('inventory.quantity <= inventory.reorderPoint')
      .andWhere('inventory.reorderPoint > 0')
      .orderBy('inventory.quantity', 'ASC')
      .getMany();
  }

  async getOutOfStockItems(tenantId: string): Promise<Inventory[]> {
    return await this.inventoryRepository.find({
      where: { tenantId, quantity: 0 },
      relations: ['product'],
      order: { productId: 'ASC' },
    });
  }

  async getTotalValue(tenantId: string): Promise<number> {
    const result = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .select('SUM(inventory.totalValue)', 'total')
      .where('inventory.tenantId = :tenantId', { tenantId })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  async count(tenantId: string): Promise<number> {
    return await this.inventoryRepository.count({
      where: { tenantId },
    });
  }

  async updateStockCount(
    id: string,
    countedQuantity: number,
    tenantId: string,
    userId?: string,
  ): Promise<Inventory> {
    const inventory = await this.findOne(id, tenantId);

    const adjustment = countedQuantity - inventory.quantity;

    inventory.quantity = countedQuantity;
    inventory.availableQuantity = countedQuantity - inventory.reservedQuantity;
    inventory.totalValue = countedQuantity * (inventory.unitCost || 0);
    inventory.lastCountDate = new Date();
    inventory.updatedBy = userId || 'system';

    if (adjustment !== 0) {
      inventory.notes = `Stock count adjustment: ${adjustment > 0 ? '+' : ''}${adjustment}`;
    }

    return await this.inventoryRepository.save(inventory);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const inventory = await this.findOne(id, tenantId);

    if (inventory.quantity > 0 || inventory.reservedQuantity > 0) {
      throw new BadRequestException('Cannot delete inventory with stock or reservations');
    }

    await this.inventoryRepository.softDelete({ id, tenantId });

    // Invalidate cache
    const cacheKey = generateCacheKey('inventory', tenantId, id);
    await this.cacheService.del(cacheKey);
  }
}
