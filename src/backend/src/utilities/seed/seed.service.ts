import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../../core/tenant/entities/tenant.entity';
import { User } from '../../core/user/entities/user.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async seedDemoData() {
    // Check if demo tenant exists
    let tenant = await this.tenantRepo.findOne({
      where: { code: 'DEMO' },
    });

    if (!tenant) {
      tenant = this.tenantRepo.create({
        code: 'DEMO',
        name: 'Demo Company',
        domain: 'demo.smarterp.local',
        status: TenantStatus.ACTIVE,
      });
      await this.tenantRepo.save(tenant);
    }

    // Check if admin user exists
    const existingUser = await this.userRepo.findOne({
      where: { email: 'admin@demo.com' },
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const user = this.userRepo.create({
        email: 'admin@demo.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        tenantId: tenant.id,
        status: 'active',
      });
      await this.userRepo.save(user);
    }

    return {
      success: true,
      message: 'Demo data seeded successfully',
      credentials: {
        email: 'admin@demo.com',
        password: 'admin123',
        tenant: 'DEMO',
      },
    };
  }
}
