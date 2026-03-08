import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import { PermissionService, User, BaseRecord as PermissionRecord } from './permission.service';

export class SecureRepository<T extends Partial<PermissionRecord> = any> {
  constructor(
    private readonly repository: Repository<T>,
    private readonly permissionService: PermissionService,
    private readonly entityName: string,
  ) {}

  async findOne(user: User, options: FindOneOptions<T>): Promise<T | null> {
    const record = await this.repository.findOne(options);

    if (!record) {
      return null;
    }

    if (!this.permissionService.canRead(user, record as any, this.entityName)) {
      throw new ForbiddenException('Access denied to this record');
    }

    return record;
  }

  async find(user: User, options: FindManyOptions<T> = {}): Promise<T[]> {
    const secureWhere = this.permissionService.buildSecureQuery(
      user,
      (options.where as Record<string, any>) || {},
      this.entityName,
    );

    return this.repository.find({
      ...options,
      where: secureWhere as any,
    });
  }

  async save(user: User, entity: Partial<T>): Promise<T> {
    if (entity.id) {
      const existing = await this.repository.findOne({
        where: { id: entity.id } as any,
      });

      if (existing && !this.permissionService.canWrite(user, existing as any, this.entityName)) {
        throw new ForbiddenException('Access denied to update this record');
      }
    } else {
      (entity as any).tenantId = user.tenantId;
      (entity as any).createdBy = user.id;
    }

    return this.repository.save(entity as any);
  }

  async remove(user: User, entity: T): Promise<T> {
    const existing = await this.repository.findOne({
      where: { id: entity.id } as any,
    });

    if (!existing) {
      throw new NotFoundException('Record not found');
    }

    if (!this.permissionService.canDelete(user, existing as any, this.entityName)) {
      throw new ForbiddenException('Access denied to delete this record');
    }

    return this.repository.remove(entity);
  }
}

