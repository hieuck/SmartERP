import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';
import { User } from '@/common/security/permission.service';
import { Product } from '@/domains/inventory/product/entities/product.entity';
import { Customer } from '@/domains/sales/customer/entities/customer.entity';
import { Order } from '@/domains/sales/order/entities/order.entity';
import { Supplier } from '@/domains/purchasing/supplier/entities/supplier.entity';
import { PurchaseOrder } from '@/domains/purchasing/purchase-order/entities/purchase-order.entity';

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface SearchHit {
  _id: string;
  _index: 'products' | 'customers' | 'suppliers' | 'orders';
  _score: number;
  _source: Record<string, unknown>;
}

export interface SearchResponse {
  hits: {
    total: { value: number };
    hits: SearchHit[];
  };
}

type SearchFilters = Record<string, unknown>;

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    private readonly cacheService: CacheService,
  ) {}

  async search(user: User, query: string): Promise<SearchResult[]> {
    const normalizedQuery = this.normalizeQuery(query);
    if (!normalizedQuery) {
      return [];
    }

    const cacheKey = generateCacheKey('search', user.tenantId, `query:${normalizedQuery}`);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [products, customers, suppliers, salesOrders, purchaseOrders] = await Promise.all([
          this.findProducts(user.tenantId, normalizedQuery, 10),
          this.findCustomers(user.tenantId, normalizedQuery, 10),
          this.findSuppliers(user.tenantId, normalizedQuery, 10),
          this.findSalesOrders(user.tenantId, normalizedQuery, 10),
          this.findPurchaseOrders(user.tenantId, normalizedQuery, 10),
        ]);

        return [
          ...products.map((product) => this.toLegacyProductResult(product)),
          ...customers.map((customer) => this.toLegacyCustomerResult(customer)),
          ...suppliers.map((supplier) => this.toLegacySupplierResult(supplier)),
          ...salesOrders.map((order) => this.toLegacySalesOrderResult(order)),
          ...purchaseOrders.map((order) => this.toLegacyPurchaseOrderResult(order)),
        ];
      },
      CacheTTL.SHORT,
    );
  }

  async searchByType(tenantId: string, type: string, query: string): Promise<SearchResult[]> {
    const normalizedQuery = this.normalizeQuery(query);
    if (!normalizedQuery) {
      return [];
    }

    const normalizedType = (type ?? '').toLowerCase();
    const cacheKey = generateCacheKey(
      'search',
      tenantId,
      `type:${normalizedType}:${normalizedQuery}`,
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        switch (normalizedType) {
          case 'product':
            return (await this.findProducts(tenantId, normalizedQuery, 20)).map((product) =>
              this.toLegacyProductResult(product),
            );
          case 'customer':
            return (await this.findCustomers(tenantId, normalizedQuery, 20)).map((customer) =>
              this.toLegacyCustomerResult(customer),
            );
          case 'supplier':
            return (await this.findSuppliers(tenantId, normalizedQuery, 20)).map((supplier) =>
              this.toLegacySupplierResult(supplier),
            );
          case 'order':
            return [
              ...(await this.findSalesOrders(tenantId, normalizedQuery, 20)).map((order) =>
                this.toLegacySalesOrderResult(order),
              ),
              ...(await this.findPurchaseOrders(tenantId, normalizedQuery, 20)).map((order) =>
                this.toLegacyPurchaseOrderResult(order),
              ),
            ];
          default:
            return [];
        }
      },
      CacheTTL.SHORT,
    );
  }

  async globalSearch(user: User, query: string, from = 0, size = 20): Promise<SearchResponse> {
    const normalizedQuery = this.normalizeQuery(query);
    if (!normalizedQuery) {
      return this.emptyResponse();
    }

    const safeFrom = this.normalizeOffset(from);
    const safeSize = this.normalizeSize(size);
    const cacheKey = generateCacheKey(
      'search',
      user.tenantId,
      `compat:global:${normalizedQuery}:${safeFrom}:${safeSize}`,
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const hits = await this.collectSearchHits(user.tenantId, normalizedQuery, Math.max(safeSize, 20));
        return this.paginateHits(hits, safeFrom, safeSize);
      },
      CacheTTL.SHORT,
    );
  }

  async searchProducts(
    tenantId: string,
    query: string,
    _filters?: SearchFilters,
  ): Promise<SearchResponse> {
    return this.searchHitsByIndex(
      tenantId,
      query,
      'products',
      async (normalizedQuery, size) =>
        (await this.findProducts(tenantId, normalizedQuery, size)).map((product) =>
          this.toProductHit(product),
        ),
    );
  }

  async searchCustomers(
    tenantId: string,
    query: string,
    _filters?: SearchFilters,
  ): Promise<SearchResponse> {
    return this.searchHitsByIndex(
      tenantId,
      query,
      'customers',
      async (normalizedQuery, size) =>
        (await this.findCustomers(tenantId, normalizedQuery, size)).map((customer) =>
          this.toCustomerHit(customer),
        ),
    );
  }

  async searchSuppliers(
    tenantId: string,
    query: string,
    _filters?: SearchFilters,
  ): Promise<SearchResponse> {
    return this.searchHitsByIndex(
      tenantId,
      query,
      'suppliers',
      async (normalizedQuery, size) =>
        (await this.findSuppliers(tenantId, normalizedQuery, size)).map((supplier) =>
          this.toSupplierHit(supplier),
        ),
    );
  }

  async searchOrders(
    tenantId: string,
    query: string,
    _filters?: SearchFilters,
  ): Promise<SearchResponse> {
    return this.searchHitsByIndex(
      tenantId,
      query,
      'orders',
      async (normalizedQuery, size) => {
        const [salesOrders, purchaseOrders] = await Promise.all([
          this.findSalesOrders(tenantId, normalizedQuery, size),
          this.findPurchaseOrders(tenantId, normalizedQuery, size),
        ]);

        return [
          ...salesOrders.map((order) => this.toSalesOrderHit(order)),
          ...purchaseOrders.map((order) => this.toPurchaseOrderHit(order)),
        ];
      },
    );
  }

  private async searchHitsByIndex(
    tenantId: string,
    query: string,
    index: SearchHit['_index'],
    resolver: (normalizedQuery: string, size: number) => Promise<SearchHit[]>,
  ): Promise<SearchResponse> {
    const normalizedQuery = this.normalizeQuery(query);
    if (!normalizedQuery) {
      return this.emptyResponse();
    }

    const size = 20;
    const cacheKey = generateCacheKey('search', tenantId, `compat:${index}:${normalizedQuery}:${size}`);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const hits = await resolver(normalizedQuery, size);
        return {
          hits: {
            total: { value: hits.length },
            hits,
          },
        };
      },
      CacheTTL.SHORT,
    );
  }

  private async collectSearchHits(tenantId: string, query: string, size: number): Promise<SearchHit[]> {
    const [products, customers, suppliers, salesOrders, purchaseOrders] = await Promise.all([
      this.findProducts(tenantId, query, size),
      this.findCustomers(tenantId, query, size),
      this.findSuppliers(tenantId, query, size),
      this.findSalesOrders(tenantId, query, size),
      this.findPurchaseOrders(tenantId, query, size),
    ]);

    return [
      ...products.map((product) => this.toProductHit(product)),
      ...customers.map((customer) => this.toCustomerHit(customer)),
      ...suppliers.map((supplier) => this.toSupplierHit(supplier)),
      ...salesOrders.map((order) => this.toSalesOrderHit(order)),
      ...purchaseOrders.map((order) => this.toPurchaseOrderHit(order)),
    ];
  }

  private async findProducts(tenantId: string, query: string, limit: number): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere(
        '(product.name ILIKE :query OR product.sku ILIKE :query OR product.description ILIKE :query)',
        { query: `%${query}%` },
      )
      .take(limit)
      .getMany();
  }

  private async findCustomers(tenantId: string, query: string, limit: number): Promise<Customer[]> {
    return this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.tenantId = :tenantId', { tenantId })
      .andWhere(
        '(customer.name ILIKE :query OR customer.email ILIKE :query OR customer.phone ILIKE :query)',
        { query: `%${query}%` },
      )
      .take(limit)
      .getMany();
  }

  private async findSuppliers(tenantId: string, query: string, limit: number): Promise<Supplier[]> {
    return this.supplierRepository
      .createQueryBuilder('supplier')
      .where('supplier.tenantId = :tenantId', { tenantId })
      .andWhere(
        '(supplier.name ILIKE :query OR supplier.email ILIKE :query OR supplier.phone ILIKE :query)',
        { query: `%${query}%` },
      )
      .take(limit)
      .getMany();
  }

  private async findSalesOrders(tenantId: string, query: string, limit: number): Promise<Order[]> {
    return this.orderRepository
      .createQueryBuilder('order')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.orderNumber ILIKE :query', { query: `%${query}%` })
      .take(limit)
      .getMany();
  }

  private async findPurchaseOrders(
    tenantId: string,
    query: string,
    limit: number,
  ): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository
      .createQueryBuilder('purchaseOrder')
      .leftJoinAndSelect('purchaseOrder.supplier', 'supplier')
      .where('purchaseOrder.tenantId = :tenantId', { tenantId })
      .andWhere('purchaseOrder.poNumber ILIKE :query', { query: `%${query}%` })
      .take(limit)
      .getMany();
  }

  private toLegacyProductResult(product: Product): SearchResult {
    return {
      type: 'product',
      id: product.id,
      title: product.name,
      description: `SKU: ${product.sku} - Price: ${String(product.price)}`,
      metadata: { sku: product.sku, price: product.price, status: product.status },
    };
  }

  private toLegacyCustomerResult(customer: Customer): SearchResult {
    return {
      type: 'customer',
      id: customer.id,
      title: customer.name,
      description: `Email: ${customer.email} - Phone: ${customer.phone ?? 'N/A'}`,
      metadata: { email: customer.email, phone: customer.phone, status: customer.status },
    };
  }

  private toLegacySupplierResult(supplier: Supplier): SearchResult {
    return {
      type: 'supplier',
      id: supplier.id,
      title: supplier.name,
      description: `Email: ${supplier.email} - Phone: ${supplier.phone ?? 'N/A'}`,
      metadata: { email: supplier.email, phone: supplier.phone, status: supplier.status },
    };
  }

  private toLegacySalesOrderResult(order: Order): SearchResult {
    return {
      type: 'order',
      id: order.id,
      title: `Sales Order ${order.orderNumber}`,
      description: `Total: ${String(order.totalAmount)} - Status: ${order.status}`,
      metadata: {
        orderNumber: order.orderNumber,
        total: order.totalAmount,
        status: order.status,
        orderType: 'sales',
      },
    };
  }

  private toLegacyPurchaseOrderResult(order: PurchaseOrder): SearchResult {
    return {
      type: 'order',
      id: order.id,
      title: `Purchase Order ${order.poNumber}`,
      description: `Total: ${String(order.totalAmount)} - Status: ${order.status}`,
      metadata: {
        orderNumber: order.poNumber,
        total: order.totalAmount,
        status: order.status,
        orderType: 'purchase',
      },
    };
  }

  private toProductHit(product: Product): SearchHit {
    return {
      _id: product.id,
      _index: 'products',
      _score: 1,
      _source: {
        name: product.name,
        sku: product.sku,
        price: product.price,
        salePrice: product.price,
        status: product.status,
      },
    };
  }

  private toCustomerHit(customer: Customer): SearchHit {
    return {
      _id: customer.id,
      _index: 'customers',
      _score: 1,
      _source: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        status: customer.status,
      },
    };
  }

  private toSupplierHit(supplier: Supplier): SearchHit {
    return {
      _id: supplier.id,
      _index: 'suppliers',
      _score: 1,
      _source: {
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        status: supplier.status,
      },
    };
  }

  private toSalesOrderHit(order: Order): SearchHit {
    return {
      _id: order.id,
      _index: 'orders',
      _score: 1,
      _source: {
        code: order.orderNumber,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderDate: order.createdAt,
        status: order.status,
        type: 'sales',
      },
    };
  }

  private toPurchaseOrderHit(order: PurchaseOrder): SearchHit {
    return {
      _id: order.id,
      _index: 'orders',
      _score: 1,
      _source: {
        code: order.poNumber,
        orderNumber: order.poNumber,
        poNumber: order.poNumber,
        totalAmount: order.totalAmount,
        orderDate: order.orderDate ?? order.createdAt,
        status: order.status,
        type: 'purchase',
      },
    };
  }

  private paginateHits(hits: SearchHit[], from: number, size: number): SearchResponse {
    return {
      hits: {
        total: { value: hits.length },
        hits: hits.slice(from, from + size),
      },
    };
  }

  private emptyResponse(): SearchResponse {
    return {
      hits: {
        total: { value: 0 },
        hits: [],
      },
    };
  }

  private normalizeQuery(query: string | undefined): string {
    return typeof query === 'string' ? query.trim() : '';
  }

  private normalizeOffset(from: number | undefined): number {
    return typeof from === 'number' && Number.isFinite(from) && from > 0 ? Math.floor(from) : 0;
  }

  private normalizeSize(size: number | undefined): number {
    return typeof size === 'number' && Number.isFinite(size) && size > 0 ? Math.floor(size) : 20;
  }
}
