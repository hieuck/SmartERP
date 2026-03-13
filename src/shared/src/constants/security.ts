/**
 * Security Constants
 * 
 * Security-related constants for authentication, authorization, and CSRF protection
 */

/**
 * CSRF protection
 */
export const SKIP_CSRF_KEY = 'skipCsrf';

/**
 * Public route marker
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Role-based access control
 */
export const ROLES_KEY = 'roles';

/**
 * Common role names
 */
export const Roles = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  GUEST: 'guest',
} as const;

/**
 * Permission actions
 */
export const PermissionActions = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
} as const;

/**
 * JWT token types
 */
export const TokenTypes = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET_PASSWORD: 'reset_password',
  VERIFY_EMAIL: 'verify_email',
} as const;

/**
 * Security headers
 */
export const SecurityHeaders = {
  TENANT_ID: 'x-tenant-id',
  USER_ID: 'x-user-id',
  CORRELATION_ID: 'x-correlation-id',
  API_KEY: 'x-api-key',
} as const;
