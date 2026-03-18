import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeeService {
  private secureRepo: SecureRepository<Employee>;

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureRepo = new SecureRepository(employeeRepository, permissionService, 'Employee');
  }

  async findAll(user: User, page = 1, limit = 20) {
    const all = await this.secureRepo.find(user, { order: { createdAt: 'DESC' } });
    const total = all.length;
    return {
      data: all.slice((page - 1) * limit, page * limit),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(user: User, id: string): Promise<Employee> {
    const cacheKey = generateCacheKey('employee', user.tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const emp = await this.secureRepo.findOne(user, { where: { id } });
        if (!emp) throw new NotFoundException(`Employee ${id} not found`);
        return emp;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findByEmail(user: User, email: string): Promise<Employee | null> {
    return this.secureRepo.findOne(user, { where: { email } });
  }

  async create(user: User, dto: CreateEmployeeDto): Promise<Employee> {
    const existing = await this.findByEmail(user, dto.email);
    if (existing) throw new ConflictException(`Employee with email ${dto.email} already exists`);
    return this.secureRepo.save(user, {
      ...dto,
      hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
      status: dto.status || ('active' as any),
    });
  }

  async update(user: User, id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const emp = await this.findOne(user, id);
    if (dto.email && dto.email !== emp.email) {
      const existing = await this.findByEmail(user, dto.email);
      if (existing) throw new ConflictException(`Employee with email ${dto.email} already exists`);
    }
    Object.assign(emp, dto);
    const updated = await this.secureRepo.save(user, emp);
    await this.cacheService.del(generateCacheKey('employee', user.tenantId, id));
    return updated;
  }

  async remove(user: User, id: string): Promise<void> {
    const emp = await this.findOne(user, id);
    await this.secureRepo.remove(user, emp);
    await this.cacheService.del(generateCacheKey('employee', user.tenantId, id));
  }

  async search(user: User, query: string): Promise<Employee[]> {
    const all = await this.secureRepo.find(user, { order: { createdAt: 'DESC' } });
    const q = query.toLowerCase();
    return all.filter(
      (e) =>
        e.firstName?.toLowerCase().includes(q) ||
        e.lastName?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.employeeCode?.toLowerCase().includes(q),
    );
  }

  async findByStatus(user: User, status: string): Promise<Employee[]> {
    return this.secureRepo.find(user, {
      where: { status: status as any },
      order: { createdAt: 'DESC' },
    });
  }

  async getStatistics(user: User) {
    const cacheKey = generateCacheKey('employee-statistics', user.tenantId);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const all = await this.secureRepo.find(user, {});
        return {
          totalEmployees: all.length,
          activeEmployees: all.filter((e) => e.status === 'active').length,
          inactiveEmployees: all.filter((e) => e.status === 'inactive').length,
        };
      },
      CacheTTL.SHORT,
    );
  }
}
