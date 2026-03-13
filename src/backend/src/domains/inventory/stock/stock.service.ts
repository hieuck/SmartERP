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
import { SecureRepository } from '@/common/security/secure-repository';
import { PermissionService, User, BaseRecord as PermissionRecord } from '@/common/security/permission.service';

@Injectable()
export class StockService {
  private secureInventoryRepo: SecureRepository<Inventory & PermissionRecord>;

  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureInventoryRepo = new SecureRepository(
      inventoryRepository as any,
      permissionService,
      'Inventory',
    );
  }

  async create(user: User, createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    // Check if inventory already exists for this product and warehouse
    const existing = await this.secureInventoryRepo.findOne(user, {
      where: {
        productId: createInventoryDto.productId,
        warehouseId: createInventoryDto.warehouseId || null,
      },
    });

    if (existing) {
      throw new ConflictException('Inventory already exists for this product and warehouse');
    }

    const quantity = createInventoryDto.quantity || 0;
    const unitCost = createInventoryDto.unitCost || 0;
    const totalValue = quantity * unitCost;

    const inventory = {
      ...createInventoryDto,
      quantity,
      availableQuantity: quantity,
      reservedQuantity: 0,
      totalValue,
      lastRestockDate: quantity > 0 ? new Date() : null,
    };

    return await this.secureInventoryRepo.save(user, inventory);
  }

  async findAll(
    user: User,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Inventory[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const allInventory = await this.secureInventoryRepo.find(user, {
      relations: ['product'],
      order: { productId: 'ASC' },
    });

    const total = allInventory.length;
    const data = allInventory.slice((page - 1) * limit, page * limit);

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

  async findOne(user: User, id: string): Promise<Inventory> {
    const cacheKey = generateCacheKey('inventory', user.tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const inventory = await this.secureInventoryRepo.findOne(user, {
          where: { id },
        });

        if (!inventory) {
          throw new NotFoundException(`Inventory with ID ${id} not found`);
        }

        return inventory;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findByProduct(user: User, productId: string): Promise<Inventory[]> {
    return await this.secureInventoryRepo.find(user, {
      where: { productId },
      relations: ['product'],
      order: { warehouseId: 'ASC' },
    });
  }

  async findByWarehouse(user: User, warehouseId: string): Promise<Inventory[]> {
    return await this.secureInventoryRepo.find(user, {
      where: { warehouseId },
      relations: ['product'],
      order: { productId: 'ASC' },
    });
  }

  async findByProductAndWarehouse(
    user: User,
    productId: string,
    warehouseId: string,
  ): Promise<Inventory> {
    const inventory = await this.secureInventoryRepo.findOne(user, {
      where: { productId, warehouseId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found for this product and warehouse');
    }

    return inventory;
  }

  async update(user: User, id: string, updateInventoryDto: UpdateInventoryDto): Promise<Inventory> {
    const inventory = await this.findOne(user, id);

    // Recalculate total value if quantity or unit cost changes
    const newQuantity =
      updateInventoryDto.quantity !== undefined ? updateInventoryDto.quantity : inventory.quantity;
    const newUnitCost =
      updateInventoryDto.unitCost !== undefined ? updateInventoryDto.unitCost : inventory.unitCost;
    const totalValue = newQuantity * (newUnitCost || 0);

    Object.assign(inventory, updateInventoryDto);
    inventory.totalValue = totalValue;

    // Recalculate available quantity
    inventory.availableQuantity = inventory.quantity - inventory.reservedQuantity;

    const updated = await this.secureInventoryRepo.save(user, inventory);

    // Invalidate cache
    const cacheKey = generateCacheKey('inventory', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async adjustQuantity(
    user: User,
    id: string,
    adjustInventoryDto: AdjustInventoryDto,
  ): Promise<Inventory> {
    const inventory = await this.findOne(user, id);

    const newQuantity = inventory.quantity + adjustInventoryDto.adjustment;

    if (newQuantity < 0) {
      throw new BadRequestException('Insufficient inventory');
    }

    inventory.quantity = newQuantity;
    inventory.availableQuantity = newQuantity - inventory.reservedQuantity;
    inventory.totalValue = newQuantity * (inventory.unitCost || 0);

    if (adjustInventoryDto.adjustment > 0) {
      inventory.lastRestockDate = new Date();
    }

    return await this.secureInventoryRepo.save(user, inventory);
  }

  async reserve(user: User, id: string, quantity: number): Promise<Inventory> {
    const inventory = await this.findOne(user, id);

    if (quantity < 0) {
      throw new BadRequestException('Reserve quantity must be positive');
    }

    if (inventory.availableQuantity < quantity) {
      throw new BadRequestException('Insufficient available inventory');
    }

    inventory.reservedQuantity += quantity;
    inventory.availableQuantity -= quantity;

    return await this.secureInventoryRepo.save(user, inventory);
  }

  async release(user: User, id: string, quantity: number): Promise<Inventory> {
    const inventory = await this.findOne(user, id);

    if (quantity < 0) {
      throw new BadRequestException('Release quantity must be positive');
    }

    if (inventory.reservedQuantity < quantity) {
      throw new BadRequestException('Cannot release more than reserved');
    }

    inventory.reservedQuantity -= quantity;
    inventory.availableQuantity += quantity;

    return await this.secureInventoryRepo.save(user, inventory);
  }

  async fulfillReservation(user: User, id: string, quantity: number): Promise<Inventory> {
    const inventory = await this.findOne(user, id);

    if (quantity < 0) {
      throw new BadRequestException('Fulfill quantity must be positive');
    }

    if (inventory.reservedQuantity < quantity) {
      throw new BadRequestException('Cannot fulfill more than reserved');
    }

    inventory.reservedQuantity -= quantity;
    inventory.quantity -= quantity;
    inventory.totalValue = inventory.quantity * (inventory.unitCost || 0);

    return await this.secureInventoryRepo.save(user, inventory);
  }

  async getLowStockItems(user: User): Promise<Inventory[]> {
    const allInventory = await this.secureInventoryRepo.find(user, {
      relations: ['product'],
    });

    return allInventory
      .filter((inv) => inv.reorderPoint > 0 && inv.quantity <= inv.reorderPoint)
      .sort((a, b) => a.quantity - b.quantity);
  }

  async getOutOfStockItems(user: User): Promise<Inventory[]> {
    return await this.secureInventoryRepo.find(user, {
      where: { quantity: 0 },
      relations: ['product'],
      order: { productId: 'ASC' },
    });
  }

  async getTotalValue(user: User): Promise<number> {
    const allInventory = await this.secureInventoryRepo.find(user, {});
    return allInventory.reduce((sum, inv) => sum + Number(inv.totalValue || 0), 0);
  }

  async count(user: User): Promise<number> {
    const inventory = await this.secureInventoryRepo.find(user, {});
    return inventory.length;
  }

  async updateStockCount(user: User, id: string, countedQuantity: number): Promise<Inventory> {
    const inventory = await this.findOne(user, id);

    const adjustment = countedQuantity - inventory.quantity;

    inventory.quantity = countedQuantity;
    inventory.availableQuantity = countedQuantity - inventory.reservedQuantity;
    inventory.totalValue = countedQuantity * (inventory.unitCost || 0);
    inventory.lastCountDate = new Date();

    if (adjustment !== 0) {
      inventory.notes = `Stock count adjustment: ${adjustment > 0 ? '+' : ''}${adjustment}`;
    }

    return await this.secureInventoryRepo.save(user, inventory);
  }

  async remove(user: User, id: string): Promise<void> {
    const inventory = await this.findOne(user, id);

    if (inventory.quantity > 0 || inventory.reservedQuantity > 0) {
      throw new BadRequestException('Cannot delete inventory with stock or reservations');
    }

    await this.secureInventoryRepo.remove(user, inventory);

    // Invalidate cache
    const cacheKey = generateCacheKey('inventory', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }
}
