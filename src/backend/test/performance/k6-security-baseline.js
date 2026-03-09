import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for security testing
const securityCheckDuration = new Trend('security_check_duration');
const securityCheckFailRate = new Rate('security_check_failures');
const tenantIsolationViolations = new Rate('tenant_isolation_violations');
const permissionDenials = new Rate('permission_denials');

export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '3m', target: 50 }, // Stay at 50 users
    { duration: '1m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests < 200ms
    security_check_duration: ['p(95)<50'], // Security checks < 50ms
    security_check_failures: ['rate<0.01'], // < 1% failures
    tenant_isolation_violations: ['rate==0'], // 0 violations
    permission_denials: ['rate<0.05'], // < 5% denials (expected for unauthorized tests)
  },
};

const BASE_URL = __ENV.API_URL || 'http://api-gateway-test:3000';
const TEST_TOKEN = __ENV.TEST_TOKEN || 'test-jwt-token';
const TEST_TENANT_ID = __ENV.TEST_TENANT_ID || 'tenant-1';

export default function () {
  // Test 1: Tenant-isolated query
  testTenantIsolation();

  // Test 2: Permission check
  testPermissionDenial();

  sleep(1);
}

function testTenantIsolation() {
  const startTime = Date.now();

  const res = http.get(`${BASE_URL}/api/products`, {
    headers: {
      Authorization: `Bearer ${TEST_TOKEN}`,
      'X-Tenant-ID': TEST_TENANT_ID,
    },
  });

  const duration = Date.now() - startTime;
  securityCheckDuration.add(duration);

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'has tenant isolation': (r) => {
      try {
        const data = JSON.parse(r.body);
        if (!Array.isArray(data)) return true; // Empty or error response
        return data.every((item) => item.tenantId === TEST_TENANT_ID);
      } catch (e) {
        return false;
      }
    },
  });

  if (!success) {
    securityCheckFailRate.add(1);

    // Check for tenant isolation violation
    try {
      const data = JSON.parse(res.body);
      if (Array.isArray(data) && data.some((item) => item.tenantId !== TEST_TENANT_ID)) {
        tenantIsolationViolations.add(1);
      }
    } catch (e) {
      // Ignore parse errors
    }
  } else {
    securityCheckFailRate.add(0);
  }
}

function testPermissionDenial() {
  const startTime = Date.now();

  // Test with invalid/missing token (should be denied)
  const res = http.post(
    `${BASE_URL}/api/products`,
    JSON.stringify({
      name: 'Test Product',
      price: 100,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TEST_TENANT_ID,
        // No Authorization header - should be denied
      },
    },
  );

  const duration = Date.now() - startTime;
  securityCheckDuration.add(duration);

  const isDenied = check(res, {
    'unauthorized request denied': (r) => r.status === 401 || r.status === 403,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  if (isDenied) {
    permissionDenials.add(1); // Expected denial
  } else {
    securityCheckFailRate.add(1); // Should have been denied!
  }
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'performance-report.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n';
  summary += `${indent}✅ Security Performance Baseline Test\n`;
  summary += `${indent}${'='.repeat(50)}\n\n`;

  // Metrics
  const metrics = data.metrics;

  summary += `${indent}📊 Performance Metrics:\n`;
  summary += `${indent}  - HTTP Request Duration (p95): ${metrics.http_req_duration?.values?.['p(95)']?.toFixed(2)}ms\n`;
  summary += `${indent}  - Security Check Duration (p95): ${metrics.security_check_duration?.values?.['p(95)']?.toFixed(2)}ms\n`;
  summary += `${indent}  - Total Requests: ${metrics.http_reqs?.values?.count || 0}\n\n`;

  summary += `${indent}🔒 Security Metrics:\n`;
  summary += `${indent}  - Security Check Failures: ${(metrics.security_check_failures?.values?.rate * 100 || 0).toFixed(2)}%\n`;
  summary += `${indent}  - Tenant Isolation Violations: ${(metrics.tenant_isolation_violations?.values?.rate * 100 || 0).toFixed(2)}%\n`;
  summary += `${indent}  - Permission Denials: ${(metrics.permission_denials?.values?.rate * 100 || 0).toFixed(2)}%\n\n`;

  // Thresholds
  summary += `${indent}✅ Threshold Results:\n`;
  const thresholds = data.root_group?.checks || [];
  thresholds.forEach((check) => {
    const status = check.passes === check.fails ? '❌' : '✅';
    summary += `${indent}  ${status} ${check.name}: ${check.passes}/${check.passes + check.fails}\n`;
  });

  return summary;
}
