import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SerialNumber } from './entities/serial-number.entity';
import { Batch } from './entities/batch.entity';
import { BatchStock } from './entities/batch-stock.entity';
import { Product } from '@/domains/inventory/product/entities/product.entity';
import { SerialNumberStatus } from './enums/serial-number-status.enum';
import { CreateSerialNumberDto } from './dto/create-serial-number.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { User } from '@/common/security/permission.service';

@Injectable()
export class SerialBatchService {
  constructor(
    @InjectRepository(SerialNumber)
    private readonly serialRepository: Repository<SerialNumber>,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    @InjectRepository(BatchStock)
    private readonly batchStockRepository: Repository<BatchStock>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Create a new serial number
   */
  async createSerialNumber(dto: CreateSerialNumberDto, user: User): Promise<SerialNumber> {
    // Check if serial number already exists
    const existing = await this.serialRepository.findOne({
      where: { number: dto.number, tenantId: user.tenantId },
    });

    if (existing) {
      throw new BadRequestException(`Serial number ${dto.number} already exists`);
    }

    // Validate product exists
    const product = await this.productRepository.findOne({
      where: { id: dto.productId, tenantId: user.tenantId } as any,
    });

    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found`);
    }

    // Create serial number
    const serial = this.serialRepository.create({
      ...dto,
      tenantId: user.tenantId,
      status: SerialNumberStatus.AVAILABLE,
    });

    return this.serialRepository.save(serial);
  }

  /**
   * Create a new batch
   */
  async createBatch(dto: CreateBatchDto, user: User): Promise<Batch> {
    // Check if batch number already exists
    const existing = await this.batchRepository.findOne({
      where: { number: dto.number, tenantId: user.tenantId },
    });

    if (existing) {
      throw new BadRequestException(`Batch number ${dto.number} already exists`);
    }

    // Validate product exists
    const product = await this.productRepository.findOne({
      where: { id: dto.productId, tenantId: user.tenantId } as any,
    });

    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found`);
    }

    // Create batch
    const batch = this.batchRepository.create({
      ...dto,
      tenantId: user.tenantId,
    });

    return this.batchRepository.save(batch);
  }

  /**
   * Validate serial numbers are available
   */
  async validateSerialNumbers(serialNumbers: string[], tenantId: string): Promise<void> {
    for (const sn of serialNumbers) {
      const serial = await this.serialRepository.findOne({
        where: { number: sn, tenantId },
      });

      if (!serial) {
        throw new BadRequestException(`Serial number ${sn} not found`);
      }

      if (serial.status !== SerialNumberStatus.AVAILABLE) {
        throw new BadRequestException(
          `Serial number ${sn} is not available (status: ${serial.status})`,
        );
      }
    }
  }

  /**
   * Validate batch has sufficient quantity
   */
  async validateBatchQuantity(
    batchId: string,
    warehouseId: string,
    requiredQty: number,
    tenantId: string,
  ): Promise<void> {
    const batchStock = await this.batchStockRepository.findOne({
      where: { batchId, warehouseId, tenantId },
    });

    if (!batchStock) {
      throw new NotFoundException(
        `Batch stock not found for batch ${batchId} in warehouse ${warehouseId}`,
      );
    }

    if (batchStock.quantity < requiredQty) {
      throw new BadRequestException(
        `Insufficient batch quantity. Available: ${batchStock.quantity}, Required: ${requiredQty}`,
      );
    }
  }

  /**
   * Update serial number locations (for stock transfers)
   */
  async updateSerialLocations(
    serialNumbers: string[],
    warehouseId: string,
    tenantId: string,
  ): Promise<void> {
    for (const sn of serialNumbers) {
      await this.serialRepository.update({ number: sn, tenantId }, { warehouseId });
    }
  }

  /**
   * Update batch stock (for stock transfers)
   */
  async updateBatchStock(
    batchId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    tenantId: string,
  ): Promise<void> {
    // Decrease from warehouse
    await this.batchStockRepository.decrement(
      { batchId, warehouseId: fromWarehouseId, tenantId },
      'quantity',
      quantity,
    );

    // Check if to-warehouse stock exists
    const toStock = await this.batchStockRepository.findOne({
      where: { batchId, warehouseId: toWarehouseId, tenantId },
    });

    if (toStock) {
      // Increment existing stock
      await this.batchStockRepository.increment(
        { batchId, warehouseId: toWarehouseId, tenantId },
        'quantity',
        quantity,
      );
    } else {
      // Create new stock entry
      const newStock = this.batchStockRepository.create({
        batchId,
        warehouseId: toWarehouseId,
        quantity,
        tenantId,
      });
      await this.batchStockRepository.save(newStock);
    }
  }

  /**
   * Get serial numbers by product
   */
  async getSerialNumbersByProduct(productId: string, tenantId: string): Promise<SerialNumber[]> {
    return this.serialRepository.find({
      where: { productId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get batches by product
   */
  async getBatchesByProduct(productId: string, tenantId: string): Promise<Batch[]> {
    return this.batchRepository.find({
      where: { productId, tenantId },
      relations: ['stocks'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get batch stock by warehouse
   */
  async getBatchStockByWarehouse(
    batchId: string,
    warehouseId: string,
    tenantId: string,
  ): Promise<BatchStock | null> {
    return this.batchStockRepository.findOne({
      where: { batchId, warehouseId, tenantId },
    });
  }
}
