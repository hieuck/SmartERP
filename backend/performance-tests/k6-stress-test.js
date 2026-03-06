/**
 * k6 Stress Test Script
 *
 * Tests system behavior under extreme load conditions
 * Identifies breaking points and system limits
 * Validates Requirements 24.1, 24.2, 24.5
 *
 * Run: k6 run performance-tests/k6-stress-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const systemBreakpoint = new Counter('system_breakpoint');
const recoveryTime = new Trend('recovery_time');

// Stress test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Warm up
    { duration: '3m', target: 300 }, // Ramp up to 300 users
    { duration: '3m', target: 600 }, // Stress: 600 users
    { duration: '3m', target: 900 }, // High stress: 900 users
    { duration: '3m', target: 1200 }, // Extreme stress: 1200 users
    { duration: '3m', target: 1500 }, // Breaking point: 1500 users
    { duration: '5m', target: 1500 }, // Sustain extreme load
    { duration: '3m', target: 600 }, // Recovery phase 1
    { duration: '3m', target: 300 }, // Recovery phase 2
    { duration: '2m', target: 0 }, // Cool down
  ],
  thresholds: {
    // More lenient thresholds for stress testing
    http_req_duration: ['p(95)<5000', 'p(99)<10000'],
    http_req_failed: ['rate<0.20'], // Allow up to 20% errors under stress
    errors: ['rate<0.20'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

let breakpointReached = false;
let breakpointVUs = 0;

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AUTH_TOKEN}`,
  };

  // Track current VU count
  const currentVUs = __VU;

  // Stress test scenarios
  const scenario = randomIntBetween(1, 100);

  if (scenario <= 30) {
    // 30% - Heavy read operations
    heavyReadOperations(headers);
  } else if (scenario <= 50) {
    // 20% - Complex queries
    complexQueries(headers);
  } else if (scenario <= 70) {
    // 20% - Write operations
    writeOperations(headers);
  } else if (scenario <= 85) {
    // 15% - Mixed operations
    mixedOperations(headers);
  } else {
    // 15% - Concurrent transactions
    concurrentTransactions(headers);
  }

  // Minimal think time under stress
  sleep(randomIntBetween(0.5, 1.5));
}

function heavyReadOperations(headers) {
  group('Heavy Read Operations', () => {
    // Multiple rapid-fire read requests
    const requests = [
      { method: 'GET', url: `${BASE_URL}/products?page=1&limit=50` },
      { method: 'GET', url: `${BASE_URL}/customers?page=1&limit=50` },
      { method: 'GET', url: `${BASE_URL}/orders/sales?page=1&limit=50` },
      { method: 'GET', url: `${BASE_URL}/inventory/stock?page=1&limit=50` },
      { method: 'GET', url: `${BASE_URL}/suppliers?page=1&limit=50` },
    ];

    const responses = http.batch(
      requests.map((req) => ({
        method: req.method,
        url: req.url,
        params: { headers },
      })),
    );

    let successCount = 0;
    responses.forEach((res, index) => {
      const success = check(res, {
        [`batch request ${index} status 200`]: (r) => r.status === 200,
      });
      if (success) successCount++;
      else errorRate.add(1);
    });

    // Check if system is breaking
    if (successCount < responses.length * 0.5) {
      if (!breakpointReached) {
        breakpointReached = true;
        breakpointVUs = __VU;
        systemBreakpoint.add(1);
        console.log(`System breakpoint reached at ${__VU} VUs`);
      }
    }
  });
}

function complexQueries(headers) {
  group('Complex Queries', () => {
    // Complex search with multiple filters
    const res1 = http.get(
      `${BASE_URL}/products?page=1&limit=50&search=test&status=active&categoryId=cat-1&minPrice=100&maxPrice=1000&sortBy=price&sortOrder=desc`,
      { headers },
    );

    check(res1, {
      'complex search status': (r) => r.status === 200 || r.status === 504,
    }) || errorRate.add(1);

    sleep(0.3);

    // Aggregation query
    const res2 = http.get(
      `${BASE_URL}/reports/inventory?groupBy=category&startDate=2024-01-01&endDate=2024-12-31`,
      { headers },
    );

    check(res2, {
      'aggregation query status': (r) => r.status === 200 || r.status === 504,
    }) || errorRate.add(1);

    sleep(0.3);

    // Join-heavy query
    const res3 = http.get(
      `${BASE_URL}/orders/sales?page=1&limit=50&includeCustomer=true&includeItems=true&includePayments=true`,
      { headers },
    );

    check(res3, {
      'join query status': (r) => r.status === 200 || r.status === 504,
    }) || errorRate.add(1);
  });
}

function writeOperations(headers) {
  group('Write Operations', () => {
    // Rapid write operations
    const productData = {
      name: `Stress Test Product ${Date.now()}`,
      sku: `STRESS-${Date.now()}-${randomIntBetween(1000, 9999)}`,
      description: 'Stress test product',
      categoryId: 'test-category',
      unit: 'pcs',
      purchasePrice: randomIntBetween(50, 500),
      salePrice: randomIntBetween(100, 1000),
      status: 'active',
    };

    const res = http.post(`${BASE_URL}/products`, JSON.stringify(productData), { headers });

    check(res, {
      'create under stress': (r) => r.status === 201 || r.status === 503 || r.status === 504,
    }) || errorRate.add(1);

    // Try to create customer
    sleep(0.2);

    const customerData = {
      name: `Stress Customer ${Date.now()}`,
      code: `CUST-${Date.now()}`,
      type: 'individual',
      phone: `09${randomIntBetween(10000000, 99999999)}`,
      email: `stress${Date.now()}@test.com`,
      status: 'active',
    };

    const res2 = http.post(`${BASE_URL}/customers`, JSON.stringify(customerData), { headers });

    check(res2, {
      'create customer under stress': (r) =>
        r.status === 201 || r.status === 503 || r.status === 504,
    }) || errorRate.add(1);
  });
}

function mixedOperations(headers) {
  group('Mixed Operations', () => {
    // Simulate real-world mixed workload

    // Read
    const res1 = http.get(`${BASE_URL}/products?page=1&limit=20`, { headers });
    check(res1, { 'mixed read': (r) => r.status === 200 }) || errorRate.add(1);

    sleep(0.2);

    // Write
    const data = {
      name: `Mixed ${Date.now()}`,
      sku: `MIX-${Date.now()}`,
      categoryId: 'test',
      unit: 'pcs',
      purchasePrice: 100,
      salePrice: 150,
    };

    const res2 = http.post(`${BASE_URL}/products`, JSON.stringify(data), { headers });
    check(res2, { 'mixed write': (r) => r.status === 201 || r.status === 503 }) || errorRate.add(1);

    sleep(0.2);

    // Update
    if (res2.status === 201) {
      try {
        const body = JSON.parse(res2.body);
        const id = body.data?.id;
        if (id) {
          const res3 = http.put(
            `${BASE_URL}/products/${id}`,
            JSON.stringify({ ...data, name: `Updated ${data.name}` }),
            { headers },
          );
          check(res3, { 'mixed update': (r) => r.status === 200 || r.status === 404 }) ||
            errorRate.add(1);
        }
      } catch (e) {
        // Ignore parsing errors under stress
      }
    }
  });
}

function concurrentTransactions(headers) {
  group('Concurrent Transactions', () => {
    // Simulate concurrent inventory transactions
    const stockData = {
      productId: `product-${randomIntBetween(1, 100)}`,
      warehouseId: 'warehouse-1',
      quantity: randomIntBetween(1, 100),
      type: 'adjustment',
      notes: `Stress test transaction ${Date.now()}`,
    };

    const res = http.post(`${BASE_URL}/inventory/adjustment`, JSON.stringify(stockData), {
      headers,
    });

    check(res, {
      'concurrent transaction': (r) =>
        r.status === 201 ||
        r.status === 409 || // Conflict (expected under high concurrency)
        r.status === 503 || // Service unavailable
        r.status === 504, // Gateway timeout
    }) || errorRate.add(1);
  });
}

export function handleSummary(data) {
  const summary = {
    testType: 'Stress Test',
    timestamp: new Date().toISOString(),
    breakpointReached: breakpointReached,
    breakpointVUs: breakpointVUs,
    metrics: {},
  };

  // Extract key metrics
  if (data.metrics) {
    for (const [name, metric] of Object.entries(data.metrics)) {
      if (metric.values) {
        summary.metrics[name] = {
          avg: metric.values.avg,
          min: metric.values.min,
          max: metric.values.max,
          p95: metric.values['p(95)'],
          p99: metric.values['p(99)'],
        };
      }
    }
  }

  console.log('\n=== STRESS TEST SUMMARY ===');
  console.log(`Breakpoint Reached: ${breakpointReached}`);
  if (breakpointReached) {
    console.log(`System broke at approximately ${breakpointVUs} concurrent users`);
  }
  console.log('===========================\n');

  return {
    'stress-test-summary.json': JSON.stringify(summary, null, 2),
    stdout: generateTextSummary(data),
  };
}

function generateTextSummary(data) {
  let summary = '\n';
  summary += '╔════════════════════════════════════════════════════════════╗\n';
  summary += '║              STRESS TEST RESULTS                           ║\n';
  summary += '╚════════════════════════════════════════════════════════════╝\n\n';

  if (data.metrics) {
    summary += 'Key Metrics:\n';
    summary += '─────────────────────────────────────────────────────────────\n';

    const keyMetrics = [
      'http_req_duration',
      'http_req_failed',
      'http_reqs',
      'errors',
      'crud_operations_duration',
      'pagination_duration',
    ];

    keyMetrics.forEach((metricName) => {
      const metric = data.metrics[metricName];
      if (metric && metric.values) {
        summary += `\n${metricName}:\n`;
        summary += `  Average: ${metric.values.avg?.toFixed(2) || 'N/A'} ms\n`;
        summary += `  Min: ${metric.values.min?.toFixed(2) || 'N/A'} ms\n`;
        summary += `  Max: ${metric.values.max?.toFixed(2) || 'N/A'} ms\n`;
        summary += `  P95: ${metric.values['p(95)']?.toFixed(2) || 'N/A'} ms\n`;
        summary += `  P99: ${metric.values['p(99)']?.toFixed(2) || 'N/A'} ms\n`;
      }
    });
  }

  summary += '\n─────────────────────────────────────────────────────────────\n';
  summary += `Breakpoint Status: ${breakpointReached ? 'REACHED' : 'NOT REACHED'}\n`;
  if (breakpointReached) {
    summary += `Breaking Point: ~${breakpointVUs} concurrent users\n`;
  }
  summary += '─────────────────────────────────────────────────────────────\n\n';

  return summary;
}
