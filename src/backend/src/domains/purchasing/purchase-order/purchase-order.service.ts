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
import { Repository } from 'typeorm';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrder } from './entities/purchase-order.entity';

const TERMINAL_STATUSES = ['received', 'cancelled'];

@Injectable()
export class PurchaseOrderService {
  private secureRepo: SecureRepository<PurchaseOrder>;

  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureRepo = new SecureRepository(poRepository, permissionService, 'PurchaseOrder');
  }

  async findAll(user: User, page = 1, limit = 20) {
    const all = await this.secureRepo.find(user, {
      relations: ['supplier'],
      order: { createdAt: 'DESC' },
    });
    const total = all.length;
    return {
      data: all.slice((page - 1) * limit, page * limit),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(user: User, id: string): Promise<PurchaseOrder> {
    const cacheKey = generateCacheKey('purchase-order', user.tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const po = await this.secureRepo.findOne(user, { where: { id } });
        if (!po) throw new NotFoundException(`Purchase order ${id} not found`);
        return po;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findByPoNumber(user: User, poNumber: string): Promise<PurchaseOrder | null> {
    return this.secureRepo.findOne(user, { where: { poNumber } });
  }

  async create(user: User, dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const existing = await this.findByPoNumber(user, dto.poNumber);
    if (existing) {
      throw new ConflictException(`Purchase order ${dto.poNumber} already exists`);
    }
    const totalAmount = this.calculateTotal(dto);
    return this.secureRepo.save(user, {
      ...dto,
      orderDate: dto.orderDate ? new Date(dto.orderDate) : undefined,
      status: dto.status || 'draft',
      totalAmount,
      shippingFee: dto.shippingFee || 0,
      discountAmount: dto.discountAmount || 0,
    });
  }

  async update(user: User, id: string, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrder> {
    const po = await this.findOne(user, id);
    if (dto.poNumber && dto.poNumber !== po.poNumber) {
      const existing = await this.findByPoNumber(user, dto.poNumber);
      if (existing) throw new ConflictException(`Purchase order ${dto.poNumber} already exists`);
    }
    Object.assign(po, dto);
    if (dto.items) po.totalAmount = this.calculateTotal({ ...po, ...dto } as any);
    const updated = await this.secureRepo.save(user, po);
    await this.cacheService.del(generateCacheKey('purchase-order', user.tenantId, id));
    return updated;
  }

  async remove(user: User, id: string): Promise<void> {
    const po = await this.findOne(user, id);
    await this.secureRepo.remove(user, po);
    await this.cacheService.del(generateCacheKey('purchase-order', user.tenantId, id));
  }

  async updateStatus(user: User, id: string, status: string): Promise<PurchaseOrder> {
    const po = await this.findOne(user, id);
    if (po.status === 'received' && status === 'cancelled') {
      throw new BadRequestException('Cannot cancel a received purchase order');
    }
    po.status = status;
    const updated = await this.secureRepo.save(user, po);
    await this.cacheService.del(generateCacheKey('purchase-order', user.tenantId, id));
    return updated;
  }

  async findBySupplier(user: User, supplierId: string): Promise<PurchaseOrder[]> {
    return this.secureRepo.find(user, {
      where: { supplierId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(user: User, status: string): Promise<PurchaseOrder[]> {
    return this.secureRepo.find(user, { where: { status }, order: { createdAt: 'DESC' } });
  }

  async getStatistics(user: User) {
    const cacheKey = generateCacheKey('po-statistics', user.tenantId);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const all = await this.secureRepo.find(user, {});
        const totalOrders = all.length;
        const totalAmount = all
          .filter((o) => (TERMINAL_STATUSES.includes(o.status) ? o.status === 'received' : true))
          .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        const byStatus: Record<string, number> = {};
        all.forEach((o) => {
          byStatus[o.status] = (byStatus[o.status] || 0) + 1;
        });
        return {
          totalOrders,
          totalAmount: Math.round(totalAmount * 100) / 100,
          byStatus,
        };
      },
      CacheTTL.SHORT,
    );
  }

  private calculateTotal(
    dto: Pick<CreatePurchaseOrderDto, 'items' | 'shippingFee' | 'discountAmount'>,
  ): number {
    const itemsTotal = (dto.items || []).reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice;
      return sum + lineTotal - (item.discount || 0) + (item.tax || 0);
    }, 0);
    return itemsTotal + (dto.shippingFee || 0) - (dto.discountAmount || 0);
  }
}
