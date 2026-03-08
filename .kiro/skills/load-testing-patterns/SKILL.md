---
name: load-testing-patterns
description: Load testing patterns with k6 and Artillery to verify system performance under load. Use when testing scalability, identifying bottlenecks, and ensuring SLA compliance.
---

# Load Testing Patterns

## Vấn đề với Performance Testing

**Manual testing KHÔNG phát hiện performance issues:**

```typescript
// ❌ Test này pass nhưng system có thể chậm với 1000 users
it('should get products', async () => {
  const response = await request(app).get('/api/products');
  expect(response.status).toBe(200);
  // ✅ Works với 1 user
  // ❌ Timeout với 100 concurrent users?
  // ❌ Database connection pool exhausted?
  // ❌ Memory leak sau 1000 requests?
});
```

**Load Testing = Test system under realistic load**

## Setup với k6

### 1. Cài đặt

```bash
# Install k6
brew install k6  # macOS
choco install k6 # Windows
# Or download from https://k6.io/docs/getting-started/installation/
```

### 2. Basic Load Test

```javascript
// tests/load/products-api.load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '1m', target: 100 }, // Stay at 100 users
    { duration: '30s', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'], // Error rate must be below 1%
    errors: ['rate<0.1'], // Custom error rate below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

export default function () {
  // Test: Get products list
  const productsResponse = http.get(`${BASE_URL}/api/products`, {
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
      'x-tenant-id': 'tenant-1',
    },
  });

  check(productsResponse, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has products': (r) => JSON.parse(r.body).data.length > 0,
  }) || errorRate.add(1);

  sleep(1); // Think time between requests
}
```

### 3. Spike Test

```javascript
// tests/load/spike-test.load.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 }, // Normal load
    { duration: '10s', target: 500 }, // Spike to 500 users
    { duration: '30s', target: 500 }, // Stay at spike
    { duration: '10s', target: 10 }, // Back to normal
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // Allow higher latency during spike
    http_req_failed: ['rate<0.05'], // Allow 5% error rate during spike
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const response = http.get(`${BASE_URL}/api/products`);

  check(response, {
    'status is 200 or 503': (r) => r.status === 200 || r.status === 503,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });
}
```

### 4. Stress Test

```javascript
// tests/load/stress-test.load.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100
    { duration: '5m', target: 200 }, // Ramp up to 200
    { duration: '5m', target: 300 }, // Ramp up to 300
    { duration: '5m', target: 400 }, // Ramp up to 400 (find breaking point)
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Degraded performance acceptable
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const response = http.get(`${BASE_URL}/api/products`);

  check(response, {
    'status is not 500': (r) => r.status !== 500,
  });
}
```

### 5. Soak Test (Endurance)

```javascript
// tests/load/soak-test.load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 }, // Ramp up
    { duration: '3h', target: 50 }, // Stay at 50 users for 3 hours
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const response = http.get(`${BASE_URL}/api/products`);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'no memory leak indicators': (r) => r.timings.duration < 1000,
  });

  sleep(2); // Realistic user behavior
}
```

### 6. Complex Scenario Test

```javascript
// tests/load/user-journey.load.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'group_duration{group:::Login}': ['p(95)<1000'],
    'group_duration{group:::Browse Products}': ['p(95)<500'],
    'group_duration{group:::Add to Cart}': ['p(95)<300'],
    'group_duration{group:::Checkout}': ['p(95)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  let authToken;

  // 1. Login
  group('Login', () => {
    const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123',
    });

    check(loginResponse, {
      'login successful': (r) => r.status === 200,
    });

    authToken = JSON.parse(loginResponse.body).token;
    sleep(1);
  });

  // 2. Browse products
  group('Browse Products', () => {
    const productsResponse = http.get(`${BASE_URL}/api/products`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    check(productsResponse, {
      'products loaded': (r) => r.status === 200,
    });

    sleep(2);
  });

  // 3. View product detail
  group('View Product', () => {
    const productResponse = http.get(`${BASE_URL}/api/products/1`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    check(productResponse, {
      'product detail loaded': (r) => r.status === 200,
    });

    sleep(3);
  });

  // 4. Add to cart
  group('Add to Cart', () => {
    const cartResponse = http.post(
      `${BASE_URL}/api/cart/items`,
      JSON.stringify({ productId: '1', quantity: 2 }),
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    check(cartResponse, {
      'added to cart': (r) => r.status === 201,
    });

    sleep(1);
  });

  // 5. Checkout
  group('Checkout', () => {
    const checkoutResponse = http.post(
      `${BASE_URL}/api/orders`,
      JSON.stringify({ cartId: '1', paymentMethod: 'credit_card' }),
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    check(checkoutResponse, {
      'order created': (r) => r.status === 201,
    });

    sleep(2);
  });
}
```

