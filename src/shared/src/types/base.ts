/**
 * Base Types
 * 
 * Base interfaces for entities and records
 */

/**
 * Base entity interface with common fields
 * 
 * All entities should extend this interface
 */
export interface BaseEntity {
  id: string;
  tenantId: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Timestamped interface
 */
export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Soft deletable interface
 */
export interface SoftDeletable {
  deletedAt?: Date;
}

/**
 * Auditable interface
 */
export interface Auditable extends Timestamped {
  createdBy?: string;
  updatedBy?: string;
}
