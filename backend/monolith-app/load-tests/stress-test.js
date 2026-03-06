// Stress Test - Find system breaking point
// Duration: 20 minutes
// Users: Ramp up to 1,500+ concurrent

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config, getAuthHeaders, randomThinkTime } from './config.js';

// Custom metrics
const errorRate = new Rate('errors');
const timeouts = new Counter('timeouts');
const serverErrors = new Counter('server_errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Warm up
    { duration: '3m', target: 300 },   // Ramp to 300
    { duration: '3m', target: 600 },   // Ramp to 600
    { duration: '3m', target: 1000 },  // Ramp to 1000
    { duration: '3m', target: 1500 },  // Push to 1500
    { duration: '3m', target: 2000 },  // Push to 2000 (breaking point)
    { duration: '3m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // Relaxed threshold for stress
    http_req_failed: ['rate<0.05'],     // Allow 5% error rate
    errors: ['rate<0.05'],
  },
  tags: {
    test_type: 'stress',
  },
};

export function setup() {
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
  
  // Mix of read and write operations
  const scenario = Math.random();
  
  if (scenario < 0.5) {
    // Read-heavy scenario (50%)
    group('Read Operations', function () {
      // Products
      const productsRes = http.get(
        `${config.baseUrl}${config.endpoints.products.list}?page=1&limit=50`,
        { 
          headers, 
          tags: { endpoint: 'products', operation: 'read' },
          timeout: '10s',
        }
      );
      
      const success = check(productsRes, {
        'products: status 200': (r) => r.status === 200,
        'products: response time OK': (r) => r.timings.duration < 2000,
      });
      
      if (!success) {
        errorRate.add(1);
        if (productsRes.status === 0) timeouts.add(1);
        if (productsRes.status >= 500) serverErrors.add(1);
      } else {
        errorRate.add(0);
      }
      
      sleep(0.5);
      
      // Orders
      const ordersRes = http.get(
        `${config.baseUrl}${config.endpoints.orders.list}?page=1&limit=50`,
        { 
          headers, 
          tags: { endpoint: 'orders', operation: 'read' },
          timeout: '10s',
        }
      );
      
      check(ordersRes, {
        'orders: status 200': (r) => r.status === 200,
      });
    });
  } else if (scenario < 0.8) {
    // Write scenario (30%)
    group('Write Operations', function () {
      const productData = {
        sku: `STRESS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `Stress Test Product ${Date.now()}`,
        price: Math.floor(Math.random() * 1000) + 100,
        cost: Math.floor(Math.random() * 500) + 50,
        stock: Math.floor(Math.random() * 1000),
      };
      
      const createRes = http.post(
        `${config.baseUrl}${config.endpoints.products.create}`,
        JSON.stringify(productData),
        { 
          headers, 
          tags: { endpoint: 'products', operation: 'write' },
          timeout: '15s',
        }
      );
      
      const success = check(createRes, {
        'create product: status 201': (r) => r.status === 201,
        'create product: has id': (r) => r.json('id') !== undefined,
      });
      
      if (!success) {
        errorRate.add(1);
        if (createRes.status === 0) timeouts.add(1);
        if (createRes.status >= 500) serverErrors.add(1);
      } else {
        errorRate.add(0);
      }
      
      sleep(1);
    });
  } else {
    // Dashboard scenario (20%)
    group('Dashboard Operations', function () {
      const dashRes = http.get(
        `${config.baseUrl}${config.endpoints.dashboard.overview}`,
        { 
          headers, 
          tags: { endpoint: 'dashboard', operation: 'read' },
          timeout: '10s',
        }
      );
      
      check(dashRes, {
        'dashboard: status 200': (r) => r.status === 200,
      });
      
      sleep(0.5);
      
      const chartsRes = http.get(
        `${config.baseUrl}${config.endpoints.dashboard.charts}`,
        { 
          headers, 
          tags: { endpoint: 'dashboard', operation: 'read' },
          timeout: '10s',
        }
      );
      
      check(chartsRes, {
        'charts: status 200': (r) => r.status === 200,
      });
    });
  }
  
  sleep(randomThinkTime() * 0.5); // Shorter think time for stress
}

export function handleSummary(data) {
  const summary = {
    testType: 'stress',
    timestamp: new Date().toISOString(),
    metrics: {
      totalRequests: data.metrics.http_reqs.values.count,
      failedRequests: data.metrics.http_req_failed.values.rate * 100,
      requestRate: data.metrics.http_reqs.values.rate,
      errorRate: data.metrics.errors ? data.metrics.errors.values.rate * 100 : 0,
      timeouts: data.metrics.timeouts ? data.metrics.timeouts.values.count : 0,
      serverErrors: data.metrics.server_errors ? data.metrics.server_errors.values.count : 0,
      responseTimes: {
        p50: data.metrics.http_req_duration.values['p(50)'],
        p95: data.metrics.http_req_duration.values['p(95)'],
        p99: data.metrics.http_req_duration.values['p(99)'],
        max: data.metrics.http_req_duration.values.max,
      },
    },
    analysis: {
      breakingPoint: determineBreakingPoint(data),
      bottlenecks: identifyBottlenecks(data),
      recommendations: generateRecommendations(data),
    },
  };
  
  return {
    'stress-test-results.json': JSON.stringify(summary, null, 2),
    stdout: formatStressSummary(summary),
  };
}

function determineBreakingPoint(data) {
  // Analyze when error rate exceeded 5% or response time exceeded 2s
  const errorRate = data.metrics.http_req_failed.values.rate;
  const p95 = data.metrics.http_req_duration.values['p(95)'];
  
  if (errorRate > 0.05 || p95 > 2000) {
    return {
      found: true,
      errorRate: (errorRate * 100).toFixed(2) + '%',
      p95ResponseTime: p95.toFixed(2) + 'ms',
      message: 'System reached breaking point',
    };
  }
  
  return {
    found: false,
    message: 'System handled stress well',
  };
}

function identifyBottlenecks(data) {
  const bottlenecks = [];
  
  // Check response times by endpoint
  if (data.metrics['http_req_duration{endpoint:products}']) {
    const productP95 = data.metrics['http_req_duration{endpoint:products}'].values['p(95)'];
    if (productP95 > 500) {
      bottlenecks.push({
        endpoint: 'products',
        p95: productP95,
        issue: 'Slow response time',
      });
    }
  }
  
  return bottlenecks;
}

function generateRecommendations(data) {
  const recommendations = [];
  const errorRate = data.metrics.http_req_failed.values.rate;
  const p95 = data.metrics.http_req_duration.values['p(95)'];
  
  if (errorRate > 0.02) {
    recommendations.push('High error rate detected - check application logs');
    recommendations.push('Consider increasing connection pool size');
  }
  
  if (p95 > 1000) {
    recommendations.push('High response times - optimize database queries');
    recommendations.push('Consider implementing caching');
  }
  
  if (data.metrics.timeouts && data.metrics.timeouts.values.count > 0) {
    recommendations.push('Timeouts detected - increase timeout values or optimize slow endpoints');
  }
  
  return recommendations;
}

function formatStressSummary(summary) {
  let output = '\n';
  output += '╔════════════════════════════════════════╗\n';
  output += '║       STRESS TEST SUMMARY              ║\n';
  output += '╚════════════════════════════════════════╝\n\n';
  
  output += `Total Requests: ${summary.metrics.totalRequests}\n`;
  output += `Failed Requests: ${summary.metrics.failedRequests.toFixed(2)}%\n`;
  output += `Request Rate: ${summary.metrics.requestRate.toFixed(2)} req/s\n`;
  output += `Error Rate: ${summary.metrics.errorRate.toFixed(2)}%\n`;
  output += `Timeouts: ${summary.metrics.timeouts}\n`;
  output += `Server Errors: ${summary.metrics.serverErrors}\n\n`;
  
  output += 'Response Times:\n';
  output += `  p50: ${summary.metrics.responseTimes.p50.toFixed(2)}ms\n`;
  output += `  p95: ${summary.metrics.responseTimes.p95.toFixed(2)}ms\n`;
  output += `  p99: ${summary.metrics.responseTimes.p99.toFixed(2)}ms\n`;
  output += `  max: ${summary.metrics.responseTimes.max.toFixed(2)}ms\n\n`;
  
  output += 'Breaking Point Analysis:\n';
  output += `  ${summary.analysis.breakingPoint.message}\n`;
  if (summary.analysis.breakingPoint.found) {
    output += `  Error Rate: ${summary.analysis.breakingPoint.errorRate}\n`;
    output += `  P95 Response: ${summary.analysis.breakingPoint.p95ResponseTime}\n`;
  }
  output += '\n';
  
  if (summary.analysis.recommendations.length > 0) {
    output += 'Recommendations:\n';
    summary.analysis.recommendations.forEach((rec, i) => {
      output += `  ${i + 1}. ${rec}\n`;
    });
  }
  
  return output;
}