## Setup với Artillery

### 1. Cài đặt

```bash
npm install --save-dev artillery
```

### 2. Artillery Config

```yaml
# tests/load/artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: 'Warm up'
    - duration: 120
      arrivalRate: 50
      name: 'Sustained load'
    - duration: 60
      arrivalRate: 100
      name: 'Peak load'
  processor: './artillery-processor.js'
  variables:
    tenantId: 'tenant-1'
  plugins:
    expect: {}
    metrics-by-endpoint: {}

scenarios:
  - name: 'Product API Load Test'
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: 'test@example.com'
            password: 'password123'
          capture:
            - json: '$.token'
              as: 'authToken'
          expect:
            - statusCode: 200

      - get:
          url: '/api/products'
          headers:
            Authorization: 'Bearer {{ authToken }}'
            x-tenant-id: '{{ tenantId }}'
          expect:
            - statusCode: 200
            - contentType: json
            - hasProperty: data

      - think: 2

      - get:
          url: '/api/products/{{ $randomString() }}'
          headers:
            Authorization: 'Bearer {{ authToken }}'
          expect:
            - statusCode: [200, 404]

      - think: 1

      - post:
          url: '/api/cart/items'
          headers:
            Authorization: 'Bearer {{ authToken }}'
            Content-Type: 'application/json'
          json:
            productId: '{{ $randomString() }}'
            quantity: '{{ $randomNumber(1, 5) }}'
          expect:
            - statusCode: [201, 400]
```

### 3. Artillery Processor

```javascript
// tests/load/artillery-processor.js
module.exports = {
  setAuthToken,
  generateRandomProduct,
};

function setAuthToken(requestParams, context, ee, next) {
  // Add custom logic before request
  requestParams.headers = requestParams.headers || {};
  requestParams.headers['x-request-id'] = `req-${Date.now()}`;
  return next();
}

function generateRandomProduct(context, events, done) {
  context.vars.productId = `prod-${Math.floor(Math.random() * 1000)}`;
  return done();
}
```

## CI/CD Integration

```yaml
# .github/workflows/load-testing.yml
name: Load Testing

on:
  schedule:
    - cron: '0 2 * * 0' # Every Sunday at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    name: Load Testing
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Start application
        run: docker-compose up -d

      - name: Wait for application
        run: sleep 30

      - name: Run load tests
        run: k6 run tests/load/products-api.load.js

      - name: Upload results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: load-test-results
          path: results/
          retention-days: 30

      - name: Cleanup
        if: always()
        run: docker-compose down
```

## Best Practices

### 1. Define SLAs

```javascript
export const options = {
  thresholds: {
    // Response time SLAs
    http_req_duration: ['p(95)<500', 'p(99)<1000'],

    // Error rate SLAs
    http_req_failed: ['rate<0.01'], // < 1% errors

    // Throughput SLAs
    http_reqs: ['rate>100'], // > 100 req/s
  },
};
```

### 2. Test Realistic Scenarios

```javascript
// ✅ Good - Realistic user behavior
export default function () {
  browse();
  sleep(randomBetween(2, 5));
  search();
  sleep(randomBetween(1, 3));
  viewProduct();
  sleep(randomBetween(3, 7));
}

// ❌ Bad - Unrealistic hammering
export default function () {
  http.get('/api/products');
  http.get('/api/products');
  http.get('/api/products');
}
```

### 3. Monitor System Metrics

```bash
# Monitor during load test
docker stats
htop
# Database connections
psql -c "SELECT count(*) FROM pg_stat_activity;"
```

### 4. Test Different Load Patterns

- **Load Test**: Normal expected load
- **Stress Test**: Beyond normal capacity
- **Spike Test**: Sudden traffic surge
- **Soak Test**: Extended duration (memory leaks)

## Load Testing Checklist

- [ ] ✅ k6 or Artillery configured
- [ ] ✅ Realistic user scenarios defined
- [ ] ✅ SLA thresholds configured
- [ ] ✅ Load tests run in CI/CD
- [ ] ✅ System metrics monitored
- [ ] ✅ Bottlenecks identified and fixed
- [ ] ✅ Results archived and tracked
- [ ] ✅ Performance regression alerts

## Expected Impact

**Before Load Testing:**

- Performance issues found in production
- No capacity planning data
- Unknown breaking point

**After Load Testing:**

- Performance issues caught in CI
- Clear capacity limits known
- Confident scaling decisions

## Summary

Load Testing = **Verify performance under realistic load**

- ✅ Test with realistic user scenarios
- ✅ Define clear SLA thresholds
- ✅ Monitor system metrics
- ✅ Test different load patterns
- ✅ Automate in CI/CD

**Goal: Ensure system meets performance SLAs under expected load**
