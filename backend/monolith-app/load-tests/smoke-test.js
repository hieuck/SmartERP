// Smoke Test - Minimal load to verify system works
// Duration: 1 minute
// Users: 1-5 concurrent

import http from 'k6/http';
import { check, sleep } from 'k6';
import { config, getAuthHeaders, randomThinkTime } from './config.js';

export const options = {
  vus: 5,
  duration: '1m',
  thresholds: config.thresholds,
  tags: {
    test_type: 'smoke',
  },
};

let authToken = null;

export function setup() {
  // Login once for all VUs
  const loginRes = http.post(
    `${config.baseUrl}${config.endpoints.auth.login}`,
    JSON.stringify({
      email: config.testUser.email,
      password: config.testUser.password,
    }),
    { headers: config.requestOptions.headers }
  );
  
  check(loginRes, {
    'setup: login successful': (r) => r.status === 200,
  });
  
  return {
    token: loginRes.json('accessToken'),
  };
}

export default function (data) {
  const headers = getAuthHeaders(data.token);
  
  // Test 1: Get user profile
  const meRes = http.get(
    `${config.baseUrl}${config.endpoints.auth.me}`,
    { headers, tags: { endpoint: 'auth' } }
  );
  
  check(meRes, {
    'get profile: status 200': (r) => r.status === 200,
    'get profile: has user data': (r) => r.json('email') !== undefined,
  });
  
  sleep(randomThinkTime());
  
  // Test 2: List products
  const productsRes = http.get(
    `${config.baseUrl}${config.endpoints.products.list}`,
    { headers, tags: { endpoint: 'products' } }
  );
  
  check(productsRes, {
    'list products: status 200': (r) => r.status === 200,
    'list products: has data': (r) => r.json('data') !== undefined,
  });
  
  sleep(randomThinkTime());
  
  // Test 3: List orders
  const ordersRes = http.get(
    `${config.baseUrl}${config.endpoints.orders.list}`,
    { headers, tags: { endpoint: 'orders' } }
  );
  
  check(ordersRes, {
    'list orders: status 200': (r) => r.status === 200,
    'list orders: has data': (r) => r.json('data') !== undefined,
  });
  
  sleep(randomThinkTime());
  
  // Test 4: Dashboard overview
  const dashboardRes = http.get(
    `${config.baseUrl}${config.endpoints.dashboard.overview}`,
    { headers, tags: { endpoint: 'dashboard' } }
  );
  
  check(dashboardRes, {
    'dashboard: status 200': (r) => r.status === 200,
    'dashboard: has metrics': (r) => r.json('revenue') !== undefined,
  });
  
  sleep(randomThinkTime());
}

export function teardown(data) {
  // Cleanup if needed
  console.log('Smoke test completed');
}
