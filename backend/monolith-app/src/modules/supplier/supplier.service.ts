import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Supplier[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const [data, total] = await this.supplierRepository.findAndCount({
      where: { tenantId },
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

  async findOne(id: string, tenantId: string): Promise<Supplier> {
    const cacheKey = generateCacheKey('supplier', tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const supplier = await this.supplierRepository.findOne({
          where: { id, tenantId },
        });

        if (!supplier) {
          throw new NotFoundException(`Supplier with ID ${id} not found`);
        }

        return supplier;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findByEmail(email: string, tenantId: string): Promise<Supplier | null> {
    return this.supplierRepository.findOne({
      where: { email, tenantId },
    });
  }

  async create(createSupplierDto: CreateSupplierDto, tenantId: string): Promise<Supplier> {
    // Check email uniqueness within tenant
    const existingSupplier = await this.findByEmail(createSupplierDto.email, tenantId);
    if (existingSupplier) {
      throw new ConflictException(`Supplier with email ${createSupplierDto.email} already exists`);
    }

    const supplier = this.supplierRepository.create({
      ...createSupplierDto,
      tenantId,
      status: createSupplierDto.status || 'active',
      paymentTerms: 0,
      currentBalance: 0,
    });

    return this.supplierRepository.save(supplier);
  }

  async update(
    id: string,
    updateSupplierDto: UpdateSupplierDto,
    tenantId: string,
  ): Promise<Supplier> {
    const supplier = await this.findOne(id, tenantId);

    // Check email uniqueness if email is being updated
    if (updateSupplierDto.email && updateSupplierDto.email !== supplier.email) {
      const existingSupplier = await this.findByEmail(updateSupplierDto.email, tenantId);
      if (existingSupplier) {
        throw new ConflictException(
          `Supplier with email ${updateSupplierDto.email} already exists`,
        );
      }
    }

    Object.assign(supplier, updateSupplierDto);
    const updated = await this.supplierRepository.save(supplier);

    // Invalidate cache
    const cacheKey = generateCacheKey('supplier', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const supplier = await this.findOne(id, tenantId);
    await this.supplierRepository.softDelete(supplier.id);

    // Invalidate cache
    const cacheKey = generateCacheKey('supplier', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async updateBalance(id: string, amount: number, tenantId: string): Promise<Supplier> {
    const supplier = await this.findOne(id, tenantId);
    supplier.currentBalance = Number(supplier.currentBalance) + amount;
    return this.supplierRepository.save(supplier);
  }

  async updatePaymentTerms(id: string, paymentTerms: number, tenantId: string): Promise<Supplier> {
    if (paymentTerms < 0) {
      throw new BadRequestException('Payment terms cannot be negative');
    }

    const supplier = await this.findOne(id, tenantId);
    supplier.paymentTerms = paymentTerms;
    return this.supplierRepository.save(supplier);
  }

  async activate(id: string, tenantId: string): Promise<Supplier> {
    const supplier = await this.findOne(id, tenantId);
    supplier.status = 'active';
    return this.supplierRepository.save(supplier);
  }

  async deactivate(id: string, tenantId: string): Promise<Supplier> {
    const supplier = await this.findOne(id, tenantId);
    supplier.status = 'inactive';
    return this.supplierRepository.save(supplier);
  }

  async search(query: string, tenantId: string): Promise<Supplier[]> {
    return this.supplierRepository.find({
      where: [
        { name: Like(`%${query}%`), tenantId },
        { email: Like(`%${query}%`), tenantId },
        { phone: Like(`%${query}%`), tenantId },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: string, tenantId: string): Promise<Supplier[]> {
    return this.supplierRepository.find({
      where: { status, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async count(tenantId: string): Promise<number> {
    return this.supplierRepository.count({ where: { tenantId } });
  }

  async getTopSuppliers(limit: number, tenantId: string): Promise<Supplier[]> {
    return this.supplierRepository.find({
      where: { tenantId },
      order: { currentBalance: 'DESC' },
      take: limit,
    });
  }

  async getSuppliersWithHighBalance(threshold: number, tenantId: string): Promise<Supplier[]> {
    return this.supplierRepository
      .createQueryBuilder('supplier')
      .where('supplier.tenantId = :tenantId', { tenantId })
      .andWhere('supplier.currentBalance >= :threshold', { threshold })
      .orderBy('supplier.currentBalance', 'DESC')
      .getMany();
  }
}
