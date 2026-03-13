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
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SupplierService {
  private secureSupplierRepo: SecureRepository<Supplier>;

  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureSupplierRepo = new SecureRepository(
      supplierRepository,
      permissionService,
      'Supplier',
    );
  }

  async findAll(
    user: User,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Supplier[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const allSuppliers = await this.secureSupplierRepo.find(user, {
      order: { createdAt: 'DESC' },
    });

    const total = allSuppliers.length;
    const data = allSuppliers.slice((page - 1) * limit, page * limit);

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

  async findOne(user: User, id: string): Promise<Supplier> {
    const cacheKey = generateCacheKey('supplier', user.tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const supplier = await this.secureSupplierRepo.findOne(user, {
          where: { id },
        });

        if (!supplier) {
          throw new NotFoundException(`Supplier with ID ${id} not found`);
        }

        return supplier;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findByEmail(user: User, email: string): Promise<Supplier | null> {
    return this.secureSupplierRepo.findOne(user, {
      where: { email },
    });
  }

  async create(user: User, createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    // Check email uniqueness within tenant
    const existingSupplier = await this.findByEmail(user, createSupplierDto.email);
    if (existingSupplier) {
      throw new ConflictException(`Supplier with email ${createSupplierDto.email} already exists`);
    }

    const supplier = {
      ...createSupplierDto,
      status: createSupplierDto.status || 'active',
      paymentTerms: 0,
      currentBalance: 0,
    };

    return this.secureSupplierRepo.save(user, supplier);
  }

  async update(user: User, id: string, updateSupplierDto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(user, id);

    // Check email uniqueness if email is being updated
    if (updateSupplierDto.email && updateSupplierDto.email !== supplier.email) {
      const existingSupplier = await this.findByEmail(user, updateSupplierDto.email);
      if (existingSupplier) {
        throw new ConflictException(
          `Supplier with email ${updateSupplierDto.email} already exists`,
        );
      }
    }

    Object.assign(supplier, updateSupplierDto);
    const updated = await this.secureSupplierRepo.save(user, supplier);

    // Invalidate cache
    const cacheKey = generateCacheKey('supplier', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async remove(user: User, id: string): Promise<void> {
    const supplier = await this.findOne(user, id);
    await this.secureSupplierRepo.remove(user, supplier);

    // Invalidate cache
    const cacheKey = generateCacheKey('supplier', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async updateBalance(user: User, id: string, amount: number): Promise<Supplier> {
    const supplier = await this.findOne(user, id);
    supplier.currentBalance = Number(supplier.currentBalance) + amount;
    const updated = await this.secureSupplierRepo.save(user, supplier);

    // Invalidate cache
    const cacheKey = generateCacheKey('supplier', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async updatePaymentTerms(user: User, id: string, paymentTerms: number): Promise<Supplier> {
    if (paymentTerms < 0) {
      throw new BadRequestException('Payment terms cannot be negative');
    }

    const supplier = await this.findOne(user, id);
    supplier.paymentTerms = paymentTerms;
    const updated = await this.secureSupplierRepo.save(user, supplier);

    // Invalidate cache
    const cacheKey = generateCacheKey('supplier', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async activate(user: User, id: string): Promise<Supplier> {
    const supplier = await this.findOne(user, id);
    supplier.status = 'active';
    const updated = await this.secureSupplierRepo.save(user, supplier);

    // Invalidate cache
    const cacheKey = generateCacheKey('supplier', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deactivate(user: User, id: string): Promise<Supplier> {
    const supplier = await this.findOne(user, id);
    supplier.status = 'inactive';
    const updated = await this.secureSupplierRepo.save(user, supplier);

    // Invalidate cache
    const cacheKey = generateCacheKey('supplier', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async search(user: User, query: string): Promise<Supplier[]> {
    const allSuppliers = await this.secureSupplierRepo.find(user, {
      order: { createdAt: 'DESC' },
    });

    return allSuppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.email.toLowerCase().includes(query.toLowerCase()) ||
        (s.phone && s.phone.includes(query)),
    );
  }

  async findByStatus(user: User, status: string): Promise<Supplier[]> {
    return this.secureSupplierRepo.find(user, {
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async count(user: User): Promise<number> {
    const suppliers = await this.secureSupplierRepo.find(user, {});
    return suppliers.length;
  }

  async getTopSuppliers(user: User, limit: number): Promise<Supplier[]> {
    const allSuppliers = await this.secureSupplierRepo.find(user, {});
    return allSuppliers
      .sort((a, b) => Number(b.currentBalance) - Number(a.currentBalance))
      .slice(0, limit);
  }

  async getSuppliersWithHighBalance(user: User, threshold: number): Promise<Supplier[]> {
    const allSuppliers = await this.secureSupplierRepo.find(user, {});
    return allSuppliers
      .filter((s) => Number(s.currentBalance) >= threshold)
      .sort((a, b) => Number(b.currentBalance) - Number(a.currentBalance));
  }
}
