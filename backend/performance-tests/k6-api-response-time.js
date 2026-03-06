/**
 * k6 API Response Time Validation Script
 *
 * Validates that API endpoints meet response time requirements
 * - CRUD operations < 1 second (Requirement 24.1)
 * - Paginated lists < 2 seconds (Requirement 24.2)
 *
 * Run: k6 run performance-tests/k6-api-response-time.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const crudResponseTime = new Trend('crud_response_time', true);
const paginationResponseTime = new Trend('pagination_response_time', true);
const searchResponseTime = new Trend('search_response_time', true);
const errorRate = new Rate('errors');
const passedChecks = new Counter('passed_checks');
const failedChecks = new Counter('failed_checks');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Warm up
    { duration: '2m', target: 50 }, // Ramp to 50 users
    { duration: '5m', target: 50 }, // Sustain 50 users
    { duration: '30s', target: 0 }, // Cool down
  ],
  thresholds: {
    // Requirement 24.1: CRUD operations < 1 second
    crud_response_time: [
      'p(95)<1000', // 95% of CRUD operations < 1s
      'p(99)<1500', // 99% of CRUD operations < 1.5s
    ],

    // Requirement 24.2: Paginated lists < 2 seconds
    pagination_response_time: [
      'p(95)<2000', // 95% of paginated requests < 2s
      'p(99)<3000', // 99% of paginated requests < 3s
    ],

    // Search should also be fast
    search_response_time: ['p(95)<2000', 'p(99)<3000'],

    // Overall HTTP metrics
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.05'], // Less than 5% errors
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

export default function () {
  // Test different API endpoints
  testProductAPIs();
  sleep(1);

  testCustomerAPIs();
  sleep(1);

  testOrderAPIs();
  sleep(1);

  testInventoryAPIs();
  sleep(1);
}

function testProductAPIs() {
  group('Product APIs', () => {
    // Test 1: List products (pagination)
    group('GET /products (pagination)', () => {
      const page = randomIntBetween(1, 10);
      const limit = randomIntBetween(10, 50);

      const start = Date.now();
      const res = http.get(`${BASE_URL}/products?page=${page}&limit=${limit}`, { headers });
      const duration = Date.now() - start;

      paginationResponseTime.add(duration);

      const passed = check(res, {
        'product list status 200': (r) => r.status === 200,
        'product list has data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data !== undefined;
          } catch {
            return false;
          }
        },
        'product list < 2s (Req 24.2)': () => duration < 2000,
      });

      if (passed) {
        passedChecks.add(1);
      } else {
        failedChecks.add(1);
        errorRate.add(1);
      }
    });

    sleep(0.5);

    // Test 2: Get product by ID (CRUD read)
    group('GET /products/:id (CRUD)', () => {
      const productId = 'test-product-id'; // In real test, use actual ID

      const start = Date.now();
      const res = http.get(`${BASE_URL}/products/${productId}`, { headers });
      const duration = Date.now() - start;

      crudResponseTime.add(duration);

      const passed = check(res, {
        'product details status': (r) => r.status === 200 || r.status === 404,
        'product details < 1s (Req 24.1)': () => duration < 1000,
      });

      if (passed) {
        passedChecks.add(1);
      } else {
        failedChecks.add(1);
        errorRate.add(1);
      }
    });

    sleep(0.5);

    // Test 3: Create product (CRUD create)
    group('POST /products (CRUD)', () => {
      const productData = {
        name: `Test Product ${randomString(8)}`,
        sku: `SKU-${randomString(10)}`,
        description: 'API response time test product',
        categoryId: 'test-category-id',
        unit: 'pcs',
        purchasePrice: randomIntBetween(50, 500),
        salePrice: randomIntBetween(100, 1000),
        status: 'active',
      };

      const start = Date.now();
      const res = http.post(`${BASE_URL}/products`, JSON.stringify(productData), { headers });
      const duration = Date.now() - start;

      crudResponseTime.add(duration);

      const passed = check(res, {
        'create product status': (r) => r.status === 201 || r.status === 400,
        'create product < 1s (Req 24.1)': () => duration < 1000,
      });

      if (passed) {
        passedChecks.add(1);
      } else {
        failedChecks.add(1);
        errorRate.add(1);
      }

      // Test 4: Update product if creation succeeded
      if (res.status === 201) {
        try {
          const body = JSON.parse(res.body);
          const productId = body.data?.id;

          if (productId) {
            sleep(0.3);

            group('PUT /products/:id (CRUD)', () => {
              const updateData = {
                ...productData,
                name: `Updated ${productData.name}`,
                salePrice: productData.salePrice + 50,
              };

              const updateStart = Date.now();
              const updateRes = http.put(
                `${BASE_URL}/products/${productId}`,
                JSON.stringify(updateData),
                { headers },
              );
              const updateDuration = Date.now() - updateStart;

              crudResponseTime.add(updateDuration);

              const updatePassed = check(updateRes, {
                'update product status': (r) => r.status === 200 || r.status === 404,
                'update product < 1s (Req 24.1)': () => updateDuration < 1000,
              });

              if (updatePassed) {
                passedChecks.add(1);
              } else {
                failedChecks.add(1);
                errorRate.add(1);
              }
            });
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });

    sleep(0.5);

    // Test 5: Search products
    group('GET /products?search=... (search)', () => {
      const searchTerms = ['test', 'product', 'sample', 'tượng'];
      const searchTerm = searchTerms[randomIntBetween(0, searchTerms.length - 1)];

      const start = Date.now();
      const res = http.get(`${BASE_URL}/products?page=1&limit=20&search=${searchTerm}`, {
        headers,
      });
      const duration = Date.now() - start;

      searchResponseTime.add(duration);

      const passed = check(res, {
        'search status 200': (r) => r.status === 200,
        'search < 2s': () => duration < 2000,
      });

      if (passed) {
        passedChecks.add(1);
      } else {
        failedChecks.add(1);
        errorRate.add(1);
      }
    });
  });
}

function testCustomerAPIs() {
  group('Customer APIs', () => {
    // Test pagination
    group('GET /customers (pagination)', () => {
      const page = randomIntBetween(1, 10);

      const start = Date.now();
      const res = http.get(`${BASE_URL}/customers?page=${page}&limit=20`, { headers });
      const duration = Date.now() - start;

      paginationResponseTime.add(duration);

      const passed = check(res, {
        'customer list status 200': (r) => r.status === 200,
        'customer list < 2s (Req 24.2)': () => duration < 2000,
      });

      if (passed) {
        passedChecks.add(1);
      } else {
        failedChecks.add(1);
        errorRate.add(1);
      }
    });

    sleep(0.5);

    // Test CRUD
    group('POST /customers (CRUD)', () => {
      const customerData = {
        name: `Test Customer ${randomString(8)}`,
        code: `CUST-${randomString(10)}`,
        type: 'individual',
        phone: `09${randomIntBetween(10000000, 99999999)}`,
        email: `test${randomString(8)}@example.com`,
        status: 'active',
      };

      const start = Date.now();
      const res = http.post(`${BASE_URL}/customers`, JSON.stringify(customerData), { headers });
      const duration = Date.now() - start;

      crudResponseTime.add(duration);

      const passed = check(res, {
        'create customer status': (r) => r.status === 201 || r.status === 400,
        'create customer < 1s (Req 24.1)': () => duration < 1000,
      });

      if (passed) {
        passedChecks.add(1);
      } else {
        failedChecks.add(1);
        errorRate.add(1);
      }
    });
  });
}

function testOrderAPIs() {
  group('Order APIs', () => {
    // Test pagination
    group('GET /orders/sales (pagination)', () => {
      const page = randomIntBetween(1, 10);
      const statuses = ['draft', 'confirmed', 'preparing', 'completed'];
      const status = statuses[randomIntBetween(0, statuses.length - 1)];

      const start = Date.now();
      const res = http.get(`${BASE_URL}/orders/sales?page=${page}&limit=20&status=${status}`, {
        headers,
      });
      const duration = Date.now() - start;

      paginationResponseTime.add(duration);

      const passed = check(res, {
        'order list status 200': (r) => r.status === 200,
        'order list < 2s (Req 24.2)': () => duration < 2000,
      });

      if (passed) {
        passedChecks.add(1);
      } else {
        failedChecks.add(1);
        errorRate.add(1);
      }
    });
  });
}

function testInventoryAPIs() {
  group('Inventory APIs', () => {
    // Test pagination
    group('GET /inventory/stock (pagination)', () => {
      const page = randomIntBetween(1, 10);

      const start = Date.now();
      const res = http.get(`${BASE_URL}/inventory/stock?page=${page}&limit=20`, { headers });
      const duration = Date.now() - start;

      paginationResponseTime.add(duration);

      const passed = check(res, {
        'stock list status 200': (r) => r.status === 200,
        'stock list < 2s (Req 24.2)': () => duration < 2000,
      });

      if (passed) {
        passedChecks.add(1);
      } else {
        failedChecks.add(1);
        errorRate.add(1);
      }
    });

    sleep(0.5);

    // Test stock receipts pagination
    group('GET /inventory/receipts (pagination)', () => {
      const page = randomIntBetween(1, 5);

      const start = Date.now();
      const res = http.get(`${BASE_URL}/inventory/receipts?page=${page}&limit=20`, { headers });
      const duration = Date.now() - start;

      paginationResponseTime.add(duration);

      const passed = check(res, {
        'receipts list status 200': (r) => r.status === 200,
        'receipts list < 2s (Req 24.2)': () => duration < 2000,
      });

      if (passed) {
        passedChecks.add(1);
      } else {
        failedChecks.add(1);
        errorRate.add(1);
      }
    });
  });
}

export function handleSummary(data) {
  const summary = {
    testType: 'API Response Time Validation',
    timestamp: new Date().toISOString(),
    requirements: {
      24.1: 'CRUD operations < 1 second',
      24.2: 'Paginated lists < 2 seconds',
    },
    metrics: {},
    thresholds: {},
  };

  // Extract metrics
  if (data.metrics) {
    for (const [name, metric] of Object.entries(data.metrics)) {
      if (metric.values) {
        summary.metrics[name] = {
          avg: metric.values.avg?.toFixed(2),
          min: metric.values.min?.toFixed(2),
          max: metric.values.max?.toFixed(2),
          p50: metric.values['p(50)']?.toFixed(2),
          p95: metric.values['p(95)']?.toFixed(2),
          p99: metric.values['p(99)']?.toFixed(2),
        };
      }

      if (metric.thresholds) {
        summary.thresholds[name] = {};
        for (const [threshold, result] of Object.entries(metric.thresholds)) {
          summary.thresholds[name][threshold] = result.ok ? 'PASSED' : 'FAILED';
        }
      }
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         API RESPONSE TIME VALIDATION RESULTS               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // CRUD Operations (Requirement 24.1)
  if (summary.metrics.crud_response_time) {
    const crud = summary.metrics.crud_response_time;
    console.log('Requirement 24.1: CRUD Operations < 1 second');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`  Average: ${crud.avg} ms`);
    console.log(`  P95: ${crud.p95} ms ${parseFloat(crud.p95) < 1000 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  P99: ${crud.p99} ms ${parseFloat(crud.p99) < 1500 ? '✓ PASS' : '✗ FAIL'}`);
    console.log('');
  }

  // Pagination (Requirement 24.2)
  if (summary.metrics.pagination_response_time) {
    const pagination = summary.metrics.pagination_response_time;
    console.log('Requirement 24.2: Paginated Lists < 2 seconds');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`  Average: ${pagination.avg} ms`);
    console.log(
      `  P95: ${pagination.p95} ms ${parseFloat(pagination.p95) < 2000 ? '✓ PASS' : '✗ FAIL'}`,
    );
    console.log(
      `  P99: ${pagination.p99} ms ${parseFloat(pagination.p99) < 3000 ? '✓ PASS' : '✗ FAIL'}`,
    );
    console.log('');
  }

  // Search Performance
  if (summary.metrics.search_response_time) {
    const search = summary.metrics.search_response_time;
    console.log('Search Performance');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`  Average: ${search.avg} ms`);
    console.log(`  P95: ${search.p95} ms`);
    console.log(`  P99: ${search.p99} ms`);
    console.log('');
  }

  // Overall Results
  console.log('Overall Results');
  console.log('─────────────────────────────────────────────────────────────');

  let allPassed = true;
  if (summary.thresholds) {
    for (const [metric, thresholds] of Object.entries(summary.thresholds)) {
      for (const [threshold, result] of Object.entries(thresholds)) {
        console.log(`  ${metric} ${threshold}: ${result}`);
        if (result === 'FAILED') allPassed = false;
      }
    }
  }

  console.log('─────────────────────────────────────────────────────────────');
  console.log(`\nFinal Result: ${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}\n`);

  return {
    'api-response-time-summary.json': JSON.stringify(summary, null, 2),
    stdout: '', // We already printed to console
  };
}
