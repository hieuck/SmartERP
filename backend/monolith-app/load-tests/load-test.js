// Load Test - Normal production load
// Duration: 10 minutes
// Users: 100 concurrent (ramp up from 0)

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { config, getAuthHeaders, randomThinkTime, getRandomItem, generateUniqueId } from './config.js';

// Custom metrics
const errorRate = new Rate('errors');
const authDuration = new Trend('auth_duration');
const productDuration = new Trend('product_duration');
const orderDuration = new Trend('order_duration');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 100 },  // Continue at 100
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    ...config.thresholds,
    errors: ['rate<0.01'],
    auth_duration: ['p(95)<200'],
    product_duration: ['p(95)<300'],
    order_duration: ['p(95)<500'],
  },
  tags: {
    test_type: 'load',
  },
};

export function setup() {
  // Login for test user
  const loginRes = http.post(
    `${config.baseUrl}${config.endpoints.auth.login}`,
    JSON.stringify({
      email: config.testUser.email,
      password: config.testUser.password,
    }),
    { headers: config.requestOptions.headers }
  );
  
  return {
    token: loginRes.json('accessToken'),
  };
}

export default function (data) {
  const headers = getAuthHeaders(data.token);
  
  // Scenario 1: Browse products (60% of users)
  if (Math.random() < 0.6) {
    group('Browse Products', function () {
      const start = Date.now();
      const res = http.get(
        `${config.baseUrl}${config.endpoints.products.list}?page=1&limit=20`,
        { headers, tags: { endpoint: 'products' } }
      );
      productDuration.add(Date.now() - start);
      
      const success = check(res, {
        'products: status 200': (r) => r.status === 200,
        'products: has data': (r) => r.json('data') !== undefined,
      });
      errorRate.add(!success);
      
      sleep(randomThinkTime());
      
      // View product details
      if (res.json('data.length') > 0) {
        const productId = res.json('data.0.id');
        const detailRes = http.get(
          `${config.baseUrl}${config.endpoints.products.get(productId)}`,
          { headers, tags: { endpoint: 'products' } }
        );
        
        check(detailRes, {
          'product detail: status 200': (r) => r.status === 200,
        });
      }
    });
  }
  
  // Scenario 2: Create order (30% of users)
  else if (Math.random() < 0.85) {
    group('Create Order', function () {
      // Get customers
      const customersRes = http.get(
        `${config.baseUrl}${config.endpoints.customers.list}?limit=10`,
        { headers, tags: { endpoint: 'customers' } }
      );
      
      sleep(1);
      
      // Create order
      const start = Date.now();
      const orderData = {
        customerId: 1,
        items: [
          { productId: 1, quantity: 5, price: 100 },
          { productId: 2, quantity: 3, price: 200 },
        ],
        status: 'PENDING',
      };
      
      const orderRes = http.post(
        `${config.baseUrl}${config.endpoints.orders.create}`,
        JSON.stringify(orderData),
        { headers, tags: { endpoint: 'orders' } }
      );
      orderDuration.add(Date.now() - start);
      
      const success = check(orderRes, {
        'create order: status 201': (r) => r.status === 201,
        'create order: has id': (r) => r.json('id') !== undefined,
      });
      errorRate.add(!success);
      
      sleep(randomThinkTime());
    });
  }
  
  // Scenario 3: Check dashboard (10% of users)
  else {
    group('View Dashboard', function () {
      const dashRes = http.get(
        `${config.baseUrl}${config.endpoints.dashboard.overview}`,
        { headers, tags: { endpoint: 'dashboard' } }
      );
      
      check(dashRes, {
        'dashboard: status 200': (r) => r.status === 200,
        'dashboard: has revenue': (r) => r.json('revenue') !== undefined,
      });
      
      sleep(randomThinkTime());
      
      // Get charts data
      const chartsRes = http.get(
        `${config.baseUrl}${config.endpoints.dashboard.charts}`,
        { headers, tags: { endpoint: 'dashboard' } }
      );
      
      check(chartsRes, {
        'charts: status 200': (r) => r.status === 200,
      });
    });
  }
  
  sleep(randomThinkTime());
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}Load Test Summary\n`;
  summary += `${indent}================\n\n`;
  summary += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%\n`;
  summary += `${indent}Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s\n\n`;
  summary += `${indent}Response Times:\n`;
  summary += `${indent}  p50: ${data.metrics.http_req_duration.values['p(50)']}ms\n`;
  summary += `${indent}  p95: ${data.metrics.http_req_duration.values['p(95)']}ms\n`;
  summary += `${indent}  p99: ${data.metrics.http_req_duration.values['p(99)']}ms\n`;
  summary += `${indent}  max: ${data.metrics.http_req_duration.values.max}ms\n\n`;
  
  return summary;
}
