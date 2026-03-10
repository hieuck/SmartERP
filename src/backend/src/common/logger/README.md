# Logger Module

Consolidated logging, metrics, and alerting module for Smart-ERP.

## Overview

The Logger Module provides:
- **Structured Logging**: HTTP request/response logging via interceptor
- **Metrics Endpoints**: Prometheus-compatible and JSON metrics
- **Alert Service**: Monitoring and alerting for system events

## Components

### LoggerModule
Global NestJS module that provides logging infrastructure.

**Exports:**
- `AlertService` - For sending alerts

**Provides:**
- `LoggingInterceptor` - Global HTTP logging
- `MetricsController` - Metrics endpoints

### LoggingInterceptor
Logs all HTTP requests with structured format:
- Request: method, url, user, tenant
- Response: status, duration
- Errors: stack trace

### MetricsController
Provides two endpoints:
- `GET /metrics` - Prometheus-compatible metrics
- `GET /metrics/app` - Application-specific metrics in JSON

### AlertService
Sends alerts with different severity levels:
- `INFO` - Informational messages
- `WARNING` - Warning messages
- `ERROR` - Error messages
- `CRITICAL` - Critical alerts

**Methods:**
- `sendAlert(alert: Alert)` - Send custom alert
- `alertHighMemory(heapUsedMB, threshold)` - Memory usage alert
- `alertSlowResponse(url, duration, threshold)` - Slow response alert
- `alertDatabaseError(error)` - Database error alert
- `alertCacheError(error)` - Cache error alert
- `alertHighErrorRate(errorCount, totalRequests, threshold)` - Error rate alert

## Usage

### Inject AlertService
```typescript
@Injectable()
export class MyService {
  constructor(private alertService: AlertService) {}

  async doSomething() {
    try {
      // Do work
    } catch (error) {
      await this.alertService.alertDatabaseError(error);
    }
  }
}
```

### Access Metrics
```bash
# Prometheus format
curl http://localhost:3000/metrics

# JSON format
curl http://localhost:3000/metrics/app
```

## Consolidation History

**Date:** March 10, 2026

This module was consolidated from two separate modules:
- `logger/` - Logger service and configuration
- `logging/` - Logging interceptor, alert service, metrics controller

**Reason:** Reduce code duplication and improve organization

**Changes:**
- Moved `logging.interceptor.ts` to `logger/`
- Moved `alert.service.ts` to `logger/`
- Moved `metrics.controller.ts` to `logger/`
- Updated `logger.module.ts` to export all services
- Deleted old `logging/` directory

**Impact:** No breaking changes - module exports remain the same

## Future Enhancements

- [ ] Email notifications for critical alerts
- [ ] Slack/Discord webhook integration
- [ ] PagerDuty integration
- [ ] Alert aggregation and deduplication
- [ ] Custom alert rules
- [ ] Alert history and analytics
