/**
 * k6 Load Test Script
 *
 * Tests system performance with 500 concurrent users
 * Validates Requirements 24.1, 24.2, 24.5
 *
 * Run: k6 run performance-tests/k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const crudDuration = new Trend('crud_operations_duration');
const paginationDuration = new Trend('pagination_duration');
const apiCallCounter = new Counter('api_calls');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 }, // Warm up to 50 users
    { duration: '3m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 250 }, // Ramp up to 250 users
    { duration: '5m', target: 500 }, // Peak load: 500 concurrent users
    { duration: '5m', target: 500 }, // Sustain 500 users
    { duration: '3m', target: 250 }, // Ramp down to 250 users
    { duration: '2m', target: 0 }, // Cool down
  ],
  thresholds: {
    // Requirement 24.1: CRUD operations < 1 second
    crud_operations_duration: ['p(95)<1000', 'p(99)<2000'],

    // Requirement 24.2: Paginated lists < 2 seconds
    pagination_duration: ['p(95)<2000', 'p(99)<3000'],

    // Overall HTTP request duration
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],

    // Error rate should be < 5%
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],

    // Request rate (throughput)
    http_reqs: ['rate>100'], // At least 100 requests/second
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

// Test data
const testData = {
  products: [],
  customers: [],
  orders: [],
};

export function setup() {
  console.log('Setting up test data...');

  // In a real scenario, you would fetch or create test data here
  // For now, we'll generate mock IDs
  for (let i = 0; i < 100; i++) {
    testData.products.push(`product-${i}`);
    testData.customers.push(`customer-${i}`);
    testData.orders.push(`order-${i}`);
  }

  return testData;
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AUTH_TOKEN}`,
  };

  // Simulate realistic user behavior with different scenarios
  const scenario = randomIntBetween(1, 100);

  if (scenario <= 40) {
    // 40% - Browse products
    browseProducts(headers);
  } else if (scenario <= 60) {
    // 20% - Search and filter
    searchProducts(headers);
  } else if (scenario <= 75) {
    // 15% - View customer data
    viewCustomers(headers);
  } else if (scenario <= 90) {
    // 15% - Manage orders
    manageOrders(headers);
  } else {
    // 10% - Create/update operations
    performCRUDOperations(headers, data);
  }

  // Random think time between 1-3 seconds
  sleep(randomIntBetween(1, 3));
}

function browseProducts(headers) {
  group('Browse Products', () => {
    // Test pagination performance (Requirement 24.2)
    const page = randomIntBetween(1, 20);
    const limit = randomIntBetween(10, 50);

    const start = Date.now();
    const res = http.get(`${BASE_URL}/products?page=${page}&limit=${limit}`, { headers });
    const duration = Date.now() - start;

    paginationDuration.add(duration);
    apiCallCounter.add(1);

    const success = check(res, {
      'product list status 200': (r) => r.status === 200,
      'product list has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && Array.isArray(body.data);
        } catch {
          return false;
        }
      },
      'product list duration < 2s': () => duration < 2000,
    });

    if (!success) errorRate.add(1);

    sleep(0.5);

    // View product details
    if (res.status === 200) {
      try {
        const body = JSON.parse(res.body);
        if (body.data && body.data.length > 0) {
          const productId = body.data[0].id;
          viewProductDetails(productId, headers);
        }
      } catch (e) {
        console.error('Error parsing product list:', e);
      }
    }
  });
}

function viewProductDetails(productId, headers) {
  const start = Date.now();
  const res = http.get(`${BASE_URL}/products/${productId}`, { headers });
  const duration = Date.now() - start;

  crudDuration.add(duration);
  apiCallCounter.add(1);

  const success = check(res, {
    'product details status 200': (r) => r.status === 200,
    'product details has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.id;
      } catch {
        return false;
      }
    },
    'product details duration < 1s': () => duration < 1000,
  });

  if (!success) errorRate.add(1);
}

function searchProducts(headers) {
  group('Search Products', () => {
    const searchTerms = ['tượng', 'thạch cao', 'product', 'test', 'sample'];
    const searchTerm = searchTerms[randomIntBetween(0, searchTerms.length - 1)];

    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/products?page=1&limit=20&search=${searchTerm}&status=active`,
      { headers },
    );
    const duration = Date.now() - start;

    paginationDuration.add(duration);
    apiCallCounter.add(1);

    const success = check(res, {
      'search status 200': (r) => r.status === 200,
      'search has results': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data !== undefined;
        } catch {
          return false;
        }
      },
      'search duration < 2s': () => duration < 2000,
    });

    if (!success) errorRate.add(1);
  });
}

function viewCustomers(headers) {
  group('View Customers', () => {
    const page = randomIntBetween(1, 10);

    const start = Date.now();
    const res = http.get(`${BASE_URL}/customers?page=${page}&limit=20`, { headers });
    const duration = Date.now() - start;

    paginationDuration.add(duration);
    apiCallCounter.add(1);

    const success = check(res, {
      'customer list status 200': (r) => r.status === 200,
      'customer list duration < 2s': () => duration < 2000,
    });

    if (!success) errorRate.add(1);
  });
}

function manageOrders(headers) {
  group('Manage Orders', () => {
    const page = randomIntBetween(1, 10);
    const statuses = ['draft', 'confirmed', 'preparing', 'shipping', 'completed'];
    const status = statuses[randomIntBetween(0, statuses.length - 1)];

    const start = Date.now();
    const res = http.get(`${BASE_URL}/orders/sales?page=${page}&limit=20&status=${status}`, {
      headers,
    });
    const duration = Date.now() - start;

    paginationDuration.add(duration);
    apiCallCounter.add(1);

    const success = check(res, {
      'order list status 200': (r) => r.status === 200,
      'order list duration < 2s': () => duration < 2000,
    });

    if (!success) errorRate.add(1);
  });
}

function performCRUDOperations(headers, data) {
  group('CRUD Operations', () => {
    // Create a new product
    const productData = {
      name: `Test Product ${randomString(8)}`,
      sku: `SKU-${randomString(10)}`,
      description: 'Performance test product',
      categoryId: 'test-category-id',
      unit: 'pcs',
      purchasePrice: randomIntBetween(50, 500),
      salePrice: randomIntBetween(100, 1000),
      status: 'active',
    };

    const start = Date.now();
    const res = http.post(`${BASE_URL}/products`, JSON.stringify(productData), { headers });
    const duration = Date.now() - start;

    crudDuration.add(duration);
    apiCallCounter.add(1);

    const success = check(res, {
      'create product status 201': (r) => r.status === 201,
      'create product has id': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.id;
        } catch {
          return false;
        }
      },
      'create product duration < 1s': () => duration < 1000,
    });

    if (!success) errorRate.add(1);

    // Update the product if creation was successful
    if (res.status === 201) {
      try {
        const body = JSON.parse(res.body);
        const productId = body.data.id;

        sleep(0.5);

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

        crudDuration.add(updateDuration);
        apiCallCounter.add(1);

        const updateSuccess = check(updateRes, {
          'update product status 200': (r) => r.status === 200,
          'update product duration < 1s': () => updateDuration < 1000,
        });

        if (!updateSuccess) errorRate.add(1);
      } catch (e) {
        console.error('Error in update operation:', e);
      }
    }
  });
}

export function teardown(data) {
  console.log('Test completed. Cleaning up...');
}

export function handleSummary(data) {
  return {
    'performance-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n';
  summary += `${indent}Test Summary:\n`;
  summary += `${indent}=============\n\n`;

  // Metrics
  if (data.metrics) {
    summary += `${indent}Metrics:\n`;

    for (const [name, metric] of Object.entries(data.metrics)) {
      if (metric.values) {
        summary += `${indent}  ${name}:\n`;
        summary += `${indent}    avg: ${metric.values.avg?.toFixed(2) || 'N/A'}\n`;
        summary += `${indent}    min: ${metric.values.min?.toFixed(2) || 'N/A'}\n`;
        summary += `${indent}    max: ${metric.values.max?.toFixed(2) || 'N/A'}\n`;
        summary += `${indent}    p(95): ${metric.values['p(95)']?.toFixed(2) || 'N/A'}\n`;
        summary += `${indent}    p(99): ${metric.values['p(99)']?.toFixed(2) || 'N/A'}\n`;
      }
    }
  }

  return summary;
}
