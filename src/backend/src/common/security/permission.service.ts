import { Injectable } from '@nestjs/common';

export interface User {
  id?: string;
  userId?: string;
  tenantId: string;
  roles: string[];
}

export interface BaseRecord {
  id: string;
  tenantId: string;
  createdBy?: string;
  userId?: string;
  uploadedBy?: string;
}

@Injectable()
export class PermissionService {
  getUserId(user: User): string | undefined {
    return user.id ?? user.userId;
  }

  getOwnerField(entityName: string): 'createdBy' | 'userId' | 'uploadedBy' {
    switch (entityName) {
      case 'Notification':
        return 'userId';
      case 'Document':
        return 'uploadedBy';
      default:
        return 'createdBy';
    }
  }

  canRead(user: User, record: BaseRecord, _entityName: string): boolean {
    const ownerField = this.getOwnerField(_entityName);
    const userId = this.getUserId(user);

    if (user.tenantId !== record.tenantId) {
      return false;
    }

    if (this.hasRole(user, 'admin')) {
      return true;
    }

    if (this.hasRole(user, 'manager')) {
      return true;
    }

    return record[ownerField] === userId;
  }

  canWrite(user: User, record: BaseRecord, _entityName: string): boolean {
    const ownerField = this.getOwnerField(_entityName);
    const userId = this.getUserId(user);

    if (user.tenantId !== record.tenantId) {
      return false;
    }

    if (this.hasRole(user, 'admin')) {
      return true;
    }

    if (this.hasRole(user, 'manager')) {
      return true;
    }

    return record[ownerField] === userId;
  }

  canDelete(user: User, record: BaseRecord, _entityName: string): boolean {
    if (user.tenantId !== record.tenantId) {
      return false;
    }

    return this.hasRole(user, 'admin');
  }

  buildSecureQuery(
    user: User,
    baseWhere: { [key: string]: unknown },
    entityName: string,
  ): { [key: string]: unknown } {
    const secureWhere = { ...baseWhere };
    secureWhere.tenantId = user.tenantId;
    const userId = this.getUserId(user);

    if (!this.hasRole(user, 'admin') && !this.hasRole(user, 'manager')) {
      secureWhere[this.getOwnerField(entityName)] = userId;
    }

    return secureWhere;
  }

  private hasRole(user: User, role: string): boolean {
    return user.roles?.includes(role) || false;
  }
}
