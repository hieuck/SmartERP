# Performance Testing

## Overview

This directory contains performance tests to ensure SmartERP meets the < 200ms (p95) API response time requirement.

## Running Performance Tests

```bash
# Run all performance tests
npm run test:e2e -- performance/api-performance.spec.ts

# Run with verbose output
npm run test:e2e -- performance/api-performance.spec.ts --verbose
```

## Performance Thresholds

| Category | Threshold | Description |
|----------|-----------|-------------|
| Fast | < 50ms | Cached queries, simple lookups |
| Normal | < 200ms | Most API endpoints (p95 requirement) |
| Slow | < 500ms | Complex queries, reports |

## Test Coverage

- Product Catalog, Orders, Reports
- Project Management, Accounting, HR, Manufacturing
- Concurrent requests, Cache effectiveness

## Related Documentation

- [Performance Optimization Plan](../../../../docs/PERFORMANCE-OPTIMIZATION-PLAN.md)
- [ROADMAP.md](../../../../ROADMAP.md) - Week 39-41
