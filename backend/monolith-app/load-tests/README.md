# Load Testing with k6

Enterprise-grade load testing suite for performance validation and capacity planning.

## Overview

This directory contains k6 load testing scripts to validate system performance under various load conditions.

## Test Scenarios

### 1. Smoke Test (`smoke-test.js`)
- **Purpose**: Verify system works under minimal load
- **Users**: 1-5 concurrent users
- **Duration**: 1 minute
- **Use Case**: Quick sanity check before major tests

### 2. Load Test (`load-test.js`)
- **Purpose**: Assess normal production load
- **Users**: 100 concurrent users
- **Duration**: 10 minutes
- **Use Case**: Validate expected production performance

### 3. Stress Test (`stress-test.js`)
- **Purpose**: Find system breaking point
- **Users**: Ramp up to 1,000+ users
- **Duration**: 20 minutes
- **Use Case**: Identify maximum capacity

### 4. Spike Test (`spike-test.js`)
- **Purpose**: Test sudden traffic spikes
- **Users**: Sudden jump to 500 users
- **Duration**: 5 minutes
- **Use Case**: Validate auto-scaling and resilience

### 5. Soak Test (`soak-test.js`)
- **Purpose**: Test system stability over time
- **Users**: 200 concurrent users
- **Duration**: 2 hours
- **Use Case**: Detect memory leaks and degradation

## Installation

```bash
# Install k6 (macOS)
brew install k6

# Install k6 (Windows)
choco install k6

# Install k6 (Linux)
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Running Tests

### Quick Start

```bash
# Run smoke test (1 minute)
k6 run smoke-test.js

# Run load test (10 minutes)
k6 run load-test.js

# Run stress test (20 minutes)
k6 run stress-test.js
```

### With Custom Configuration

```bash
# Override VUs and duration
k6 run --vus 50 --duration 5m load-test.js

# Run with specific environment
k6 run --env BASE_URL=https://api.production.com load-test.js

# Generate HTML report
k6 run --out json=results.json load-test.js
```

### Run All Tests

```bash
# Run complete test suite
./run-all-tests.sh
```

## Test Configuration

### Environment Variables

```bash
# Base URL (default: http://localhost:3000)
export BASE_URL=https://api.staging.com

# Test credentials
export TEST_EMAIL=test@example.com
export TEST_PASSWORD=Test123456

# Tenant subdomain
export TENANT_SUBDOMAIN=test-tenant
```

### Thresholds

All tests include performance thresholds:

```javascript
thresholds: {
  http_req_duration: ['p(95)<500'],  // 95% requests < 500ms
  http_req_failed: ['rate<0.01'],    // Error rate < 1%
  http_reqs: ['rate>100'],           // Throughput > 100 req/s
}
```

## Metrics

### Key Metrics Tracked

1. **Response Time**
   - p50 (median)
   - p95 (95th percentile)
   - p99 (99th percentile)
   - max

2. **Throughput**
   - Requests per second
   - Data transferred

3. **Error Rate**
   - Failed requests
   - HTTP errors
   - Timeouts

4. **Resource Usage**
   - CPU utilization
   - Memory usage
   - Database connections

## Performance Targets

### Response Time (p95)
- ✅ Authentication: < 200ms
- ✅ Read operations: < 300ms
- ✅ Write operations: < 500ms
- ✅ Complex queries: < 1000ms

### Throughput
- ✅ Minimum: 100 req/s
- ✅ Target: 500 req/s
- ✅ Peak: 1000 req/s

### Error Rate
- ✅ Target: < 0.1%
- ✅ Maximum: < 1%

### Concurrent Users
- ✅ Normal: 100 users
- ✅ Peak: 1,000 users
- ✅ Maximum: 10,000 users

## Test Scenarios

### Scenario 1: User Authentication Flow
1. Register new user
2. Login
3. Get user profile
4. Logout

### Scenario 2: Product Management
1. Login
2. List products
3. Create product
4. Update product
5. Delete product

### Scenario 3: Order Processing
1. Login
2. Create order
3. Add items
4. Process payment
5. Generate invoice

### Scenario 4: Inventory Operations
1. Login
2. Check stock levels
3. Create stock movement
4. Transfer between warehouses
5. Generate inventory report

## Monitoring During Tests

### Real-time Monitoring

```bash
# Watch system metrics
watch -n 1 'docker stats'

# Monitor database
watch -n 1 'psql -c "SELECT * FROM pg_stat_activity"'

# Check logs
tail -f logs/app.log
```

### Grafana Dashboards

Access dashboards during tests:
- System Overview: http://localhost:3001/d/system
- API Performance: http://localhost:3001/d/api
- Database Metrics: http://localhost:3001/d/database

## Results Analysis

### Generate Reports

```bash
# Convert JSON to HTML report
k6-reporter results.json --output report.html

# View summary
k6 inspect results.json
```

### Key Questions to Answer

1. **What is the maximum capacity?**
   - How many concurrent users can the system handle?
   - What is the breaking point?

2. **What are the bottlenecks?**
   - Which endpoints are slowest?
   - Which resources are constrained?

3. **How does it scale?**
   - Linear scaling?
   - Degradation patterns?

4. **Is it stable?**
   - Memory leaks?
   - Performance degradation over time?

## Optimization Workflow

1. **Baseline**: Run smoke test
2. **Load**: Run load test (100 users)
3. **Analyze**: Identify bottlenecks
4. **Optimize**: Apply fixes
5. **Verify**: Re-run tests
6. **Stress**: Run stress test (1000 users)
7. **Soak**: Run soak test (2 hours)

## Common Issues

### High Response Times
- Check database query performance
- Review cache hit rates
- Analyze slow endpoints

### High Error Rates
- Check connection pool settings
- Review timeout configurations
- Analyze error logs

### Memory Leaks
- Run soak test
- Monitor memory over time
- Check for unclosed connections

## Best Practices

1. **Start Small**: Begin with smoke tests
2. **Incremental Load**: Gradually increase load
3. **Monitor Everything**: Watch all metrics
4. **Test Regularly**: Run tests on every release
5. **Document Results**: Track performance over time

## CI/CD Integration

```yaml
# .github/workflows/load-test.yml
name: Load Tests
on: [push]
jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run k6 tests
        run: k6 run --quiet load-test.js
```

## Support

For issues or questions:
- Check logs: `logs/load-tests/`
- Review metrics: Grafana dashboards
- Contact: DevOps team

---

**Last Updated**: 2026-02-28  
**Version**: 1.0  
**Status**: ✅ Ready for use
