import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '@/domains/sales/order/entities/order.entity';
import { Product } from '@/domains/inventory/product/entities/product.entity';
import { Customer } from '@/domains/sales/customer/entities/customer.entity';
import { Inventory } from '@/domains/inventory/stock/entities/inventory.entity';
import { Payment } from '@/domains/accounting/payment/entities/payment.entity';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';
import { User } from '@/common/security/permission.service';
import {
  DashboardOverviewDto,
  MobileDashboardStatsDto,
  SalesChartDataDto,
  TopProductDto,
  TopCustomerDto,
  RevenueByCategoryDto,
  MobileChartDataDto,
  RecentOrderDto,
  LowStockProductDto,
  ChartPeriod,
} from './dto';

/**
 * DashboardService queries multiple entities for analytics
 * Uses direct tenantId filtering instead of SecureRepository for cross-entity aggregations
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly cacheService: CacheService,
  ) {}

  async getOverview(user: User): Promise<DashboardOverviewDto> {
    const cacheKey = generateCacheKey('dashboard:overview', user.tenantId);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        this.logger.log(`Fetching dashboard overview for tenant: ${user.tenantId}`);

        const [revenue, orders, inventory, customers, payments] = await Promise.all([
          this.getRevenueStats(user),
          this.getOrderStats(user),
          this.getInventoryStats(user),
          this.getCustomerStats(user),
          this.getPaymentStats(user),
        ]);

        return { revenue, orders, inventory, customers, payments };
      },
      CacheTTL.MEDIUM,
    );
  }

  async getMobileStats(user: User): Promise<MobileDashboardStatsDto> {
    const cacheKey = generateCacheKey('dashboard:mobile:stats', user.tenantId);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        this.logger.log(`Fetching mobile dashboard stats for tenant: ${user.tenantId}`);

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
          revenueToday,
          revenueWeek,
          revenueMonth,
          ordersToday,
          ordersWeek,
          ordersMonth,
          ordersPending,
          inventoryValue,
          lowStockCount,
          outOfStockCount,
          totalCustomers,
          newCustomers,
        ] = await Promise.all([
          this.calculateRevenue(user, startOfToday, now),
          this.calculateRevenue(user, startOfWeek, now),
          this.calculateRevenue(user, startOfMonth, now),
          this.countOrders(user, startOfToday, now),
          this.countOrders(user, startOfWeek, now),
          this.countOrders(user, startOfMonth, now),
          this.countOrdersByStatus(user, 'pending'),
          this.calculateInventoryValue(user),
          this.countLowStock(user),
          this.countOutOfStock(user),
          this.customerRepository.count({ where: { tenantId: user.tenantId } }),
          this.countNewCustomers(user, startOfMonth, now),
        ]);

        return {
          revenue: { today: revenueToday, week: revenueWeek, month: revenueMonth },
          orders: { today: ordersToday, week: ordersWeek, month: ordersMonth, pending: ordersPending },
          inventory: { totalValue: inventoryValue, lowStockCount, outOfStockCount },
          customers: { total: totalCustomers, new: newCustomers },
          receivables: 0,
          payables: 0,
        };
      },
      CacheTTL.MEDIUM,
    );
  }

  async getSalesChart(user: User, days: number): Promise<SalesChartDataDto[]> {
    const cacheKey = generateCacheKey('dashboard:sales-chart', user.tenantId, days.toString());
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        this.logger.log(`Fetching sales chart for tenant: ${user.tenantId}, days: ${days}`);

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const result = await this.orderRepository
          .createQueryBuilder('order')
          .select('DATE(order.createdAt)', 'date')
          .addSelect('SUM(order.totalAmount)', 'revenue')
          .addSelect('COUNT(order.id)', 'orders')
          .where('order.tenantId = :tenantId', { tenantId: user.tenantId })
          .andWhere('order.createdAt >= :startDate', { startDate })
          .andWhere('order.createdAt <= :endDate', { endDate })
          .andWhere('order.status != :cancelledStatus', { cancelledStatus: 'cancelled' })
          .groupBy('DATE(order.createdAt)')
          .orderBy('DATE(order.createdAt)', 'ASC')
          .getRawMany();

        return result.map((row) => ({
          date: row.date,
          revenue: Number(row.revenue) || 0,
          orders: Number(row.orders) || 0,
        }));
      },
      CacheTTL.LONG,
    );
  }

  async getRevenueChart(user: User, period: ChartPeriod): Promise<MobileChartDataDto> {
    const cacheKey = generateCacheKey('dashboard:revenue-chart', user.tenantId, period);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        this.logger.log(`Fetching revenue chart for tenant: ${user.tenantId}, period: ${period}`);

        const now = new Date();
        let startDate: Date;
        let labels: string[];

        switch (period) {
          case ChartPeriod.WEEK:
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            break;
          case ChartPeriod.MONTH:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            labels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
            break;
          case ChartPeriod.YEAR:
            startDate = new Date(now.getFullYear(), 0, 1);
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            break;
        }

        const result = await this.orderRepository
          .createQueryBuilder('order')
          .select('DATE(order.createdAt)', 'date')
          .addSelect('SUM(order.totalAmount)', 'revenue')
          .where('order.tenantId = :tenantId', { tenantId: user.tenantId })
          .andWhere('order.createdAt >= :startDate', { startDate })
          .andWhere('order.status != :cancelledStatus', { cancelledStatus: 'cancelled' })
          .groupBy('DATE(order.createdAt)')
          .orderBy('DATE(order.createdAt)', 'ASC')
          .getRawMany();

        const values = labels.map(() => 0);
        result.forEach((row) => {
          const date = new Date(row.date);
          let index = 0;
          
          if (period === ChartPeriod.WEEK) {
            index = date.getDay();
          } else if (period === ChartPeriod.MONTH) {
            index = date.getDate() - 1;
          } else {
            index = date.getMonth();
          }
          
          if (index >= 0 && index < values.length) {
            values[index] = Number(row.revenue) || 0;
          }
        });

        return { labels, values };
      },
      CacheTTL.LONG,
    );
  }

  async getTopProducts(user: User, limit: number): Promise<TopProductDto[]> {
    const cacheKey = generateCacheKey('dashboard:top-products', user.tenantId, limit.toString());
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        this.logger.log(`Fetching top products for tenant: ${user.tenantId}, limit: ${limit}`);

        const products = await this.productRepository
          .createQueryBuilder('product')
          .select(['product.id', 'product.name'])
          .where('product.tenantId = :tenantId', { tenantId: user.tenantId })
          .orderBy('product.createdAt', 'DESC')
          .take(limit)
          .getMany();

        return products.map((product) => ({
          id: (product as any).id,
          name: product.name,
          revenue: 0,
          quantity: 0,
        }));
      },
      CacheTTL.LONG,
    );
  }

  async getTopCustomers(user: User, limit: number): Promise<TopCustomerDto[]> {
    const cacheKey = generateCacheKey('dashboard:top-customers', user.tenantId, limit.toString());
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        this.logger.log(`Fetching top customers for tenant: ${user.tenantId}, limit: ${limit}`);

        const result = await this.orderRepository
          .createQueryBuilder('order')
          .select('order.customerId', 'id')
          .addSelect('customer.name', 'name')
          .addSelect('SUM(order.totalAmount)', 'totalSpent')
          .addSelect('COUNT(order.id)', 'orderCount')
          .leftJoin('order.customer', 'customer')
          .where('order.tenantId = :tenantId', { tenantId: user.tenantId })
          .andWhere('order.status != :cancelledStatus', { cancelledStatus: 'cancelled' })
          .groupBy('order.customerId')
          .addGroupBy('customer.name')
          .orderBy('SUM(order.totalAmount)', 'DESC')
          .take(limit)
          .getRawMany();

        return result.map((row) => ({
          id: row.id,
          name: row.name || 'Unknown',
          totalSpent: Number(row.totalSpent) || 0,
          orderCount: Number(row.orderCount) || 0,
        }));
      },
      CacheTTL.LONG,
    );
  }

  async getRevenueByCategory(user: User): Promise<RevenueByCategoryDto[]> {
    const cacheKey = generateCacheKey('dashboard:revenue-by-category', user.tenantId);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        this.logger.log(`Fetching revenue by category for tenant: ${user.tenantId}`);
        return [];
      },
      CacheTTL.LONG,
    );
  }

  async getRecentOrders(user: User, limit: number): Promise<RecentOrderDto[]> {
    const cacheKey = generateCacheKey('dashboard:recent-orders', user.tenantId, limit.toString());
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        this.logger.log(`Fetching recent orders for tenant: ${user.tenantId}, limit: ${limit}`);

        const orders = await this.orderRepository
          .createQueryBuilder('order')
          .select(['order.id', 'order.orderNumber', 'order.totalAmount', 'order.status', 'order.createdAt', 'customer.name'])
          .leftJoin('order.customer', 'customer')
          .where('order.tenantId = :tenantId', { tenantId: user.tenantId })
          .orderBy('order.createdAt', 'DESC')
          .take(limit)
          .getMany();

        return orders.map((order) => ({
          id: order.id,
          code: order.orderNumber,
          customerName: order.customer?.name || 'Unknown',
          totalAmount: Number(order.totalAmount),
          status: order.status,
          orderDate: order.createdAt.toISOString(),
        }));
      },
      CacheTTL.SHORT,
    );
  }

  async getLowStockProducts(user: User, limit: number): Promise<LowStockProductDto[]> {
    const cacheKey = generateCacheKey('dashboard:low-stock', user.tenantId, limit.toString());
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        this.logger.log(`Fetching low stock products for tenant: ${user.tenantId}, limit: ${limit}`);

        const inventory = await this.inventoryRepository
          .createQueryBuilder('inv')
          .select(['inv.id', 'inv.quantity', 'inv.reorderPoint', 'product.id', 'product.name', 'product.sku'])
          .leftJoin('inv.product', 'product')
          .where('inv.tenantId = :tenantId', { tenantId: user.tenantId })
          .andWhere('inv.quantity <= inv.reorderPoint')
          .orderBy('inv.quantity', 'ASC')
          .take(limit)
          .getMany();

        return inventory.map((item) => ({
          id: (item.product as any)?.id || (item as any).id,
          name: item.product?.name || 'Unknown',
          sku: item.product?.sku || 'N/A',
          currentStock: item.quantity,
          minStock: item.reorderPoint || 0,
        }));
      },
      CacheTTL.MEDIUM,
    );
  }

  private async getRevenueStats(user: User) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [today, thisWeek, thisMonth, lastMonth] = await Promise.all([
      this.calculateRevenue(user, startOfToday, now),
      this.calculateRevenue(user, startOfWeek, now),
      this.calculateRevenue(user, startOfMonth, now),
      this.calculateRevenue(user, startOfLastMonth, endOfLastMonth),
    ]);

    const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    return { today, thisWeek, thisMonth, growth };
  }

  private async getOrderStats(user: User) {
    const [total, pending, completed, cancelled] = await Promise.all([
      this.orderRepository.count({ where: { tenantId: user.tenantId } }),
      this.countOrdersByStatus(user, 'pending'),
      this.countOrdersByStatus(user, 'completed'),
      this.countOrdersByStatus(user, 'cancelled'),
    ]);

    return { total, pending, completed, cancelled };
  }

  private async getInventoryStats(user: User) {
    const totalProducts = await this.productRepository.count({ where: { tenantId: user.tenantId } as any });
    const lowStock = await this.countLowStock(user);
    const outOfStock = await this.countOutOfStock(user);
    const totalValue = await this.calculateInventoryValue(user);

    return { totalProducts, lowStock, outOfStock, totalValue };
  }

  private async getCustomerStats(user: User) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const total = await this.customerRepository.count({ where: { tenantId: user.tenantId } });
    const active = await this.customerRepository.count({ where: { tenantId: user.tenantId, status: 'active' } });
    const newCustomers = await this.countNewCustomers(user, startOfMonth, now);

    return { total, active, new: newCustomers };
  }

  private async getPaymentStats(user: User) {
    const [pending, completed, totalAmount] = await Promise.all([
      this.paymentRepository.count({ where: { tenantId: user.tenantId, status: 'pending' } }),
      this.paymentRepository.count({ where: { tenantId: user.tenantId, status: 'completed' } }),
      this.calculateTotalPayments(user),
    ]);

    return { pending, completed, totalAmount };
  }

  private async calculateRevenue(user: User, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .andWhere('order.status != :cancelledStatus', { cancelledStatus: 'cancelled' })
      .getRawOne();

    return Number(result?.total) || 0;
  }

  private async countOrders(user: User, startDate: Date, endDate: Date): Promise<number> {
    return this.orderRepository
      .createQueryBuilder('order')
      .where('order.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .getCount();
  }

  private async countOrdersByStatus(user: User, status: string): Promise<number> {
    return this.orderRepository.count({ where: { tenantId: user.tenantId, status } });
  }

  private async calculateInventoryValue(user: User): Promise<number> {
    const result = await this.inventoryRepository
      .createQueryBuilder('inv')
      .select('SUM(inv.totalValue)', 'total')
      .where('inv.tenantId = :tenantId', { tenantId: user.tenantId })
      .getRawOne();

    return Number(result?.total) || 0;
  }

  private async countLowStock(user: User): Promise<number> {
    return this.inventoryRepository
      .createQueryBuilder('inv')
      .where('inv.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('inv.quantity <= inv.reorderPoint')
      .andWhere('inv.quantity > 0')
      .getCount();
  }

  private async countOutOfStock(user: User): Promise<number> {
    return this.inventoryRepository.count({ where: { tenantId: user.tenantId, quantity: 0 } as any });
  }

  private async countNewCustomers(user: User, startDate: Date, endDate: Date): Promise<number> {
    return this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('customer.createdAt >= :startDate', { startDate })
      .andWhere('customer.createdAt <= :endDate', { endDate })
      .getCount();
  }

  private async calculateTotalPayments(user: User): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.tenantId = :tenantId', { tenantId: user.tenantId })
      .getRawOne();

    return Number(result?.total) || 0;
  }
}
