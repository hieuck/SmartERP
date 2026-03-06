import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Customer[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const [data, total] = await this.customerRepository.findAndCount({
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

  async findOne(id: string, tenantId: string): Promise<Customer> {
    const cacheKey = generateCacheKey('customer', tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const customer = await this.customerRepository.findOne({
          where: { id, tenantId },
        });

        if (!customer) {
          throw new NotFoundException(`Customer with ID ${id} not found`);
        }

        return customer;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findByEmail(email: string, tenantId: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { email, tenantId },
    });
  }

  async create(createCustomerDto: CreateCustomerDto, tenantId: string): Promise<Customer> {
    // Check email uniqueness within tenant
    const existingCustomer = await this.findByEmail(createCustomerDto.email, tenantId);
    if (existingCustomer) {
      throw new ConflictException(`Customer with email ${createCustomerDto.email} already exists`);
    }

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      tenantId,
      status: createCustomerDto.status || 'active',
      creditLimit: 0,
      currentBalance: 0,
    });

    return this.customerRepository.save(customer);
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
    tenantId: string,
  ): Promise<Customer> {
    const customer = await this.findOne(id, tenantId);

    // Check email uniqueness if email is being updated
    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existingCustomer = await this.findByEmail(updateCustomerDto.email, tenantId);
      if (existingCustomer) {
        throw new ConflictException(
          `Customer with email ${updateCustomerDto.email} already exists`,
        );
      }
    }

    Object.assign(customer, updateCustomerDto);
    const updated = await this.customerRepository.save(customer);

    // Invalidate cache
    const cacheKey = generateCacheKey('customer', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const customer = await this.findOne(id, tenantId);
    await this.customerRepository.softDelete(customer.id);

    // Invalidate cache
    const cacheKey = generateCacheKey('customer', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async updateBalance(id: string, amount: number, tenantId: string): Promise<Customer> {
    const customer = await this.findOne(id, tenantId);
    customer.currentBalance = Number(customer.currentBalance) + amount;
    return this.customerRepository.save(customer);
  }

  async updateCreditLimit(id: string, creditLimit: number, tenantId: string): Promise<Customer> {
    if (creditLimit < 0) {
      throw new BadRequestException('Credit limit cannot be negative');
    }

    const customer = await this.findOne(id, tenantId);
    customer.creditLimit = creditLimit;
    return this.customerRepository.save(customer);
  }

  async activate(id: string, tenantId: string): Promise<Customer> {
    const customer = await this.findOne(id, tenantId);
    customer.status = 'active';
    return this.customerRepository.save(customer);
  }

  async deactivate(id: string, tenantId: string): Promise<Customer> {
    const customer = await this.findOne(id, tenantId);
    customer.status = 'inactive';
    return this.customerRepository.save(customer);
  }

  async search(query: string, tenantId: string): Promise<Customer[]> {
    return this.customerRepository.find({
      where: [
        { name: Like(`%${query}%`), tenantId },
        { email: Like(`%${query}%`), tenantId },
        { phone: Like(`%${query}%`), tenantId },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: string, tenantId: string): Promise<Customer[]> {
    return this.customerRepository.find({
      where: { status, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async count(tenantId: string): Promise<number> {
    return this.customerRepository.count({ where: { tenantId } });
  }

  async getTopCustomers(limit: number, tenantId: string): Promise<Customer[]> {
    return this.customerRepository.find({
      where: { tenantId },
      order: { currentBalance: 'DESC' },
      take: limit,
    });
  }

  async getCustomersWithHighBalance(threshold: number, tenantId: string): Promise<Customer[]> {
    return this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.tenantId = :tenantId', { tenantId })
      .andWhere('customer.currentBalance >= :threshold', { threshold })
      .orderBy('customer.currentBalance', 'DESC')
      .getMany();
  }
}
