import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { BaseRecord as PermissionRecord, PermissionService, User } from './permission.service';

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
      (options.where as Record<string, unknown>) || {},
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
      const ownerField = this.permissionService.getOwnerField(this.entityName);
      const userId = this.permissionService.getUserId(user);
      const draftEntity = {
        ...entity,
        tenantId: user.tenantId,
        [ownerField]: userId,
      } as T;

      // Check write permission for new entities
      if (!this.permissionService.canWrite(user, draftEntity as any, this.entityName)) {
        throw new ForbiddenException('Access denied to create this record');
      }

      Object.assign(entity, draftEntity);
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
