/**
 * Security Interfaces
 * 
 * Common security-related interfaces for authentication and authorization
 */

/**
 * User interface for authentication and authorization
 */
export interface User {
  id: string;
  tenantId: string;
  roles: string[];
}

/**
 * Base record interface for multi-tenant data
 */
export interface BaseRecord {
  id: string;
  tenantId: string;
  createdBy?: string;
}

/**
 * Permission check result
 */
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * JWT payload
 */
export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

/**
 * Authentication result
 */
export interface AuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  user: User;
}
