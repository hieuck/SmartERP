import { Injectable } from '@nestjs/common';
import { User } from '@/common/security/permission.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../domains/inventory/product/entities/product.entity';
import { Customer } from '../../domains/sales/customer/entities/customer.entity';
import { Order } from '../../domains/sales/order/entities/order.entity';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private cacheService: CacheService,
  ) {}

  async search(user: User, query: string): Promise<SearchResult[]> {
    const cacheKey = generateCacheKey('search', user.tenantId, `query:${query}`);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const results: SearchResult[] = [];

        // Search products
        const products = await this.productRepository
          .createQueryBuilder('product')
          .where('product.tenantId = :tenantId', { tenantId: user.tenantId })
          .andWhere(
            '(product.name ILIKE :query OR product.sku ILIKE :query OR product.description ILIKE :query)',
            {
              query: `%${query}%`,
            },
          )
          .take(10)
          .getMany();

        products.forEach((product) => {
          results.push({
            type: 'product',
            id: (product as any).id,
            title: product.name,
            description: `SKU: ${product.sku} - Price: ${product.price}`,
            metadata: { sku: product.sku, price: product.price },
          });
        });

        // Search customers
        const customers = await this.customerRepository
          .createQueryBuilder('customer')
          .where('customer.tenantId = :tenantId', { tenantId: user.tenantId })
          .andWhere(
            '(customer.name ILIKE :query OR customer.email ILIKE :query OR customer.phone ILIKE :query)',
            {
              query: `%${query}%`,
            },
          )
          .take(10)
          .getMany();

        customers.forEach((customer) => {
          results.push({
            type: 'customer',
            id: customer.id,
            title: customer.name,
            description: `Email: ${customer.email} - Phone: ${customer.phone}`,
            metadata: { email: customer.email, phone: customer.phone },
          });
        });

        // Search orders
        const orders = await this.orderRepository
          .createQueryBuilder('order')
          .where('order.tenantId = :tenantId', { tenantId: user.tenantId })
          .andWhere('order.orderNumber ILIKE :query', {
            query: `%${query}%`,
          })
          .take(10)
          .getMany();

        orders.forEach((order) => {
          results.push({
            type: 'order',
            id: order.id,
            title: `Order ${order.orderNumber}`,
            description: `Total: ${order.totalAmount} - Status: ${order.status}`,
            metadata: {
              orderNumber: order.orderNumber,
              total: order.totalAmount,
              status: order.status,
            },
          });
        });

        return results;
      },
      CacheTTL.SHORT, // Search results cached for short time (1 minute)
    );
  }

  async searchByType(tenantId: string, type: string, query: string): Promise<SearchResult[]> {
    const cacheKey = generateCacheKey('search', tenantId, `type:${type}:${query}`);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const allResults = await this.search({ tenantId } as User, query);
        return allResults.filter((result) => result.type === type);
      },
      CacheTTL.SHORT, // Type-specific search also cached for short time
    );
  }
}
