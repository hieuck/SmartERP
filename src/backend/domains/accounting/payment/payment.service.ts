import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';
import { SecureRepository } from '@/common/security/secure-repository';
import { PermissionService, User } from '@/common/security/permission.service';

@Injectable()
export class PaymentService {
  private securePaymentRepo: SecureRepository<Payment>;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.securePaymentRepo = new SecureRepository(paymentRepository, permissionService, 'Payment');
  }

  async findAll(user: User): Promise<Payment[]> {
    return this.securePaymentRepo.find(user, {
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(user: User, id: string): Promise<Payment> {
    const cacheKey = generateCacheKey('payment', user.tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const payment = await this.securePaymentRepo.findOne(user, {
          where: { id },
        });

        if (!payment) {
          throw new NotFoundException(`Payment with ID ${id} not found`);
        }

        return payment;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findByOrder(user: User, orderId: string): Promise<Payment[]> {
    return this.securePaymentRepo.find(user, {
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(user: User, status: string): Promise<Payment[]> {
    return this.securePaymentRepo.find(user, {
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async create(user: User, data: Partial<Payment>): Promise<Payment> {
    const payment = {
      ...data,
      status: data.status || 'pending',
    };
    return this.securePaymentRepo.save(user, payment);
  }

  async update(user: User, id: string, data: Partial<Payment>): Promise<Payment> {
    const payment = await this.findOne(user, id);
    Object.assign(payment, data);
    const updated = await this.securePaymentRepo.save(user, payment);

    // Invalidate cache
    const cacheKey = generateCacheKey('payment', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async remove(user: User, id: string): Promise<void> {
    const payment = await this.findOne(user, id);
    await this.securePaymentRepo.remove(user, payment);

    // Invalidate cache
    const cacheKey = generateCacheKey('payment', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async complete(user: User, id: string, transactionId: string): Promise<Payment> {
    const payment = await this.findOne(user, id);

    if (payment.status !== 'pending' && payment.status !== 'processing') {
      throw new BadRequestException('Only pending or processing payments can be completed');
    }

    payment.status = 'completed';
    payment.transactionId = transactionId;
    payment.paymentDate = new Date();

    const updated = await this.securePaymentRepo.save(user, payment);

    // Invalidate cache
    const cacheKey = generateCacheKey('payment', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async fail(user: User, id: string, reason: string): Promise<Payment> {
    const payment = await this.findOne(user, id);

    if (payment.status === 'completed') {
      throw new BadRequestException('Cannot fail a completed payment');
    }

    payment.status = 'failed';
    payment.notes = (payment.notes || '') + `\nFailed: ${reason}`;

    const updated = await this.securePaymentRepo.save(user, payment);

    // Invalidate cache
    const cacheKey = generateCacheKey('payment', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async refund(user: User, id: string): Promise<Payment> {
    const payment = await this.findOne(user, id);

    if (payment.status !== 'completed') {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    payment.status = 'refunded';

    const updated = await this.securePaymentRepo.save(user, payment);

    // Invalidate cache
    const cacheKey = generateCacheKey('payment', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async count(user: User): Promise<number> {
    const payments = await this.securePaymentRepo.find(user, {});
    return payments.length;
  }

  async getTotalAmount(user: User, status?: string): Promise<number> {
    const where: { status?: string } = {};
    if (status) {
      where.status = status;
    }

    const payments = await this.securePaymentRepo.find(user, {
      where: Object.keys(where).length > 0 ? where : undefined,
    });
    return payments.reduce((sum, p) => sum + Number(p.amount), 0);
  }

  async getPaymentsByDateRange(user: User, startDate: Date, endDate: Date): Promise<Payment[]> {
    return this.securePaymentRepo.find(user, {
      where: {
        paymentDate: Between(startDate, endDate),
      },
      order: { paymentDate: 'DESC' },
    });
  }

  async getPaymentStatistics(user: User): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    refunded: number;
    totalAmount: number;
    completedAmount: number;
    successRate: number;
  }> {
    const payments = await this.securePaymentRepo.find(user, {});

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
