import { Injectable } from '@nestjs/common';

export interface User {
  id: string;
  tenantId: string;
  roles: string[];
}

export interface BaseRecord {
  id: string;
  tenantId: string;
  createdBy?: string;
}

@Injectable()
export class PermissionService {
  canRead(user: User, record: BaseRecord, entityName: string): boolean {
    if (user.tenantId !== record.tenantId) {
      return false;
    }

    if (this.hasRole(user, 'admin')) {
      return true;
    }

    if (this.hasRole(user, 'manager')) {
      return true;
    }

    return record.createdBy === user.id;
  }

  canWrite(user: User, record: BaseRecord, entityName: string): boolean {
    if (user.tenantId !== record.tenantId) {
      return false;
    }

    if (this.hasRole(user, 'admin')) {
      return true;
    }

    if (this.hasRole(user, 'manager')) {
      return true;
    }

    return record.createdBy === user.id;
  }

  canDelete(user: User, record: BaseRecord, entityName: string): boolean {
    if (user.tenantId !== record.tenantId) {
      return false;
    }

    return this.hasRole(user, 'admin');
  }

  buildSecureQuery(
    user: User,
    baseWhere: { [key: string]: any },
    entityName: string,
  ): { [key: string]: any } {
    const secureWhere = { ...baseWhere };
    secureWhere.tenantId = user.tenantId;

    if (!this.hasRole(user, 'admin') && !this.hasRole(user, 'manager')) {
      secureWhere.createdBy = user.id;
    }

    return secureWhere;
  }

  private hasRole(user: User, role: string): boolean {
    return user.roles?.includes(role) || false;
  }
}
