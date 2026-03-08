---
name: contract-testing-patterns
description: Contract testing với Pact để đảm bảo API compatibility giữa frontend và backend. Catch breaking changes trước khi deploy.
---

# Contract Testing Patterns

## Vấn đề với Integration Testing

**Integration tests KHÔNG catch API contract violations:**

```typescript
// Backend changes response format
// Before
{ "data": { "id": "123", "name": "Product" } }

// After (BREAKING CHANGE)
{ "result": { "id": "123", "name": "Product" } }

// ❌ Backend tests pass (response có data)
// ❌ Frontend tests pass (mocked data đúng format cũ)
// ❌ Production BREAKS (frontend expect "data", backend return "result")
```

**Contract Testing = Verify API contracts between services**

## Setup với Pact

### 1. Cài đặt

```bash
# Frontend (Consumer)
npm install --save-dev @pact-foundation/pact

# Backend (Provider)
npm install --save-dev @pact-foundation/pact
```

### 2. Consumer Tests (Frontend)

```typescript
// src/frontend/tests/pacts/product-api.pact.spec.ts
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { ProductService } from '@/services/product.service';

const { like, eachLike, iso8601DateTime } = MatchersV3;

describe('Product API Contract', () => {
  const provider = new PactV3({
    consumer: 'SmartERP-Frontend',
    provider: 'SmartERP-Backend',
    dir: './pacts',
  });

  describe('GET /api/products', () => {
    it('returns list of products', async () => {
      await provider
        .given('products exist')
        .uponReceiving('a request for products')
        .withRequest({
          method: 'GET',
          path: '/api/products',
          headers: {
            Authorization: like('Bearer token123'),
            'x-tenant-id': like('tenant-1'),
          },
          query: {
            page: '1',
            limit: '20',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: true,
            data: eachLike({
              id: like('prod-123'),
              sku: like('PROD-001'),
              name: like('Product Name'),
              price: like(100000),
              stockQuantity: like(50),
              status: like('ACTIVE'),
              createdAt: iso8601DateTime(),
              updatedAt: iso8601DateTime(),
            }),
            total: like(100),
            page: like(1),
            limit: like(20),
          },
        })
        .executeTest(async (mockServer) => {
          // Use real service with mock server
          const service = new ProductService(mockServer.url);
          const result = await service.getProducts({ page: 1, limit: 20 });

          // Verify response structure
          expect(result.success).toBe(true);
          expect(result.data).toBeInstanceOf(Array);
          expect(result.data[0]).toHaveProperty('id');
          expect(result.data[0]).toHaveProperty('sku');
          expect(result.data[0]).toHaveProperty('name');
          expect(result.total).toBeGreaterThan(0);
        });
    });

    it('returns 404 when product not found', async () => {
      await provider
        .given('product does not exist')
        .uponReceiving('a request for non-existent product')
        .withRequest({
          method: 'GET',
          path: '/api/products/invalid-id',
          headers: {
            Authorization: like('Bearer token123'),
            'x-tenant-id': like('tenant-1'),
          },
        })
        .willRespondWith({
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: false,
            error: like('Product not found'),
            statusCode: 404,
          },
        })
        .executeTest(async (mockServer) => {
          const service = new ProductService(mockServer.url);

          await expect(service.getProduct('invalid-id')).rejects.toThrow('Product not found');
        });
    });

    it('returns 403 when user lacks permission', async () => {
      await provider
        .given('user lacks read permission')
        .uponReceiving('a request without permission')
        .withRequest({
          method: 'GET',
          path: '/api/products',
          headers: {
            Authorization: like('Bearer token123'),
            'x-tenant-id': like('tenant-1'),
          },
        })
        .willRespondWith({
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: false,
            error: like('Permission denied'),
            statusCode: 403,
          },
        })
        .executeTest(async (mockServer) => {
          const service = new ProductService(mockServer.url);

          await expect(service.getProducts()).rejects.toThrow('Permission denied');
        });
    });
  });

  describe('POST /api/products', () => {
    it('creates a new product', async () => {
      await provider
        .given('user has create permission')
        .uponReceiving('a request to create product')
        .withRequest({
          method: 'POST',
          path: '/api/products',
          headers: {
            Authorization: like('Bearer token123'),
            'x-tenant-id': like('tenant-1'),
            'Content-Type': 'application/json',
          },
          body: {
            sku: like('PROD-001'),
            name: like('New Product'),
            price: like(100000),
            stockQuantity: like(50),
          },
        })
        .willRespondWith({
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: true,
            data: {
              id: like('prod-123'),
              sku: like('PROD-001'),
              name: like('New Product'),
              price: like(100000),
              stockQuantity: like(50),
              status: like('ACTIVE'),
              tenantId: like('tenant-1'),
              createdBy: like('user-123'),
              createdAt: iso8601DateTime(),
              updatedAt: iso8601DateTime(),
            },
          },
        })
        .executeTest(async (mockServer) => {
          const service = new ProductService(mockServer.url);
          const result = await service.createProduct({
            sku: 'PROD-001',
            name: 'New Product',
            price: 100000,
            stockQuantity: 50,
          });

          expect(result.success).toBe(true);
          expect(result.data.id).toBeDefined();
          expect(result.data.createdBy).toBeDefined();
        });
    });
  });
});
```

