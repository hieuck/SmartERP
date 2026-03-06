# Performance Testing Suite

## Overview

Comprehensive performance testing suite for Smart ERP backend to ensure the system meets production-grade performance requirements.

## Test Types

### 1. Load Tests (`load-test.spec.ts`)
Tests system behavior under normal and expected load conditions.

**Coverage:**
- API response time benchmarks
- Concurrent request handling (10, 50, 100 concurrent)
- Database query performance
- Write operations performance
- Complex operations (orders, reports)
- Memory usage monitoring

**Performance Targets:**
- Simple GET requests: < 100ms
- Complex GET requests: < 150ms
- POST/PUT requests: < 200ms
- Dashboard overview: < 200ms
- Reports: < 500ms
- 100 concurrent requests: < 5s

### 2. Stress Tests (`stress-test.spec.ts`)
Tests system behavior under extreme load conditions.

**Coverage:**
- High volume requests (500+ concurrent)
- Sequential requests (1000+)
- Burst traffic handling
- Large payload processing
- Database connection pool limits
- Rate limiting enforcement
- Error recovery
- Long-running operations

**Stress Targets:**
- 500 concurrent requests: 95%+ success rate
- 1000 sequential requests: 99%+ success rate
- Burst traffic: 90%+ success rate
- Large payloads: < 1s response time

### 3. Benchmark Tool (`benchmark.ts`)
Automated benchmarking tool that runs comprehensive performance tests and generates detailed reports.

**Features:**
- Tests all major endpoints
- Calculates avg/min/max response times
- Measures requests per second (RPS)
- Tracks success rates
- Generates performance grade (A+ to F)
- Saves JSON reports with timestamps

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Ensure database is running
docker-compose up -d postgres
```

### Run Load Tests
```bash
npm run test:performance:load
```

### Run Stress Tests
```bash
npm run test:performance:stress
```

### Run Benchmark
```bash
npm run benchmark
```

### Run All Performance Tests
```bash
npm run test:performance
```

## Performance Metrics

### Response Time Targets

| Endpoint Type | Target | Acceptable | Poor |
|--------------|--------|------------|------|
| Simple GET | < 50ms | < 100ms | > 200ms |
| Complex GET | < 100ms | < 200ms | > 500ms |
| POST/PUT | < 150ms | < 300ms | > 1s |
| Reports | < 300ms | < 500ms | > 2s |
| Dashboard | < 150ms | < 200ms | > 500ms |

### Throughput Targets

| Scenario | Target | Acceptable | Poor |
|----------|--------|------------|------|
| Concurrent Users | 100+ | 50+ | < 20 |
| Requests/Second | 1000+ | 500+ | < 100 |
| Success Rate | 99%+ | 95%+ | < 90% |

### Resource Usage Targets

| Resource | Target | Acceptable | Poor |
|----------|--------|------------|------|
| Memory | < 512MB | < 1GB | > 2GB |
| CPU | < 50% | < 70% | > 90% |
| DB Connections | < 20 | < 50 | > 100 |

## Benchmark Report

### Sample Output
```
═══════════════════════════════════════════════════════
           SMART ERP PERFORMANCE BENCHMARK
═══════════════════════════════════════════════════════

📊 Running benchmark: GET /products (list) (100 iterations)
  ✓ Avg: 45.23ms
  ✓ Min: 32ms
  ✓ Max: 89ms
  ✓ Success Rate: 100%
  ✓ RPS: 2210.45

...

═══════════════════════════════════════════════════════
                  BENCHMARK SUMMARY
═══════════════════════════════════════════════════════

Fastest Endpoints:
  1. GET /products/:id (detail): 38.45ms
  2. GET /products (list): 45.23ms
  3. GET /customers (list): 52.67ms
  4. GET /orders (list): 58.91ms
  5. GET /inventory (list): 63.12ms

Slowest Endpoints:
  1. GET /reporting/sales: 287.45ms
  2. POST /orders (create): 156.78ms
  3. GET /dashboard/overview: 134.23ms
  4. POST /products (create): 98.45ms
  5. POST /auth/login: 87.34ms

