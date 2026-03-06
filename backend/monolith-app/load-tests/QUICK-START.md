# Load Testing Quick Start Guide

Get started with load testing in 5 minutes.

## Prerequisites

1. **Install k6**
   ```bash
   # macOS
   brew install k6
   
   # Windows (with Chocolatey)
   choco install k6
   
   # Linux
   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. **Start the application**
   ```bash
   cd plaster-warehouse-erp/backend/monolith-app
   npm run start:dev
   ```

3. **Verify application is running**
   ```bash
   curl http://localhost:3000/health
   ```

## Run Your First Test

### 1. Smoke Test (1 minute)

Quick sanity check with minimal load:

```bash
cd load-tests
k6 run smoke-test.js
```

**Expected output:**
```
✓ get profile: status 200
✓ list products: status 200
✓ list orders: status 200
✓ dashboard: status 200

checks.........................: 100.00%
http_req_duration..............: avg=150ms p(95)=300ms
http_reqs......................: 300 (5/s)
```

### 2. Load Test (10 minutes)

Test with 100 concurrent users:

```bash
k6 run load-test.js
```

**What it tests:**
- 60% users browse products
- 30% users create orders
- 10% users view dashboard

**Expected metrics:**
- Response time p95: < 500ms
- Error rate: < 1%
- Throughput: > 100 req/s

### 3. Spike Test (5 minutes)

Test sudden traffic spike:

```bash
k6 run spike-test.js
```

**What it tests:**
- Sudden jump from 50 to 500 users
- System recovery
- Auto-scaling behavior

### 4. Stress Test (20 minutes)

Find the breaking point:

```bash
k6 run stress-test.js
```

**What it tests:**
- Ramp up to 2,000 users
- System limits
- Degradation patterns

## Run All Tests

Execute complete test suite:

```bash
chmod +x run-all-tests.sh
./run-all-tests.sh
```

**Duration:** ~40 minutes  
**Results:** Saved to `./results/YYYYMMDD-HHMMSS/`

## Customize Tests

### Change Base URL

```bash
export BASE_URL=https://api.staging.com
k6 run load-test.js
```

### Change Test Duration

```bash
k6 run --duration 5m load-test.js
```

### Change Concurrent Users

```bash
k6 run --vus 50 load-test.js
```

### Run with Custom Credentials

```bash
export TEST_EMAIL=your@email.com
export TEST_PASSWORD=YourPassword123
k6 run load-test.js
```

## Monitor During Tests

### 1. Watch System Metrics

```bash
# Terminal 1: Application logs
tail -f logs/app.log

# Terminal 2: System resources
watch -n 1 'docker stats'

# Terminal 3: Database connections
watch -n 1 'psql -c "SELECT count(*) FROM pg_stat_activity"'
```

### 2. Open Grafana Dashboards

```bash
# Open in browser
open http://localhost:3001

# Dashboards to watch:
# - System Overview
# - API Performance
# - Database Metrics
```

### 3. Check Prometheus Metrics

```bash
# Open in browser
open http://localhost:9090

# Useful queries:
# - rate(http_requests_total[1m])
# - histogram_quantile(0.95, http_request_duration_seconds)
# - process_resident_memory_bytes
```

## Interpret Results

### Good Results ✅

```
✓ http_req_duration: p(95) < 500ms
✓ http_req_failed: rate < 1%
✓ http_reqs: rate > 100/s
```

### Warning Signs ⚠️

```
⚠ http_req_duration: p(95) > 1000ms
⚠ http_req_failed: rate > 5%
⚠ Timeouts detected
```

### Critical Issues ❌

```
❌ http_req_duration: p(95) > 2000ms
❌ http_req_failed: rate > 10%
❌ Server errors > 100
```

## Common Issues

### Issue 1: Connection Refused

**Symptom:** `connection refused` errors

**Solution:**
```bash
# Check if app is running
curl http://localhost:3000/health

# Start the app
npm run start:dev
```

### Issue 2: High Error Rate

**Symptom:** Error rate > 5%

**Solution:**
1. Check application logs
2. Review database connection pool
3. Check for timeout issues
4. Verify resource limits

### Issue 3: Slow Response Times

**Symptom:** p95 > 1000ms

**Solution:**
1. Check database query performance
2. Review cache hit rates
3. Analyze slow endpoints
4. Check for N+1 queries

## Next Steps

1. **Baseline Performance**
   - Run smoke test to establish baseline
   - Document current metrics

2. **Identify Bottlenecks**
   - Run load test
   - Analyze slow endpoints
   - Check resource usage

3. **Optimize**
   - Implement caching
   - Optimize database queries
   - Add indexes

4. **Validate**
   - Re-run tests
   - Compare with baseline
   - Document improvements

5. **Stress Test**
   - Find breaking point
   - Plan capacity
   - Configure auto-scaling

## Tips

1. **Start Small**: Begin with smoke test
2. **Monitor Everything**: Watch all metrics
3. **Test Regularly**: Run on every release
4. **Document Results**: Track over time
5. **Optimize Iteratively**: Fix one bottleneck at a time

## Support

- **Documentation**: See [README.md](./README.md)
- **Issues**: Check application logs
- **Metrics**: Review Grafana dashboards
- **Help**: Contact DevOps team

---

**Ready to test?** Start with: `k6 run smoke-test.js`
