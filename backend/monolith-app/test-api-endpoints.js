const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test results
const results = {
  passed: [],
  failed: [],
  total: 0
};

async function testEndpoint(name, method, url, data = null, expectedStatus = 200) {
  results.total++;
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      validateStatus: () => true, // Don't throw on any status
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      results.passed.push({ name, status: response.status, message: 'OK' });
      console.log(`✅ ${name}: ${response.status}`);
      return { success: true, data: response.data };
    } else {
      results.failed.push({ 
        name, 
        expected: expectedStatus, 
        actual: response.status,
        message: response.data?.message || 'Unexpected status'
      });
      console.log(`❌ ${name}: Expected ${expectedStatus}, got ${response.status}`);
      return { success: false, status: response.status, data: response.data };
    }
  } catch (error) {
    results.failed.push({ name, error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Starting API Endpoint Tests...\n');
  
  // 1. Health Check
  console.log('📊 Testing Health Endpoints:');
  await testEndpoint('Health Check', 'GET', '/health', null, 200);
  await testEndpoint('Metrics', 'GET', '/metrics', null, 200);
  console.log('');
  
  // 2. Public Endpoints (should work without auth)
  console.log('🌐 Testing Public Endpoints:');
  await testEndpoint('Tenant Pricing', 'GET', '/tenants/subscription/pricing', null, 200);
  console.log('');
  
  // 3. Protected Endpoints (should return 401 without auth)
  console.log('🔒 Testing Protected Endpoints (expect 401):');
  await testEndpoint('Get Products', 'GET', '/products', null, 401);
  await testEndpoint('Get Customers', 'GET', '/customers', null, 401);
  await testEndpoint('Get Orders', 'GET', '/orders', null, 401);
  await testEndpoint('Get Users', 'GET', '/users', null, 401);
  await testEndpoint('Get Inventory', 'GET', '/inventory', null, 401);
  console.log('');
  
  // 4. Auth Endpoints
  console.log('🔐 Testing Auth Endpoints:');
  
  // Register should fail with validation errors (no data)
  await testEndpoint('Register (no data)', 'POST', '/auth/register', {}, 400);
  
  // Login should fail with validation errors (no data)
  await testEndpoint('Login (no data)', 'POST', '/auth/login', {}, 400);
  
  console.log('');
  
  // 5. Invalid Endpoints
  console.log('❓ Testing Invalid Endpoints (expect 404):');
  await testEndpoint('Invalid Endpoint', 'GET', '/invalid-endpoint', null, 404);
  console.log('');
  
  // Summary
  console.log('═'.repeat(60));
  console.log('📈 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`Success Rate: ${((results.passed.length / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(fail => {
      console.log(`  - ${fail.name}`);
      if (fail.expected) {
        console.log(`    Expected: ${fail.expected}, Got: ${fail.actual}`);
      }
      if (fail.error) {
        console.log(`    Error: ${fail.error}`);
      }
      if (fail.message) {
        console.log(`    Message: ${fail.message}`);
      }
    });
  }
  
  console.log('\n✅ API endpoint tests completed!');
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
