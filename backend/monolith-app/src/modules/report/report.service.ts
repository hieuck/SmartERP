import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Order } from '../order/entities/order.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Material } from '../production/entities/material.entity';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    private readonly cacheService: CacheService,
  ) {}

  // Inventory Reports
  async getInventoryReport(tenantId: string): Promise<{
    totalItems: number;
    totalQuantity: number;
    totalValue: number;
    items: Inventory[];
  }> {
    const cacheKey = generateCacheKey('report:inventory', tenantId);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Use aggregation for summary stats
        const stats = await this.inventoryRepository
          .createQueryBuilder('inv')
          .select('COUNT(inv.id)', 'totalItems')
          .addSelect('SUM(inv.quantity)', 'totalQuantity')
          .addSelect('SUM(inv.totalValue)', 'totalValue')
          .where('inv.tenantId = :tenantId', { tenantId })
          .andWhere('inv.deletedAt IS NULL')
          .getRawOne();

        // Get sample items with specific fields for display
        const items = await this.inventoryRepository
          .createQueryBuilder('inv')
          .select([
            'inv.id',
            'inv.productId',
            'inv.warehouseId',
            'inv.quantity',
            'inv.availableQuantity',
            'inv.reservedQuantity',
            'inv.totalValue',
            'inv.reorderPoint',
          ])
          .where('inv.tenantId = :tenantId', { tenantId })
          .andWhere('inv.deletedAt IS NULL')
          .orderBy('inv.totalValue', 'DESC')
          .take(100) // Limit to top 100 items
          .getMany();

        return {
          totalItems: Number(stats.totalItems) || 0,
          totalQuantity: Number(stats.totalQuantity) || 0,
          totalValue: Number(stats.totalValue) || 0,
          items,
        };
      },
      CacheTTL.LONG, // Reports can be cached longer
    );
  }

  async getLowStockReport(tenantId: string): Promise<{
    totalItems: number;
    items: Inventory[];
  }> {
    const cacheKey = generateCacheKey('report:lowstock', tenantId);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const lowStock = await this.inventoryRepository
          .createQueryBuilder('inv')
          .select([
            'inv.id',
            'inv.productId',
            'inv.warehouseId',
            'inv.quantity',
            'inv.availableQuantity',
            'inv.reservedQuantity',
            'inv.reorderPoint',
            'inv.totalValue',
          ])
          .where('inv.tenantId = :tenantId', { tenantId })
          .andWhere('inv.quantity <= inv.reservedQuantity + 10')
          .andWhere('inv.deletedAt IS NULL')
          .orderBy('inv.quantity', 'ASC')
          .getMany();

        return {
          totalItems: lowStock.length,
          items: lowStock,
        };
      },
      CacheTTL.MEDIUM,
    );
  }

  // Sales Reports
  async getSalesReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    period: { startDate: Date; endDate: Date };
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    sampleOrders: Order[];
  }> {
    const cacheKey = generateCacheKey(
      'report:sales',
      tenantId,
      `${startDate.toISOString()}-${endDate.toISOString()}`,
    );
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Use database aggregation instead of loading all orders
        const result = await this.orderRepository
          .createQueryBuilder('order')
          .select('COUNT(order.id)', 'totalOrders')
          .addSelect('SUM(order.totalAmount)', 'totalRevenue')
          .addSelect('AVG(order.totalAmount)', 'averageOrderValue')
          .where('order.tenantId = :tenantId', { tenantId })
          .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
          .getRawOne();

        // Get sample orders for details (paginated) with specific fields
        const orders = await this.orderRepository
          .createQueryBuilder('order')
          .select([
            'order.id',
            'order.orderNumber',
            'order.totalAmount',
            'order.status',
            'order.createdAt',
            'order.customerId',
          ])
          .where('order.tenantId = :tenantId', { tenantId })
          .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
          .orderBy('order.createdAt', 'DESC')
          .take(10)
          .getMany();

        return {
          period: { startDate, endDate },
          totalOrders: Number(result.totalOrders) || 0,
          totalRevenue: Number(result.totalRevenue) || 0,
          averageOrderValue: Number(result.averageOrderValue) || 0,
          sampleOrders: orders,
        };
      },
      CacheTTL.LONG, // Sales reports can be cached longer
    );
  }

  async getTopProducts(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<{
    period: { startDate: Date; endDate: Date };
    products: Product[];
  }> {
    const cacheKey = generateCacheKey(
      'report:topproducts',
      tenantId,
      `${startDate.toISOString()}-${endDate.toISOString()}-${limit}`,
    );
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // This would need order items data, simplified version
        const products = await this.productRepository.find({
          where: { tenantId },
          take: limit,
          order: { createdAt: 'DESC' },
        });

        return {
          period: { startDate, endDate },
          products,
        };
      },
      CacheTTL.LONG,
    );
  }

  // Customer Reports
  async getCustomerReport(tenantId: string): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    totalOrders: number;
    customers: Customer[];
  }> {
    const cacheKey = generateCacheKey('report:customer', tenantId);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const customers = await this.customerRepository.find({
          where: { tenantId },
        });

        const orders = await this.orderRepository.find({
          where: { tenantId },
        });

        return {
          totalCustomers: customers.length,
          activeCustomers: customers.filter((c) => c.status === 'active').length,
          totalOrders: orders.length,
          customers,
        };
      },
      CacheTTL.LONG,
    );
  }

  // Production Reports
  async getMaterialsReport(tenantId: string): Promise<{
    totalMaterials: number;
    totalValue: number;
    lowStock: number;
    materials: Material[];
  }> {
    const cacheKey = generateCacheKey('report:materials', tenantId);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const materials = await this.materialRepository.find({
          where: { tenantId },
        });

        const totalValue = materials.reduce((sum, m) => {
          return sum + Number(m.stockQuantity) * Number(m.purchasePrice);
        }, 0);

        return {
          totalMaterials: materials.length,
          totalValue,
          lowStock: materials.filter(
            (m) => m.reorderPoint && Number(m.stockQuantity) <= Number(m.reorderPoint),
          ).length,
          materials,
        };
      },
      CacheTTL.LONG,
    );
  }

  // Dashboard Summary
  async getDashboardSummary(tenantId: string): Promise<{
    summary: {
      products: number;
      inventory: number;
      orders: number;
      customers: number;
      materials: number;
      totalRevenue: number;
    };
    recentOrders: Order[];
  }> {
    const cacheKey = generateCacheKey('report:dashboard', tenantId);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [products, inventory, orders, customers, materials] = await Promise.all([
          this.productRepository.count({ where: { tenantId } }),
          this.inventoryRepository.count({ where: { tenantId } }),
          this.orderRepository.count({ where: { tenantId } }),
          this.customerRepository.count({ where: { tenantId } }),
          this.materialRepository.count({ where: { tenantId } }),
        ]);

        const recentOrders = await this.orderRepository
          .createQueryBuilder('order')
          .select([
            'order.id',
            'order.orderNumber',
            'order.totalAmount',
            'order.status',
            'order.createdAt',
            'order.customerId',
          ])
          .where('order.tenantId = :tenantId', { tenantId })
          .orderBy('order.createdAt', 'DESC')
          .take(5)
          .getMany();

        const totalRevenue = recentOrders.reduce(
          (sum, order) => sum + Number(order.totalAmount),
          0,
        );

        return {
          summary: {
            products,
            inventory,
            orders,
            customers,
            materials,
            totalRevenue,
          },
          recentOrders,
        };
      },
      CacheTTL.MEDIUM, // Dashboard refreshes more frequently
    );
  }
}
