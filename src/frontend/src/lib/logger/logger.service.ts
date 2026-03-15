/**
 * Logger Service
 * Professional logging infrastructure for frontend
 * Replaces console.log/error/warn with structured logging
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  error?: Error;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isDevelopment = import.meta.env.DEV;

  /**
   * Log debug message (only in development)
   */
  debug(context: string, message: string, data?: any) {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, context, message, data);
    }
  }

  /**
   * Log info message
   */
  info(context: string, message: string, data?: any) {
    this.log(LogLevel.INFO, context, message, data);
  }

  /**
   * Log warning message
   */
  warn(context: string, message: string, data?: any) {
    this.log(LogLevel.WARN, context, message, data);
  }

  /**
   * Log error message
   */
  error(context: string, message: string, error?: Error, data?: any) {
    this.log(LogLevel.ERROR, context, message, data, error);
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    context: string,
    message: string,
    data?: any,
    error?: Error,
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
      error,
    };

    // Add to in-memory logs
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output in development
    if (this.isDevelopment) {
      const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${context}]`;
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(prefix, message, data);
          break;
        case LogLevel.INFO:
          console.info(prefix, message, data);
          break;
        case LogLevel.WARN:
          console.warn(prefix, message, data);
          break;
        case LogLevel.ERROR:
          console.error(prefix, message, error || data);
          break;
      }
    }

    // Store critical errors in localStorage for admin review
    if (level === LogLevel.ERROR) {
      this.storeError(entry);
    }
  }

  /**
   * Store error in localStorage for admin review
   */
  private storeError(entry: LogEntry) {
    try {
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      errors.push({
        timestamp: entry.timestamp,
        context: entry.context,
        message: entry.message,
        error: entry.error?.message,
        stack: entry.error?.stack,
        data: entry.data,
      });
      
      // Keep only last 100 errors
      if (errors.length > 100) {
        errors.shift();
      }
      
      localStorage.setItem('app_errors', JSON.stringify(errors));
    } catch (e) {
      // Fail silently if localStorage is full
    }
  }

  /**
   * Get recent logs
   */
  getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    let filtered = this.logs;
    
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    
    return filtered.slice(-limit);
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance
export const logger = new LoggerService();
