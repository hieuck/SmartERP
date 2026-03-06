import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial } from 'typeorm';
import { Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { BaseEntity } from '../entities/base.entity';

/**
 * Base Repository with Automatic Tenant Isolation
 * All repositories MUST extend this to ensure tenant_id filtering
 */
export abstract class BaseRepository<T extends BaseEntity> {
  constructor(
    protected readonly repository: Repository<T>,
    @Inject(REQUEST) protected readonly request: Request,
  ) {}

  /**
   * Get tenant_id from request context
   */
  protected getTenantId(): string {
    const tenantId = this.request['tenantId'];
    if (!tenantId) {
      throw new Error('Tenant ID not found in request context');
    }
    return tenantId;
  }

  /**
   * Get user_id from request context
   */
  protected getUserId(): string | undefined {
    return this.request['userId'];
  }

  /**
   * Find all with automatic tenant filtering
   */
  async find(options?: FindManyOptions<T>): Promise<T[]> {
    const tenantId = this.getTenantId();
    
    return this.repository.find({
      ...options,
      where: {
        tenant_id: tenantId,
        ...(options?.where || {}),
      } as FindOptionsWhere<T>,
    });
  }

  /**
   * Find one with automatic tenant filtering
   */
  async findOne(options: FindManyOptions<T>): Promise<T | null> {
    const tenantId = this.getTenantId();
    
    return this.repository.findOne({
      ...options,
      where: {
        tenant_id: tenantId,
        ...(options.where || {}),
      } as FindOptionsWhere<T>,
    });
  }

  /**
   * Find by ID with automatic tenant filtering
   */
  async findById(id: string): Promise<T | null> {
    const tenantId = this.getTenantId();
    
    return this.repository.findOne({
      where: {
        id,
        tenant_id: tenantId,
      } as FindOptionsWhere<T>,
    });
  }

  /**
   * Create with automatic tenant_id injection
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const tenantId = this.getTenantId();
    const userId = this.getUserId();
    
    const entity = this.repository.create({
      ...data,
      tenant_id: tenantId,
      created_by: userId,
    } as DeepPartial<T>);
    
    return this.repository.save(entity);
  }

  /**
   * Update with automatic tenant filtering and user tracking
   */
  async update(id: string, data: DeepPartial<T>): Promise<T> {
    const tenantId = this.getTenantId();
    const userId = this.getUserId();
    
    // Verify entity belongs to tenant
    const entity = await this.findById(id);
    if (!entity) {
      throw new Error('Entity not found or access denied');
    }
    
    await this.repository.update(
      { id, tenant_id: tenantId } as FindOptionsWhere<T>,
      {
        ...data,
        updated_by: userId,
      } as any,
    );
    
    return this.findById(id);
  }

  /**
   * Soft delete with automatic tenant filtering
   */
  async softDelete(id: string): Promise<void> {
    const tenantId = this.getTenantId();
    
    // Verify entity belongs to tenant
    const entity = await this.findById(id);
    if (!entity) {
      throw new Error('Entity not found or access denied');
    }
    
    await this.repository.softDelete({
      id,
      tenant_id: tenantId,
    } as FindOptionsWhere<T>);
  }

  /**
   * Hard delete with automatic tenant filtering (use with caution)
   */
  async delete(id: string): Promise<void> {
    const tenantId = this.getTenantId();
    
    // Verify entity belongs to tenant
    const entity = await this.findById(id);
    if (!entity) {
      throw new Error('Entity not found or access denied');
    }
    
    await this.repository.delete({
      id,
      tenant_id: tenantId,
    } as FindOptionsWhere<T>);
  }

  /**
   * Count with automatic tenant filtering
   */
  async count(options?: FindManyOptions<T>): Promise<number> {
    const tenantId = this.getTenantId();
    
    return this.repository.count({
      ...options,
      where: {
        tenant_id: tenantId,
        ...(options?.where || {}),
      } as FindOptionsWhere<T>,
    });
  }
}
