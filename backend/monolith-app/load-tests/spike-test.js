// Spike Test - Sudden traffic spike
// Duration: 5 minutes
// Users: Sudden jump from 50 to 500

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { config, getAuthHeaders, randomThinkTime } from './config.js';

// Custom metrics
const errorRate = new Rate('errors');
const recoveryTime = new Trend('recovery_time');

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Normal load
    { duration: '10s', target: 500 },  // Sudden spike!
    { duration: '2m', target: 500 },   // Maintain spike
    { duration: '30s', target: 50 },   // Back to normal
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],  // Relaxed for spike
    http_req_failed: ['rate<0.03'],     // Allow 3% error during spike
    errors: ['rate<0.03'],
  },
  tags: {
    test_type: 'spike',
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
    spikeStartTime: null,
  };
}

export default function (data) {
  const headers = getAuthHeaders(data.token);
  const startTime = Date.now();
  
  // Simulate typical user behavior during spike
  group('Spike Load Scenario', function () {
    // Quick read operations (most common during spikes)
    const productsRes = http.get(
      `${config.baseUrl}${config.endpoints.products.list}?page=1&limit=20`,
      { 
        headers, 
        tags: { endpoint: 'products', phase: 'spike' },
        timeout: '15s',
      }
    );
    
    const success = check(productsRes, {
      'spike: products status 200': (r) => r.status === 200,
      'spike: products response < 1s': (r) => r.timings.duration < 1000,
    });
    
    if (!success) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
      recoveryTime.add(Date.now() - startTime);
    }
    
    sleep(0.5); // Shorter think time during spike
    
    // Dashboard check (common during spikes)
    const dashRes = http.get(
      `${config.baseUrl}${config.endpoints.dashboard.overview}`,
      { 
        headers, 
        tags: { endpoint: 'dashboard', phase: 'spike' },
        timeout: '15s',
      }
    );
    
    check(dashRes, {
      'spike: dashboard status 200': (r) => r.status === 200,
    });
  });
  
  sleep(randomThinkTime() * 0.3); // Very short think time
}

export function handleSummary(data) {
  const summary = {
    testType: 'spike',
    timestamp: new Date().toISOString(),
    metrics: {
      totalRequests: data.metrics.http_reqs.values.count,
      failedRequests: data.metrics.http_req_failed.values.rate * 100,
      requestRate: data.metrics.http_reqs.values.rate,
      errorRate: data.metrics.errors ? data.metrics.errors.values.rate * 100 : 0,
      responseTimes: {
        p50: data.metrics.http_req_duration.values['p(50)'],
        p95: data.metrics.http_req_duration.values['p(95)'],
        p99: data.metrics.http_req_duration.values['p(99)'],
        max: data.metrics.http_req_duration.values.max,
      },
      recoveryTime: data.metrics.recovery_time ? {
        avg: data.metrics.recovery_time.values.avg,
        p95: data.metrics.recovery_time.values['p(95)'],
      } : null,
    },
    analysis: {
      spikeHandling: analyzeSpikeHandling(data),
      autoScaling: checkAutoScaling(data),
      recommendations: generateSpikeRecommendations(data),
    },
  };
  
  return {
    'spike-test-results.json': JSON.stringify(summary, null, 2),
    stdout: formatSpikeSummary(summary),
  };
}

function analyzeSpikeHandling(data) {
  const errorRate = data.metrics.http_req_failed.values.rate;
  const p95 = data.metrics.http_req_duration.values['p(95)'];
  
  let rating = 'excellent';
  let message = 'System handled spike very well';
  
  if (errorRate > 0.03 || p95 > 1000) {
    rating = 'poor';
    message = 'System struggled with spike';
  } else if (errorRate > 0.01 || p95 > 500) {
    rating = 'good';
    message = 'System handled spike adequately';
  }
  
  return {
    rating,
    message,
    errorRate: (errorRate * 100).toFixed(2) + '%',
    p95ResponseTime: p95.toFixed(2) + 'ms',
  };
}

function checkAutoScaling(data) {
  // In a real scenario, you'd check if auto-scaling triggered
  return {
    detected: false,
    message: 'Auto-scaling detection not implemented',
    recommendation: 'Monitor container/pod scaling during spike',
  };
}

function generateSpikeRecommendations(data) {
  const recommendations = [];
  const errorRate = data.metrics.http_req_failed.values.rate;
  const p95 = data.metrics.http_req_duration.values['p(95)'];
  
  if (errorRate > 0.02) {
    recommendations.push('Configure auto-scaling to handle traffic spikes');
    recommendations.push('Implement request queuing for burst traffic');
    recommendations.push('Add rate limiting to protect backend');
  }
  
  if (p95 > 800) {
    recommendations.push('Optimize cache warming for spike scenarios');
    recommendations.push('Pre-scale resources before expected spikes');
  }
  
  recommendations.push('Implement CDN for static assets');
  recommendations.push('Use connection pooling with burst capacity');
  
  return recommendations;
}

function formatSpikeSummary(summary) {
  let output = '\n';
  output += '╔════════════════════════════════════════╗\n';
  output += '║        SPIKE TEST SUMMARY              ║\n';
  output += '╚════════════════════════════════════════╝\n\n';
  
  output += `Total Requests: ${summary.metrics.totalRequests}\n`;
  output += `Failed Requests: ${summary.metrics.failedRequests.toFixed(2)}%\n`;
  output += `Request Rate: ${summary.metrics.requestRate.toFixed(2)} req/s\n`;
  output += `Error Rate: ${summary.metrics.errorRate.toFixed(2)}%\n\n`;
  
  output += 'Response Times:\n';
  output += `  p50: ${summary.metrics.responseTimes.p50.toFixed(2)}ms\n`;
  output += `  p95: ${summary.metrics.responseTimes.p95.toFixed(2)}ms\n`;
  output += `  p99: ${summary.metrics.responseTimes.p99.toFixed(2)}ms\n`;
  output += `  max: ${summary.metrics.responseTimes.max.toFixed(2)}ms\n\n`;
  
  output += 'Spike Handling Analysis:\n';
  output += `  Rating: ${summary.analysis.spikeHandling.rating.toUpperCase()}\n`;
  output += `  ${summary.analysis.spikeHandling.message}\n`;
  output += `  Error Rate: ${summary.analysis.spikeHandling.errorRate}\n`;
  output += `  P95 Response: ${summary.analysis.spikeHandling.p95ResponseTime}\n\n`;
  
  if (summary.analysis.recommendations.length > 0) {
    output += 'Recommendations:\n';
    summary.analysis.recommendations.forEach((rec, i) => {
      output += `  ${i + 1}. ${rec}\n`;
    });
  }
  
  return output;
}
