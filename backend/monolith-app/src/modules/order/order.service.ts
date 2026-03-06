import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Order[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const [data, total] = await this.orderRepository.findAndCount({
      where: { tenantId },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
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

  async findOne(id: string, tenantId: string): Promise<Order> {
    const cacheKey = generateCacheKey('order', tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const order = await this.orderRepository.findOne({
          where: { id, tenantId },
        });

        if (!order) {
          throw new NotFoundException(`Order with ID ${id} not found`);
        }

        return order;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findByOrderNumber(orderNumber: string, tenantId: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { orderNumber, tenantId },
    });
  }

  async create(createOrderDto: CreateOrderDto, tenantId: string): Promise<Order> {
    // Check order number uniqueness within tenant
    const existingOrder = await this.findByOrderNumber(createOrderDto.orderNumber, tenantId);
    if (existingOrder) {
      throw new ConflictException(`Order with number ${createOrderDto.orderNumber} already exists`);
    }

    // Separate items from DTO to handle type conversion
    const { items, ...orderData } = createOrderDto;

    const order = this.orderRepository.create({
      ...orderData,
      tenantId,
      status: createOrderDto.status || 'draft',
      // Store items array as JSONB - entity will handle conversion via orderItems setter
      orderItems: items,
    });

    return this.orderRepository.save(order);
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, tenantId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);

    // Check order number uniqueness if being updated
    if (updateOrderDto.orderNumber && updateOrderDto.orderNumber !== order.orderNumber) {
      const existingOrder = await this.findByOrderNumber(updateOrderDto.orderNumber, tenantId);
      if (existingOrder) {
        throw new ConflictException(
          `Order with number ${updateOrderDto.orderNumber} already exists`,
        );
      }
    }

    Object.assign(order, updateOrderDto);
    const updated = await this.orderRepository.save(order);

    // Invalidate cache
    const cacheKey = generateCacheKey('order', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const order = await this.findOne(id, tenantId);
    await this.orderRepository.softDelete(order.id);

    // Invalidate cache
    const cacheKey = generateCacheKey('order', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async updateStatus(id: string, status: string, tenantId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);
    order.status = status;
    const updated = await this.orderRepository.save(order);

    // Invalidate cache
    const cacheKey = generateCacheKey('order', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async findByCustomer(customerId: string, tenantId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { customerId, tenantId },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: string, tenantId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { status, tenantId },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date, tenantId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        tenantId,
        createdAt: Between(startDate, endDate),
      },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async count(tenantId: string): Promise<number> {
    return this.orderRepository.count({ where: { tenantId } });
  }

  async getTotalRevenue(tenantId: string): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere("order.status != 'cancelled'")
      .getRawOne();

    return Number(result?.total || 0);
  }

  async getRevenueByDateRange(startDate: Date, endDate: Date, tenantId: string): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere("order.status != 'cancelled'")
      .getRawOne();

    return Number(result?.total || 0);
  }

  async cancel(id: string, tenantId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);

    if (order.status === 'delivered' || order.status === 'completed') {
      throw new BadRequestException('Cannot cancel a delivered or completed order');
    }

    order.status = 'cancelled';
    const updated = await this.orderRepository.save(order);

    // Invalidate cache
    const cacheKey = generateCacheKey('order', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async ship(id: string, trackingNumber: string, tenantId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);

    if (order.status !== 'draft' && order.status !== 'pending' && order.status !== 'processing') {
      throw new BadRequestException('Only draft, pending or processing orders can be shipped');
    }

    order.status = 'shipped';
    // Note: trackingNumber field doesn't exist in current schema
    // Would need migration to add it

    const updated = await this.orderRepository.save(order);

    // Invalidate cache
    const cacheKey = generateCacheKey('order', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deliver(id: string, tenantId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);

    if (order.status !== 'shipped') {
      throw new BadRequestException('Only shipped orders can be delivered');
    }

    order.status = 'delivered';

    const updated = await this.orderRepository.save(order);

    // Invalidate cache
    const cacheKey = generateCacheKey('order', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async getPendingOrders(tenantId: string): Promise<Order[]> {
    return this.findByStatus('pending', tenantId);
  }

  async getRecentOrders(limit: number, tenantId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { tenantId },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
