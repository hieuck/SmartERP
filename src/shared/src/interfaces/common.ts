/**
 * Common Interfaces
 * 
 * General-purpose interfaces used across the application
 */

/**
 * Alert interface for notifications and logging
 */
export interface Alert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: Date;
    requestId?: string;
  };
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult<T = unknown> {
  success: number;
  failed: number;
  errors: Array<{
    index: number;
    error: string;
    data?: T;
  }>;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, {
    status: 'up' | 'down';
    message?: string;
    responseTime?: number;
  }>;
  timestamp: Date;
}
