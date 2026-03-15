import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  private secureOrderRepo: SecureRepository<Order>;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureOrderRepo = new SecureRepository(orderRepository, permissionService, 'Order');
  }

  async findAll(
    user: User,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Order[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const allOrders = await this.secureOrderRepo.find(user, {
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });

    const total = allOrders.length;
    const data = allOrders.slice((page - 1) * limit, page * limit);

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

  async findOne(user: User, id: string): Promise<Order> {
    const cacheKey = generateCacheKey('order', user.tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const order = await this.secureOrderRepo.findOne(user, { where: { id } });

        if (!order) {
          throw new NotFoundException(`Order with ID ${id} not found`);
        }

        return order;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findByOrderNumber(user: User, orderNumber: string): Promise<Order | null> {
    return this.secureOrderRepo.findOne(user, {
      where: { orderNumber },
    });
  }

  async create(user: User, createOrderDto: CreateOrderDto): Promise<Order> {
    // Check order number uniqueness within tenant
    const existingOrder = await this.findByOrderNumber(user, createOrderDto.orderNumber);
    if (existingOrder) {
      throw new ConflictException(`Order with number ${createOrderDto.orderNumber} already exists`);
    }

    // Separate items from DTO to handle type conversion
    const { items, ...orderData } = createOrderDto;

    const order = {
      ...orderData,
      status: createOrderDto.status || 'draft',
      // Store items array as JSONB - entity will handle conversion via orderItems setter
      orderItems: items,
    };

    return this.secureOrderRepo.save(user, order);
  }

  async update(user: User, id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(user, id);

    // Check order number uniqueness if being updated
    if (updateOrderDto.orderNumber && updateOrderDto.orderNumber !== order.orderNumber) {
      const existingOrder = await this.findByOrderNumber(user, updateOrderDto.orderNumber);
      if (existingOrder) {
        throw new ConflictException(
          `Order with number ${updateOrderDto.orderNumber} already exists`,
        );
      }
    }

    Object.assign(order, updateOrderDto);
    const updated = await this.secureOrderRepo.save(user, order);

    // Invalidate cache
    const cacheKey = generateCacheKey('order', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async remove(user: User, id: string): Promise<void> {
    const order = await this.findOne(user, id);
    await this.secureOrderRepo.remove(user, order);

    // Invalidate cache
    const cacheKey = generateCacheKey('order', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async updateStatus(user: User, id: string, status: string): Promise<Order> {
    const order = await this.findOne(user, id);
    order.status = status;
    const updated = await this.secureOrderRepo.save(user, order);

    // Invalidate cache
    const cacheKey = generateCacheKey('order', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async findByCustomer(user: User, customerId: string): Promise<Order[]> {
    return this.secureOrderRepo.find(user, {
      where: { customerId },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(user: User, status: string): Promise<Order[]> {
    return this.secureOrderRepo.find(user, {
      where: { status },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDateRange(user: User, startDate: Date, endDate: Date): Promise<Order[]> {
    return this.secureOrderRepo.find(user, {
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async count(user: User): Promise<number> {
    const orders = await this.secureOrderRepo.find(user, {});
    return orders.length;
  }

  async getTotalRevenue(user: User): Promise<number> {
    const orders = await this.secureOrderRepo.find(user, {});

    const total = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    return total;
  }

  async getRevenueByDateRange(user: User, startDate: Date, endDate: Date): Promise<number> {
    const orders = await this.findByDateRange(user, startDate, endDate);

    const total = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    return total;
  }

  async cancel(user: User, id: string): Promise<Order> {
    const order = await this.findOne(user, id);

    if (order.status === 'delivered' || order.status === 'completed') {
      throw new BadRequestException('Cannot cancel a delivered or completed order');
    }

    order.status = 'cancelled';
    const updated = await this.secureOrderRepo.save(user, order);

    // Invalidate cache
    const cacheKey = generateCacheKey('order', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async ship(user: User, id: string, _trackingNumber: string): Promise<Order> {
    const order = await this.findOne(user, id);

    if (order.status !== 'draft' && order.status !== 'pending' && order.status !== 'processing') {
      throw new BadRequestException('Only draft, pending or processing orders can be shipped');
    }

    order.status = 'shipped';
    // Note: trackingNumber field doesn't exist in current schema
    // Would need migration to add it

    const updated = await this.secureOrderRepo.save(user, order);

    // Invalidate cache
    const cacheKey = generateCacheKey('order', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deliver(user: User, id: string): Promise<Order> {
    const order = await this.findOne(user, id);

    if (order.status !== 'shipped') {
      throw new BadRequestException('Only shipped orders can be delivered');
    }

    order.status = 'delivered';

    const updated = await this.secureOrderRepo.save(user, order);

    // Invalidate cache
    const cacheKey = generateCacheKey('order', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async getPendingOrders(user: User): Promise<Order[]> {
    return this.findByStatus(user, 'pending');
  }

  async getRecentOrders(user: User, limit: number): Promise<Order[]> {
    const allOrders = await this.secureOrderRepo.find(user, {
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });

    return allOrders.slice(0, limit);
  }
}
