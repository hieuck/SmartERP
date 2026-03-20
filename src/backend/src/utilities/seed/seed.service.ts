import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Permission } from '@core/permission/entities/permission.entity';
import { PermissionAction } from '@core/permission/enums/permission-action.enum';
import { Tenant } from '@core/tenant/entities/tenant.entity';
import { TenantStatus } from '@core/tenant/enums/tenant-status.enum';
import { User } from '@core/user/entities/user.entity';
import { Role } from '@domains/hr/role/entities/role.entity';

const DEMO_PERMISSION_RESOURCES = [
  'users',
  'roles',
  'permissions',
  'products',
  'customers',
  'suppliers',
  'orders',
  'invoices',
  'payments',
  'reports',
  'settings',
  'workflows',
] as const;

const FULL_PERMISSION_ACTIONS = [
  PermissionAction.CREATE,
  PermissionAction.READ,
  PermissionAction.UPDATE,
  PermissionAction.DELETE,
  PermissionAction.EXECUTE,
];
const DEMO_ADMIN_EMAIL = 'admin@demo.com';
const DEMO_ADMIN_PASSWORD = 'admin123';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
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
      where: { email: DEMO_ADMIN_EMAIL },
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);
      const user = this.userRepo.create({
        email: DEMO_ADMIN_EMAIL,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        roles: ['admin'],
        tenantId: tenant.id,
        status: 'active',
      });
      await this.userRepo.save(user);
    } else {
      existingUser.password = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);
      existingUser.status = 'active';
      existingUser.role = 'admin';
      existingUser.tenantId = tenant.id;
      existingUser.roles = existingUser.roles?.includes('admin')
        ? existingUser.roles
        : ['admin', ...(existingUser.roles ?? []).filter((role) => role !== 'admin')];
      await this.userRepo.save(existingUser);
    }

    const permissions = await this.ensureDemoPermissions(tenant.id);
    await this.ensureAdminRole(tenant.id, permissions);

    return {
      success: true,
      message: 'Demo data seeded successfully',
      credentials: {
        email: DEMO_ADMIN_EMAIL,
        password: DEMO_ADMIN_PASSWORD,
        tenant: 'DEMO',
      },
    };
  }

  private async ensureDemoPermissions(tenantId: string): Promise<Permission[]> {
    const existingPermissions = await this.permissionRepo.find({
      where: { tenantId },
    });

    const permissionsByResource = new Map(
      existingPermissions.map((permission) => [permission.resource, permission]),
    );

    const ensuredPermissions: Permission[] = [];

    for (const resource of DEMO_PERMISSION_RESOURCES) {
      const existingPermission = permissionsByResource.get(resource);

      if (existingPermission) {
        if (existingPermission.actions.join(',') !== FULL_PERMISSION_ACTIONS.join(',')) {
          existingPermission.actions = [...FULL_PERMISSION_ACTIONS];
          ensuredPermissions.push(await this.permissionRepo.save(existingPermission));
          continue;
        }

        ensuredPermissions.push(existingPermission);
        continue;
      }

      const createdPermission = this.permissionRepo.create({
        tenantId,
        resource,
        actions: [...FULL_PERMISSION_ACTIONS],
        description: `Full access to ${resource}`,
      });
      ensuredPermissions.push(await this.permissionRepo.save(createdPermission));
    }

    return ensuredPermissions;
  }

  private async ensureAdminRole(tenantId: string, permissions: Permission[]): Promise<Role> {
    const existingRole = await this.roleRepo.findOne({
      where: { tenantId, name: 'admin' },
      relations: ['permissions'],
    });

    if (existingRole) {
      existingRole.isSystem = true;
      existingRole.description = existingRole.description || 'Default administrator role';
      existingRole.permissions = permissions;
      return this.roleRepo.save(existingRole);
    }

    const adminRole = this.roleRepo.create({
      tenantId,
      name: 'admin',
      description: 'Default administrator role',
      isSystem: true,
      permissions,
    });

    return this.roleRepo.save(adminRole);
  }
}
