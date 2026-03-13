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
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  private secureCustomerRepo: SecureRepository<Customer>;

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureCustomerRepo = new SecureRepository(
      customerRepository,
      permissionService,
      'Customer',
    );
  }

  async findAll(
    user: User,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Customer[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const allCustomers = await this.secureCustomerRepo.find(user, {
      order: { createdAt: 'DESC' },
    });

    const total = allCustomers.length;
    const data = allCustomers.slice((page - 1) * limit, page * limit);

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

  async findOne(user: User, id: string): Promise<Customer> {
    const cacheKey = generateCacheKey('customer', user.tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const customer = await this.secureCustomerRepo.findOne(user, { where: { id } });

        if (!customer) {
          throw new NotFoundException(`Customer with ID ${id} not found`);
        }

        return customer;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findByEmail(user: User, email: string): Promise<Customer | null> {
    return this.secureCustomerRepo.findOne(user, {
      where: { email },
    });
  }

  async create(user: User, createCustomerDto: CreateCustomerDto): Promise<Customer> {
    // Check email uniqueness within tenant
    const existingCustomer = await this.findByEmail(user, createCustomerDto.email);
    if (existingCustomer) {
      throw new ConflictException(`Customer with email ${createCustomerDto.email} already exists`);
    }

    const customer = {
      ...createCustomerDto,
      status: createCustomerDto.status || 'active',
      creditLimit: 0,
      currentBalance: 0,
    };

    return this.secureCustomerRepo.save(user, customer);
  }

  async update(user: User, id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(user, id);

    // Check email uniqueness if email is being updated
    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existingCustomer = await this.findByEmail(user, updateCustomerDto.email);
      if (existingCustomer) {
        throw new ConflictException(
          `Customer with email ${updateCustomerDto.email} already exists`,
        );
      }
    }

    Object.assign(customer, updateCustomerDto);
    const updated = await this.secureCustomerRepo.save(user, customer);

    // Invalidate cache
    const cacheKey = generateCacheKey('customer', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async remove(user: User, id: string): Promise<void> {
    const customer = await this.findOne(user, id);
    await this.secureCustomerRepo.remove(user, customer);

    // Invalidate cache
    const cacheKey = generateCacheKey('customer', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async updateBalance(user: User, id: string, amount: number): Promise<Customer> {
    const customer = await this.findOne(user, id);
    customer.currentBalance = Number(customer.currentBalance) + amount;
    const updated = await this.secureCustomerRepo.save(user, customer);

    // Invalidate cache
    const cacheKey = generateCacheKey('customer', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async updateCreditLimit(user: User, id: string, creditLimit: number): Promise<Customer> {
    if (creditLimit < 0) {
      throw new BadRequestException('Credit limit cannot be negative');
    }

    const customer = await this.findOne(user, id);
    customer.creditLimit = creditLimit;
    const updated = await this.secureCustomerRepo.save(user, customer);

    // Invalidate cache
    const cacheKey = generateCacheKey('customer', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async activate(user: User, id: string): Promise<Customer> {
    const customer = await this.findOne(user, id);
    customer.status = 'active';
    const updated = await this.secureCustomerRepo.save(user, customer);

    // Invalidate cache
    const cacheKey = generateCacheKey('customer', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deactivate(user: User, id: string): Promise<Customer> {
    const customer = await this.findOne(user, id);
    customer.status = 'inactive';
    const updated = await this.secureCustomerRepo.save(user, customer);

    // Invalidate cache
    const cacheKey = generateCacheKey('customer', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async search(user: User, query: string): Promise<Customer[]> {
    const allCustomers = await this.secureCustomerRepo.find(user, {
      order: { createdAt: 'DESC' },
    });

    // Filter in memory since SecureRepository doesn't support complex OR queries
    return allCustomers.filter(
      (c) =>
        c.name?.toLowerCase().includes(query.toLowerCase()) ||
        c.email?.toLowerCase().includes(query.toLowerCase()) ||
        c.phone?.toLowerCase().includes(query.toLowerCase()),
    );
  }

  async findByStatus(user: User, status: string): Promise<Customer[]> {
    return this.secureCustomerRepo.find(user, {
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async count(user: User): Promise<number> {
    const customers = await this.secureCustomerRepo.find(user, {});
    return customers.length;
  }

  async getTopCustomers(user: User, limit: number): Promise<Customer[]> {
    const allCustomers = await this.secureCustomerRepo.find(user, {});

    return allCustomers
      .sort((a, b) => Number(b.currentBalance) - Number(a.currentBalance))
      .slice(0, limit);
  }

  async getCustomersWithHighBalance(user: User, threshold: number): Promise<Customer[]> {
    const allCustomers = await this.secureCustomerRepo.find(user, {});

    return allCustomers
      .filter((c) => Number(c.currentBalance) >= threshold)
      .sort((a, b) => Number(b.currentBalance) - Number(a.currentBalance));
  }
}
