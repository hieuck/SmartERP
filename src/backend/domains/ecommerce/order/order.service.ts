import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus, ShippingStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../../../core/user/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

/**
 * OrderService handles order CRUD and status management
 */
@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  /**
   * Create order manually (without cart)
   */
  async create(dto: CreateOrderDto, tenantId: string, user?: User): Promise<Order> {
    const order = this.orderRepository.create({
      customerId: user?.id,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      shippingStatus: ShippingStatus.PENDING,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      shippingAddress: dto.shippingAddress,
      billingAddress: dto.billingAddress || dto.shippingAddress,
      shippingMethod: dto.shippingMethod,
      paymentMethod: dto.paymentMethod,
      couponCode: dto.couponCode,
      customerNotes: dto.customerNotes,
      tenantId,
    });

    const orderItems = dto.items.map((item) =>
      this.orderItemRepository.create({
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        productImage: item.productImage,
        price: item.price,
        quantity: item.quantity,
        selectedVariant: item.selectedVariant,
        notes: item.notes,
        tenantId,
      }),
    );

    order.items = orderItems;
    return this.orderRepository.save(order);
  }

  async findOne(id: string, tenantId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id, tenantId },
      relations: ['items', 'customer'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string, tenantId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber, tenantId },
      relations: ['items', 'customer'],
    });

    if (!order) {
      throw new NotFoundException(`Order with number ${orderNumber} not found`);
    }

    return order;
  }

  async findByCustomer(customerId: string, tenantId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { customerId, tenantId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(
    tenantId: string,
    filters?: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      shippingStatus?: ShippingStatus;
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<Order[]> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.customer', 'customer')
      .where('order.tenantId = :tenantId', { tenantId });

    if (filters?.status) {
      query.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters?.paymentStatus) {
      query.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus: filters.paymentStatus,
      });
    }

    if (filters?.shippingStatus) {
      query.andWhere('order.shippingStatus = :shippingStatus', {
        shippingStatus: filters.shippingStatus,
      });
    }

    if (filters?.customerId) {
      query.andWhere('order.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters?.startDate) {
      query.andWhere('order.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('order.createdAt <= :endDate', { endDate: filters.endDate });
    }

    query.orderBy('order.createdAt', 'DESC');
    return query.getMany();
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    tenantId: string,
    user: User,
  ): Promise<Order> {
    const order = await this.findOne(id, tenantId);

    if (dto.status !== undefined) {
      order.status = dto.status;

      if (dto.status === OrderStatus.SHIPPED && !order.shippedAt) {
        order.shippedAt = new Date();
      }
      if (dto.status === OrderStatus.DELIVERED && !order.deliveredAt) {
        order.deliveredAt = new Date();
      }
    }

    if (dto.paymentStatus !== undefined) {
      order.paymentStatus = dto.paymentStatus;

      if (dto.paymentStatus === PaymentStatus.PAID && !order.paidAt) {
        order.paidAt = new Date();
      }
    }

    if (dto.shippingStatus !== undefined) {
      order.shippingStatus = dto.shippingStatus;
    }

    if (dto.trackingNumber !== undefined) {
      order.trackingNumber = dto.trackingNumber;
    }

    if (dto.internalNotes !== undefined) {
      order.internalNotes = dto.internalNotes;
    }

    return this.orderRepository.save(order);
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
    transactionId: string,
    tenantId: string,
  ): Promise<Order> {
    const order = await this.findOne(id, tenantId);

    order.paymentStatus = paymentStatus;
    order.paymentTransactionId = transactionId;

    if (paymentStatus === PaymentStatus.PAID) {
      order.paidAt = new Date();
      if (order.status === OrderStatus.PENDING) {
        order.status = OrderStatus.CONFIRMED;
      }
    }

    return this.orderRepository.save(order);
  }

  async updateShippingStatus(
    id: string,
    shippingStatus: ShippingStatus,
    trackingNumber: string,
    tenantId: string,
  ): Promise<Order> {
    const order = await this.findOne(id, tenantId);

    order.shippingStatus = shippingStatus;
    order.trackingNumber = trackingNumber;

    if (shippingStatus === ShippingStatus.SHIPPED) {
      order.status = OrderStatus.SHIPPED;
      order.shippedAt = new Date();
    }

    if (shippingStatus === ShippingStatus.DELIVERED) {
      order.status = OrderStatus.DELIVERED;
      order.deliveredAt = new Date();
    }

    return this.orderRepository.save(order);
  }

  async cancel(
    id: string,
    dto: CancelOrderDto,
    tenantId: string,
    user: User,
  ): Promise<Order> {
    const order = await this.findOne(id, tenantId);

    if (!order.canBeCancelled) {
      throw new BadRequestException(
        `Order cannot be cancelled. Current status: ${order.status}`,
      );
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledBy = user.id;
    order.cancellationReason = dto.reason;
    order.cancelledAt = new Date();

    return this.orderRepository.save(order);
  }

  async refund(id: string, reason: string, tenantId: string, user: User): Promise<Order> {
    const order = await this.findOne(id, tenantId);

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Order must be paid before refunding');
    }

    order.status = OrderStatus.REFUNDED;
    order.paymentStatus = PaymentStatus.REFUNDED;
    order.cancellationReason = reason;
    order.cancelledBy = user.id;
    order.cancelledAt = new Date();

    return this.orderRepository.save(order);
  }

  async getStatistics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<OrderStatus, number>;
  }> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .where('order.tenantId = :tenantId', { tenantId });

    if (startDate) {
      query.andWhere('order.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('order.createdAt <= :endDate', { endDate });
    }

    const orders = await query.getMany();

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ordersByStatus = orders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      },
      {} as Record<OrderStatus, number>,
    );

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
    };
  }
}
