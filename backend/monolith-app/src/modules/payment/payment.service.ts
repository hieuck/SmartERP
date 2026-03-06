import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(tenantId: string): Promise<Payment[]> {
    return this.paymentRepository
      .createQueryBuilder('payment')
      .select([
        'payment.id',
        'payment.orderId',
        'payment.amount',
        'payment.status',
        'payment.paymentMethod',
        'payment.transactionId',
        'payment.paymentDate',
        'payment.createdAt',
      ])
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.deletedAt IS NULL')
      .orderBy('payment.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string, tenantId: string): Promise<Payment> {
    const cacheKey = generateCacheKey('payment', tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const payment = await this.paymentRepository.findOne({
          where: { id, tenantId },
        });

        if (!payment) {
          throw new NotFoundException(`Payment with ID ${id} not found`);
        }

        return payment;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findByOrder(orderId: string, tenantId: string): Promise<Payment[]> {
    return this.paymentRepository
      .createQueryBuilder('payment')
      .select([
        'payment.id',
        'payment.orderId',
        'payment.amount',
        'payment.status',
        'payment.paymentMethod',
        'payment.transactionId',
        'payment.paymentDate',
        'payment.createdAt',
      ])
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.orderId = :orderId', { orderId })
      .andWhere('payment.deletedAt IS NULL')
      .orderBy('payment.createdAt', 'DESC')
      .getMany();
  }

  async findByStatus(status: string, tenantId: string): Promise<Payment[]> {
    return this.paymentRepository
      .createQueryBuilder('payment')
      .select([
        'payment.id',
        'payment.orderId',
        'payment.amount',
        'payment.status',
        'payment.paymentMethod',
        'payment.transactionId',
        'payment.paymentDate',
        'payment.createdAt',
      ])
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.status = :status', { status })
      .andWhere('payment.deletedAt IS NULL')
      .orderBy('payment.createdAt', 'DESC')
      .getMany();
  }

  async create(data: Partial<Payment>, tenantId: string): Promise<Payment> {
    const payment = this.paymentRepository.create({
      ...data,
      tenantId,
      status: data.status || 'pending',
    });
    return this.paymentRepository.save(payment);
  }

  async update(id: string, data: Partial<Payment>, tenantId: string): Promise<Payment> {
    const payment = await this.findOne(id, tenantId);
    Object.assign(payment, data);
    const updated = await this.paymentRepository.save(payment);

    // Invalidate cache
    const cacheKey = generateCacheKey('payment', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const payment = await this.findOne(id, tenantId);
    await this.paymentRepository.softDelete(payment.id);

    // Invalidate cache
    const cacheKey = generateCacheKey('payment', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async complete(id: string, transactionId: string, tenantId: string): Promise<Payment> {
    const payment = await this.findOne(id, tenantId);

    if (payment.status !== 'pending' && payment.status !== 'processing') {
      throw new BadRequestException('Only pending or processing payments can be completed');
    }

    payment.status = 'completed';
    payment.transactionId = transactionId;
    payment.paymentDate = new Date();

    const updated = await this.paymentRepository.save(payment);

    // Invalidate cache
    const cacheKey = generateCacheKey('payment', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async fail(id: string, reason: string, tenantId: string): Promise<Payment> {
    const payment = await this.findOne(id, tenantId);

    if (payment.status === 'completed') {
      throw new BadRequestException('Cannot fail a completed payment');
    }

    payment.status = 'failed';
    payment.notes = (payment.notes || '') + `\nFailed: ${reason}`;

    const updated = await this.paymentRepository.save(payment);

    // Invalidate cache
    const cacheKey = generateCacheKey('payment', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async refund(id: string, tenantId: string): Promise<Payment> {
    const payment = await this.findOne(id, tenantId);

    if (payment.status !== 'completed') {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    payment.status = 'refunded';

    const updated = await this.paymentRepository.save(payment);

    // Invalidate cache
    const cacheKey = generateCacheKey('payment', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async count(tenantId: string): Promise<number> {
    return this.paymentRepository.count({ where: { tenantId } });
  }

  async getTotalAmount(tenantId: string, status?: string): Promise<number> {
    const where: { tenantId: string; status?: string } = { tenantId };
    if (status) {
      where.status = status;
    }

    const payments = await this.paymentRepository.find({ where });
    return payments.reduce((sum, p) => sum + Number(p.amount), 0);
  }

  async getPaymentsByDateRange(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: {
        tenantId,
        paymentDate: Between(startDate, endDate),
      },
      order: { paymentDate: 'DESC' },
    });
  }

  async getPaymentStatistics(tenantId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    refunded: number;
    totalAmount: number;
    completedAmount: number;
    successRate: number;
  }> {
    const payments = await this.paymentRepository.find({
      where: { tenantId },
    });

    const total = payments.length;
    const completed = payments.filter((p) => p.status === 'completed').length;
    const pending = payments.filter((p) => p.status === 'pending').length;
    const failed = payments.filter((p) => p.status === 'failed').length;
    const refunded = payments.filter((p) => p.status === 'refunded').length;

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const completedAmount = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      total,
      completed,
      pending,
      failed,
      refunded,
      totalAmount,
      completedAmount,
      successRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }
}