Highest Throughput:
  1. GET /products (list): 2210.45 req/s
  2. GET /products/:id (detail): 2601.56 req/s
  3. GET /customers (list): 1899.23 req/s
  4. GET /orders (list): 1695.34 req/s
  5. GET /inventory (list): 1584.67 req/s

Overall Statistics:
  Average Response Time: 89.34ms
  Average Success Rate: 99.87%
  Total Throughput: 15,234.56 req/s

  Performance Grade: A

📄 Report saved to: reports/benchmark-2026-02-27T10-30-45-123Z.json
```

## Optimization Tips

### Database Optimization
1. **Add Indexes**
   ```sql
   CREATE INDEX idx_products_sku ON products(sku);
   CREATE INDEX idx_orders_customer_id ON orders(customer_id);
   CREATE INDEX idx_orders_status ON orders(status);
   ```

2. **Use Connection Pooling**
   ```typescript
   // TypeORM config
   {
     type: 'postgres',
     poolSize: 20,
     extra: {
       max: 20,
       min: 5,
       idleTimeoutMillis: 30000,
     }
   }
   ```

3. **Optimize Queries**
   - Use `select` to limit fields
   - Use `take` and `skip` for pagination
   - Avoid N+1 queries with `relations`
   - Use `QueryBuilder` for complex queries

### API Optimization
1. **Enable Caching**
   ```typescript
   @UseInterceptors(CacheInterceptor)
   @CacheTTL(60)
   async getProducts() { ... }
   ```

2. **Add Compression**
   ```typescript
   import * as compression from 'compression';
   app.use(compression());
   ```

3. **Rate Limiting**
   ```typescript
   import { ThrottlerModule } from '@nestjs/throttler';
   ThrottlerModule.forRoot({
     ttl: 60,
     limit: 100,
   })
   ```

### Application Optimization
1. **Use Async/Await Properly**
   - Avoid blocking operations
   - Use `Promise.all()` for parallel operations
   - Use streams for large data

2. **Optimize Serialization**
   - Use `class-transformer` efficiently
   - Exclude unnecessary fields
   - Use DTOs for response shaping

3. **Memory Management**
   - Avoid memory leaks
   - Use pagination for large datasets
   - Clear unused references

## CI/CD Integration

### GitHub Actions
```yaml
name: Performance Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start database
        run: docker-compose up -d postgres
      
      - name: Run performance tests
        run: npm run test:performance
      
      - name: Upload benchmark report
        uses: actions/upload-artifact@v3
        with:
          name: benchmark-report
          path: reports/
```

## Monitoring in Production

### Recommended Tools
1. **APM (Application Performance Monitoring)**
   - New Relic
   - Datadog
   - Elastic APM

2. **Metrics Collection**
   - Prometheus + Grafana
   - CloudWatch (AWS)
   - Azure Monitor

3. **Logging**
   - ELK Stack (Elasticsearch, Logstash, Kibana)
   - Splunk
   - CloudWatch Logs

### Key Metrics to Monitor
- Response time (p50, p95, p99)
- Throughput (requests/second)
- Error rate
- CPU usage
- Memory usage
- Database connection pool
- Cache hit rate

## Troubleshooting

### Slow Response Times
1. Check database query performance
2. Review N+1 query issues
3. Check for missing indexes
4. Review caching strategy
5. Profile with APM tools

### High Memory Usage
1. Check for memory leaks
2. Review pagination implementation
3. Check for large object retention
4. Profile with heap snapshots

### Database Connection Issues
1. Review connection pool settings
2. Check for connection leaks
3. Monitor active connections
4. Review query timeout settings

## Next Steps

### Additional Tests Needed
- [ ] Spike testing (sudden traffic increase)
- [ ] Soak testing (sustained load over time)
- [ ] Scalability testing (horizontal scaling)
- [ ] Network latency simulation
- [ ] Database failover testing

### Performance Improvements
- [ ] Implement Redis caching
- [ ] Add CDN for static assets
- [ ] Optimize database queries
- [ ] Implement query result caching
- [ ] Add API response compression
- [ ] Implement connection pooling optimization

## Resources

- [NestJS Performance](https://docs.nestjs.com/techniques/performance)
- [TypeORM Performance](https://typeorm.io/performance)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
