// Entity-specific types that extend base types

import { BaseEntity } from './index';

export interface Customer extends BaseEntity {
  code: string;
  name: string;
  type: CustomerType;
  email?: string;
  phone?: string;
  taxCode?: string;
  status: EntityStatus;
  totalRevenue: number;
  totalOrders: number;
}

export enum CustomerType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
  RESELLER = 'reseller',
  VIP = 'vip',
}

export interface Supplier extends BaseEntity {
  code: string;
  name: string;
  email?: string;
  phone?: string;
  taxCode?: string;
  rating?: number;
  status: EntityStatus;
  totalPurchases: number;
  totalOrders: number;
}

export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

export interface Warehouse extends BaseEntity {
  code: string;
  name: string;
  address: string;
  city: string;
  managerId?: string;
  status: EntityStatus;
  isDefault: boolean;
}