### 3. Provider Tests (Backend)

```typescript
// src/backend/test/pacts/product-api.pact.spec.ts
import { Verifier } from '@pact-foundation/pact';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/app.module';

describe('Product API Provider', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    server = app.getHttpServer().listen(0);
  });

  afterAll(async () => {
    await server.close();
    await app.close();
  });

  it('validates the expectations of SmartERP-Frontend', async () => {
    const port = server.address().port;

    const verifier = new Verifier({
      provider: 'SmartERP-Backend',
      providerBaseUrl: `http://localhost:${port}`,

      // Pact files location
      pactUrls: ['./pacts/smarterp-frontend-smarterp-backend.json'],

      // State handlers
      stateHandlers: {
        'products exist': async () => {
          // Setup: Create test products
          await setupTestProducts();
        },
        'product does not exist': async () => {
          // Setup: Ensure no products
          await clearProducts();
        },
        'user has create permission': async () => {
          // Setup: Create user with permissions
          await setupUserWithPermissions(['product:create']);
        },
        'user lacks read permission': async () => {
          // Setup: Create user without permissions
          await setupUserWithoutPermissions();
        },
      },

      // Request filters (add auth headers)
      requestFilter: (req, res, next) => {
        // Add valid auth token for tests
        req.headers['authorization'] = 'Bearer valid-test-token';
        req.headers['x-tenant-id'] = 'test-tenant';
        next();
      },

      // Publish results to Pact Broker
      publishVerificationResult: process.env.CI === 'true',
      providerVersion: process.env.GIT_COMMIT || 'dev',
    });

    await verifier.verifyProvider();
  });
});

// Helper functions
async function setupTestProducts() {
  // Create test data matching contract expectations
  await productRepository.save([
    {
      id: 'prod-123',
      sku: 'PROD-001',
      name: 'Test Product',
      price: 100000,
      stockQuantity: 50,
      status: 'ACTIVE',
      tenantId: 'test-tenant',
    },
  ]);
}

async function clearProducts() {
  await productRepository.clear();
}

async function setupUserWithPermissions(permissions: string[]) {
  // Mock permission service
  jest.spyOn(permissionService, 'canRead').mockResolvedValue(true);
  jest.spyOn(permissionService, 'canWrite').mockResolvedValue(true);
}

async function setupUserWithoutPermissions() {
  jest.spyOn(permissionService, 'canRead').mockResolvedValue(false);
}
```

### 4. Pact Broker Setup

```yaml
# docker-compose.pact.yml
version: '3.8'

services:
  pact-broker:
    image: pactfoundation/pact-broker:latest
    ports:
      - '9292:9292'
    environment:
      PACT_BROKER_DATABASE_URL: postgresql://pact:pact@postgres:5432/pact_broker
      PACT_BROKER_BASIC_AUTH_USERNAME: pact
      PACT_BROKER_BASIC_AUTH_PASSWORD: pact
      PACT_BROKER_PUBLIC_HEARTBEAT: 'true'
    depends_on:
      - postgres

  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: pact
      POSTGRES_PASSWORD: pact
      POSTGRES_DB: pact_broker
    volumes:
      - pact-postgres-data:/var/lib/postgresql/data

volumes:
  pact-postgres-data:
```

### 5. CI/CD Integration

```yaml
# .github/workflows/contract-testing.yml
name: Contract Testing

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  consumer-tests:
    name: Consumer Contract Tests (Frontend)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci
        working-directory: ./src/frontend

      - name: Run consumer tests
        run: npm run test:pact
        working-directory: ./src/frontend

      - name: Publish pacts to broker
        if: github.ref == 'refs/heads/main'
        env:
          PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
        run: |
          npx pact-broker publish ./pacts \
            --consumer-app-version=${{ github.sha }} \
            --branch=${{ github.ref_name }} \
            --tag=${{ github.ref_name }}

  provider-tests:
    name: Provider Contract Tests (Backend)
    runs-on: ubuntu-latest
    needs: consumer-tests
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci
        working-directory: ./src/backend

      - name: Start test database
        run: docker-compose -f docker-compose.test.yml up -d postgres

      - name: Run provider tests
        env:
          PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
          GIT_COMMIT: ${{ github.sha }}
        run: npm run test:pact:provider
        working-directory: ./src/backend

      - name: Can I deploy?
        env:
          PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
        run: |
          npx pact-broker can-i-deploy \
            --pacticipant=SmartERP-Backend \
            --version=${{ github.sha }} \
            --to-environment=production

  can-i-deploy:
    name: Check Deployment Compatibility
    runs-on: ubuntu-latest
    needs: [consumer-tests, provider-tests]
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Can I deploy frontend?
        env:
          PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
        run: |
          npx pact-broker can-i-deploy \
            --pacticipant=SmartERP-Frontend \
            --version=${{ github.sha }} \
            --to-environment=production

      - name: Can I deploy backend?
        env:
          PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
        run: |
          npx pact-broker can-i-deploy \
            --pacticipant=SmartERP-Backend \
            --version=${{ github.sha }} \
            --to-environment=production

      - name: Record deployment
        if: success()
        env:
          PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
        run: |
          npx pact-broker record-deployment \
            --pacticipant=SmartERP-Frontend \
            --version=${{ github.sha }} \
            --environment=production

          npx pact-broker record-deployment \
            --pacticipant=SmartERP-Backend \
            --version=${{ github.sha }} \
            --environment=production
