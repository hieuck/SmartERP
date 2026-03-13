import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { StockValuation } from '../enums/inventory.enum';

@Injectable()
export class ValuationService {
  constructor(
    @InjectRepository(StockValuation)
    private readonly valuationRepository: Repository<StockValuation>,
  ) {}

  /**
   * Calculate FIFO cost for a given quantity
   * Uses oldest stock valuations first (First In, First Out)
   */
  async calculateFIFO(
    productId: string,
    warehouseId: string,
    quantity: number,
  ): Promise<{ cost: number; valuations: StockValuation[] }> {
    // Get available stock valuations (FIFO order: oldest first)
    const valuations = await this.valuationRepository.find({
      where: {
        productId,
        warehouseId,
        quantity: MoreThan(0),
      },
      order: { date: 'ASC', createdAt: 'ASC' },
    });

    let remainingQty = quantity;
    let totalCost = 0;
    const usedValuations: StockValuation[] = [];

    for (const valuation of valuations) {
      if (remainingQty <= 0) break;

      const qtyToUse = Math.min(remainingQty, valuation.quantity);
      const cost = qtyToUse * valuation.unitCost;

      totalCost += cost;
      remainingQty -= qtyToUse;

      usedValuations.push({
        ...valuation,
        quantity: qtyToUse,
        totalCost: cost,
      });

      // Update valuation quantity
      valuation.quantity -= qtyToUse;
      await this.valuationRepository.save(valuation);
    }

    if (remainingQty > 0) {
      throw new BadRequestException(
        `Insufficient stock for FIFO calculation. Required: ${quantity}, Available: ${quantity - remainingQty}`,
      );
    }

    return {
      cost: totalCost,
      valuations: usedValuations,
    };
  }

  /**
   * Add new stock valuation (when stock is received)
   */
  async addStockValuation(
    productId: string,
    warehouseId: string,
    quantity: number,
    unitCost: number,
    referenceType: string,
    referenceId: string,
    tenantId: string,
  ): Promise<StockValuation> {
    const valuation = this.valuationRepository.create({
      productId,
      warehouseId,
      quantity,
      unitCost,
      totalCost: quantity * unitCost,
      date: new Date(),
      referenceType,
      referenceId,
      tenantId,
    });

    return this.valuationRepository.save(valuation);
  }

  /**
   * Calculate average cost for a product in a warehouse
   */
  async getAverageCost(
    productId: string,
    warehouseId: string,
  ): Promise<number> {
    const result = await this.valuationRepository
      .createQueryBuilder('v')
      .select('SUM(v.totalCost) / SUM(v.quantity)', 'avgCost')
      .where('v.productId = :productId', { productId })
      .andWhere('v.warehouseId = :warehouseId', { warehouseId })
      .andWhere('v.quantity > 0')
      .getRawOne();

    return result?.avgCost || 0;
  }

  /**
   * Get valuation report for a product in a warehouse
   */
  async getValuationReport(
    productId: string,
    warehouseId: string,
  ): Promise<{
    totalQuantity: number;
    totalValue: number;
    averageCost: number;
    valuations: StockValuation[];
  }> {
    const valuations = await this.valuationRepository.find({
      where: {
        productId,
        warehouseId,
        quantity: MoreThan(0),
      },
      order: { date: 'ASC' },
    });

    const totalQuantity = valuations.reduce(
      (sum, v) => sum + Number(v.quantity),
      0,
    );
    const totalValue = valuations.reduce(
      (sum, v) => sum + Number(v.totalCost),
      0,
    );
    const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    return {
      totalQuantity,
      totalValue,
      averageCost,
      valuations,
    };
  }
}
