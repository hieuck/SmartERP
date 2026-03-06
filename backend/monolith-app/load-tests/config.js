// Load Test Configuration
// Shared configuration for all k6 tests

export const config = {
  // Base URL - override with environment variable
  baseUrl: __ENV.BASE_URL || 'http://localhost:3000',
  
  // Test credentials
  testUser: {
    email: __ENV.TEST_EMAIL || 'loadtest@example.com',
    password: __ENV.TEST_PASSWORD || 'LoadTest123!',
    tenantSubdomain: __ENV.TENANT_SUBDOMAIN || 'loadtest',
  },
  
  // Performance thresholds
  thresholds: {
    // Response time thresholds
    http_req_duration: [
      'p(50)<200',   // 50% of requests < 200ms
      'p(95)<500',   // 95% of requests < 500ms
      'p(99)<1000',  // 99% of requests < 1000ms
    ],
    
    // Error rate threshold
    http_req_failed: ['rate<0.01'], // Error rate < 1%
    
    // Throughput threshold
    http_reqs: ['rate>100'], // > 100 requests per second
    
    // Specific endpoint thresholds
    'http_req_duration{endpoint:auth}': ['p(95)<200'],
    'http_req_duration{endpoint:products}': ['p(95)<300'],
    'http_req_duration{endpoint:orders}': ['p(95)<500'],
  },
  
  // Test scenarios
  scenarios: {
    smoke: {
      vus: 5,
      duration: '1m',
    },
    load: {
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 0 },    // Ramp down
      ],
    },
    stress: {
      stages: [
        { duration: '2m', target: 100 },   // Ramp up to 100
        { duration: '5m', target: 500 },   // Ramp up to 500
        { duration: '5m', target: 1000 },  // Ramp up to 1000
        { duration: '5m', target: 1500 },  // Push to 1500
        { duration: '3m', target: 0 },     // Ramp down
      ],
    },
    spike: {
      stages: [
        { duration: '30s', target: 50 },   // Normal load
        { duration: '30s', target: 500 },  // Sudden spike
        { duration: '2m', target: 500 },   // Maintain spike
        { duration: '30s', target: 50 },   // Back to normal
        { duration: '1m', target: 0 },     // Ramp down
      ],
    },
    soak: {
      stages: [
        { duration: '5m', target: 200 },   // Ramp up
        { duration: '2h', target: 200 },   // Stay at 200 for 2 hours
        { duration: '5m', target: 0 },     // Ramp down
      ],
    },
  },
  
  // API endpoints
  endpoints: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      me: '/api/auth/me',
      logout: '/api/auth/logout',
    },
    products: {
      list: '/api/products',
      create: '/api/products',
      get: (id) => `/api/products/${id}`,
      update: (id) => `/api/products/${id}`,
      delete: (id) => `/api/products/${id}`,
    },
    orders: {
      list: '/api/orders',
      create: '/api/orders',
      get: (id) => `/api/orders/${id}`,
      update: (id) => `/api/orders/${id}`,
      delete: (id) => `/api/orders/${id}`,
    },
    inventory: {
      list: '/api/inventory',
      movements: '/api/inventory/movements',
      transfer: '/api/inventory/transfer',
      lowStock: '/api/inventory/low-stock',
    },
    customers: {
      list: '/api/customers',
      create: '/api/customers',
      get: (id) => `/api/customers/${id}`,
    },
    suppliers: {
      list: '/api/suppliers',
      create: '/api/suppliers',
      get: (id) => `/api/suppliers/${id}`,
    },
    dashboard: {
      overview: '/api/dashboard/overview',
      charts: '/api/dashboard/charts',
      kpis: '/api/dashboard/kpis',
    },
  },
  
  // Request options
  requestOptions: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: '30s',
  },
  
  // Think time (pause between requests)
  thinkTime: {
    min: 1,  // 1 second
    max: 5,  // 5 seconds
  },
  
  // Test data
  testData: {
    products: [
      { sku: 'LOAD-001', name: 'Load Test Product 1', price: 100, cost: 50, stock: 1000 },
      { sku: 'LOAD-002', name: 'Load Test Product 2', price: 200, cost: 100, stock: 500 },
      { sku: 'LOAD-003', name: 'Load Test Product 3', price: 300, cost: 150, stock: 250 },
    ],
    customers: [
      { name: 'Load Test Customer 1', email: 'customer1@loadtest.com', phone: '0123456789' },
      { name: 'Load Test Customer 2', email: 'customer2@loadtest.com', phone: '0123456790' },
    ],
    orders: [
      { customerId: 1, items: [{ productId: 1, quantity: 10, price: 100 }] },
      { customerId: 2, items: [{ productId: 2, quantity: 5, price: 200 }] },
    ],
  },
};

// Helper functions
export function getAuthHeaders(token) {
  return {
    ...config.requestOptions.headers,
    'Authorization': `Bearer ${token}`,
  };
}

export function randomThinkTime() {
  const min = config.thinkTime.min;
  const max = config.thinkTime.max;
  return Math.random() * (max - min) + min;
}

export function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