```

### 6. Package.json Scripts

```json
{
  "scripts": {
    // Frontend
    "test:pact": "jest --testMatch='**/*.pact.spec.ts'",
    "pact:publish": "pact-broker publish ./pacts --consumer-app-version=$npm_package_version",

    // Backend
    "test:pact:provider": "jest --testMatch='**/pacts/*.pact.spec.ts'",
    "pact:can-i-deploy": "pact-broker can-i-deploy --pacticipant=SmartERP-Backend --latest"
  }
}
```

## Advanced Patterns

### 1. Bi-Directional Contract Testing

```typescript
// Test both directions: Frontend → Backend AND Backend → Frontend

// Consumer test (Frontend expects)
it('backend returns product with all fields', async () => {
  await provider.uponReceiving('request for product').willRespondWith({
    body: {
      id: like('123'),
      name: like('Product'),
      price: like(100),
      // Frontend EXPECTS these fields
    },
  });
});

// Provider test (Backend provides)
it('backend provides all required fields', async () => {
  const response = await request(app).get('/api/products/123');

  // Backend MUST provide these fields
  expect(response.body).toHaveProperty('id');
  expect(response.body).toHaveProperty('name');
  expect(response.body).toHaveProperty('price');
});
```

### 2. Versioned Contracts

```typescript
// Support multiple API versions
describe('Product API v1', () => {
  const provider = new PactV3({
    consumer: 'SmartERP-Frontend-v1',
    provider: 'SmartERP-Backend-v1',
  });

  // v1 contract tests
});

describe('Product API v2', () => {
  const provider = new PactV3({
    consumer: 'SmartERP-Frontend-v2',
    provider: 'SmartERP-Backend-v2',
  });

  // v2 contract tests (with breaking changes)
});
```

### 3. Contract Testing for Webhooks

```typescript
// Test webhook contracts
describe('Payment Webhook Contract', () => {
  it('receives payment success webhook', async () => {
    await provider
      .given('payment succeeded')
      .uponReceiving('payment success webhook')
      .withRequest({
        method: 'POST',
        path: '/webhooks/payment',
        body: {
          event: 'payment.succeeded',
          data: {
            transactionId: like('txn-123'),
            amount: like(100000),
            status: 'success',
          },
        },
      })
      .willRespondWith({
        status: 200,
      });
  });
});
```

## Best Practices

### 1. Test Contract, Not Implementation

```typescript
// ✅ Good - Test contract
expect(response.body).toHaveProperty('id');
expect(response.body).toHaveProperty('name');

// ❌ Bad - Test implementation details
expect(response.body.id).toMatch(/^prod-\d+$/);
expect(response.body.name).toBe('Exact Product Name');
```

### 2. Use Matchers

```typescript
// ✅ Use matchers for flexible contracts
body: {
  id: like('prod-123'),           // Any string
  price: like(100),                // Any number
  createdAt: iso8601DateTime(),    // ISO date format
  items: eachLike({ id: like('1') }), // Array of objects
}
```

### 3. Test Error Cases

```typescript
// Test all error scenarios
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 500 Internal Server Error
```

### 4. Version Your Contracts

```typescript
// Tag contracts with versions
npx pact-broker publish ./pacts \
  --consumer-app-version=1.2.3 \
  --tag=v1.2.3 \
  --tag=production
```

## Contract Testing Checklist

- [ ] ✅ Pact configured cho frontend và backend
- [ ] ✅ Pact Broker setup và running
- [ ] ✅ Consumer tests cover all API endpoints
- [ ] ✅ Provider tests verify all contracts
- [ ] ✅ CI/CD runs contract tests
- [ ] ✅ "Can I deploy?" check before deployment
- [ ] ✅ Contracts published to broker
- [ ] ✅ Team reviews contract changes
- [ ] ✅ Breaking changes detected automatically
- [ ] ✅ Webhook contracts tested

## Expected Impact

**Before Contract Testing:**

- API breaking changes found in production: ~40%
- Frontend-backend integration issues: Common
- Deployment confidence: Low

**After Contract Testing:**

- API breaking changes caught in CI: ~95%
- Frontend-backend integration issues: Rare
- Deployment confidence: High

## Summary

Contract Testing = **API compatibility verification**

- ✅ Catch breaking changes before deployment
- ✅ Test API contracts independently
- ✅ Enable independent deployment
- ✅ Reduce integration issues
- ✅ Build deployment confidence

**Goal: 100% contract coverage for all API endpoints**
