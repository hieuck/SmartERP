---
name: chaos-engineering-patterns
description: Chaos engineering patterns for building resilient systems with circuit breakers, retry logic, timeout handling, and graceful degradation. Use when implementing fault tolerance and system resilience.
---

# Chaos Engineering Patterns

## Vấn đề với Distributed Systems

**Distributed systems WILL fail:**

```typescript
// ❌ Naive approach - No resilience
async function getProductPrice(productId: string): Promise<number> {
  const response = await fetch(`https://pricing-service/api/prices/${productId}`);
  return response.json();

  // What if:
  // - Network timeout?
  // - Service down?
  // - Slow response (30s)?
  // - Partial failure?
  // → Entire system breaks!
}
```

**Chaos Engineering = Design for failure**

## Core Resilience Patterns

### 1. Circuit Breaker Pattern

**Prevent cascading failures by stopping requests to failing services:**

```typescript
// src/backend/common/resilience/circuit-breaker.ts
import { Injectable, Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Open after N failures
  successThreshold: number; // Close after N successes in half-open
  timeout: number; // Time in OPEN before trying HALF_OPEN (ms)
  monitoringPeriod: number; // Rolling window for failure count (ms)
}

@Injectable()
export class CircuitBreaker {
  private readonly logger = new Logger(CircuitBreaker.name);
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private nextAttemptTime?: number;

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime!) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
      // Try half-open
      this.state = CircuitState.HALF_OPEN;
      this.logger.log(`Circuit breaker ${this.name} entering HALF_OPEN state`);
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        this.logger.log(`Circuit breaker ${this.name} closed after recovery`);
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.open();
      return;
    }

    if (this.failureCount >= this.config.failureThreshold) {
      this.open();
    }
  }

  private open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.config.timeout;
    this.logger.warn(`Circuit breaker ${this.name} opened after ${this.failureCount} failures`);
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.logger.log(`Circuit breaker ${this.name} manually reset`);
  }
}
```

**Usage:**

```typescript
// src/backend/domains/inventory/services/pricing.service.ts
import { Injectable } from '@nestjs/common';
import { CircuitBreaker } from '@/common/resilience/circuit-breaker';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PricingService {
  private readonly circuitBreaker: CircuitBreaker;

  constructor(private readonly httpService: HttpService) {
    this.circuitBreaker = new CircuitBreaker('pricing-service', {
      failureThreshold: 5, // Open after 5 failures
      successThreshold: 2, // Close after 2 successes
      timeout: 60000, // Wait 60s before retry
      monitoringPeriod: 120000, // 2 minute window
    });
  }

  async getPrice(productId: string): Promise<number> {
    try {
      return await this.circuitBreaker.execute(async () => {
        const response = await firstValueFrom(this.httpService.get(`/api/prices/${productId}`));
        return response.data.price;
      });
    } catch (error) {
      // Circuit is open, use fallback
      return this.getFallbackPrice(productId);
    }
  }

  private async getFallbackPrice(productId: string): Promise<number> {
    // Return cached price or default
    const cached = await this.cacheService.get(`price:${productId}`);
    return cached ?? 0;
  }
}
```

### 2. Retry Pattern with Exponential Backoff

**Automatically retry failed operations with increasing delays:**

```typescript
// src/backend/common/resilience/retry.ts
import { Logger } from '@nestjs/common';

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number; // 2 = exponential
  retryableErrors?: string[]; // Only retry these errors
}

export class RetryPolicy {
  private readonly logger = new Logger(RetryPolicy.name);

  constructor(private readonly config: RetryConfig) {}

  async execute<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    let lastError: Error;
    let delay = this.config.initialDelay;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (this.config.retryableErrors && !this.isRetryable(error)) {
          throw error;
        }

        if (attempt === this.config.maxAttempts) {
          this.logger.error(
            `${operationName} failed after ${attempt} attempts: ${lastError.message}`,
          );
          throw lastError;
        }

        this.logger.warn(
          `${operationName} attempt ${attempt} failed, retrying in ${delay}ms: ${lastError.message}`,
        );

        await this.sleep(delay);

        // Exponential backoff with jitter
        delay = Math.min(
          delay * this.config.backoffMultiplier + this.jitter(delay),
          this.config.maxDelay,
        );
      }
    }

    throw lastError!;
  }

  private isRetryable(error: any): boolean {
    const errorName = error.constructor.name;
    return this.config.retryableErrors!.includes(errorName);
  }

  private jitter(delay: number): number {
    // Add random jitter (±25%)
    return delay * (Math.random() * 0.5 - 0.25);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

**Usage:**

```typescript
@Injectable()
export class OrderService {
  private readonly retryPolicy: RetryPolicy;

  constructor() {
    this.retryPolicy = new RetryPolicy({
      maxAttempts: 3,
      initialDelay: 1000, // Start with 1s
      maxDelay: 10000, // Max 10s
      backoffMultiplier: 2, // 1s → 2s → 4s
      retryableErrors: ['TimeoutError', 'NetworkError'],
    });
  }

  async createOrder(data: CreateOrderDto): Promise<Order> {
    return this.retryPolicy.execute(async () => {
      // This will retry on timeout/network errors
      return await this.orderRepository.save(data);
    }, 'createOrder');
  }
}
```

### 3. Timeout Pattern

**Prevent operations from hanging indefinitely:**

```typescript
// src/backend/common/resilience/timeout.ts
export class TimeoutError extends Error {
  constructor(operation: string, timeout: number) {
    super(`Operation '${operation}' timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  operationName: string,
): Promise<T> {
  return Promise.race([
    operation,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new TimeoutError(operationName, timeoutMs)), timeoutMs),
    ),
  ]);
}
```

**Usage:**

```typescript
@Injectable()
export class ExternalApiService {
  async fetchData(url: string): Promise<any> {
    const operation = fetch(url).then((r) => r.json());

    // Timeout after 5 seconds
    return withTimeout(operation, 5000, `fetchData(${url})`);
  }
}
```

### 4. Bulkhead Pattern

**Isolate resources to prevent total system failure:**

```typescript
// src/backend/common/resilience/bulkhead.ts
import { Injectable, Logger } from '@nestjs/common';

export class BulkheadRejectedError extends Error {
  constructor(bulkheadName: string) {
    super(`Bulkhead '${bulkheadName}' is full, request rejected`);
    this.name = 'BulkheadRejectedError';
  }
}

@Injectable()
export class Bulkhead {
  private readonly logger = new Logger(Bulkhead.name);
  private activeRequests = 0;
  private queuedRequests: Array<() => void> = [];

  constructor(
    private readonly name: string,
    private readonly maxConcurrent: number,
    private readonly maxQueue: number,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if we can execute immediately
    if (this.activeRequests < this.maxConcurrent) {
      return this.executeOperation(operation);
    }

    // Check if queue is full
    if (this.queuedRequests.length >= this.maxQueue) {
      throw new BulkheadRejectedError(this.name);
    }

    // Queue the request
    return new Promise<T>((resolve, reject) => {
      this.queuedRequests.push(async () => {
        try {
          const result = await this.executeOperation(operation);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async executeOperation<T>(operation: () => Promise<T>): Promise<T> {
    this.activeRequests++;
    this.logger.debug(`Bulkhead ${this.name}: ${this.activeRequests}/${this.maxConcurrent} active`);

    try {
      return await operation();
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.queuedRequests.length > 0 && this.activeRequests < this.maxConcurrent) {
      const next = this.queuedRequests.shift();
      if (next) next();
    }
  }

  getStats() {
    return {
      active: this.activeRequests,
      queued: this.queuedRequests.length,
      capacity: this.maxConcurrent,
    };
  }
}
```

**Usage:**

```typescript
@Injectable()
export class ReportService {
  private readonly bulkhead: Bulkhead;

  constructor() {
    // Limit concurrent report generation
    this.bulkhead = new Bulkhead('report-generation', 5, 10);
  }

  async generateReport(params: ReportParams): Promise<Report> {
    return this.bulkhead.execute(async () => {
      // Heavy operation limited to 5 concurrent
      return await this.heavyReportGeneration(params);
    });
  }
}
```

### 5. Graceful Degradation

**Provide reduced functionality when dependencies fail:**

```typescript
// src/backend/domains/inventory/services/product.service.ts
@Injectable()
export class ProductService {
  async getProductDetails(productId: string): Promise<ProductDetails> {
    const product = await this.productRepo.findOne({ where: { id: productId } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Try to enrich with external data, but degrade gracefully
    const details: ProductDetails = {
      ...product,
      price: await this.getPriceWithFallback(productId),
      stock: await this.getStockWithFallback(productId),
      reviews: await this.getReviewsWithFallback(productId),
    };

    return details;
  }

  private async getPriceWithFallback(productId: string): Promise<number> {
    try {
      return await withTimeout(this.pricingService.getPrice(productId), 2000, 'getPrice');
    } catch (error) {
      this.logger.warn(`Price service unavailable, using cached price`);
      return this.getCachedPrice(productId) ?? 0;
    }
  }

  private async getStockWithFallback(productId: string): Promise<number> {
    try {
      return await this.inventoryService.getStock(productId);
    } catch (error) {
      this.logger.warn(`Inventory service unavailable, showing as out of stock`);
      return 0; // Safe default
    }
  }

  private async getReviewsWithFallback(productId: string): Promise<Review[]> {
    try {
      return await this.reviewService.getReviews(productId);
    } catch (error) {
      this.logger.warn(`Review service unavailable, hiding reviews`);
      return []; // Degrade gracefully
    }
  }
}
```

## Combining Patterns

**Real-world example combining multiple patterns:**

```typescript
// src/backend/common/resilience/resilient-http.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CircuitBreaker } from './circuit-breaker';
import { RetryPolicy } from './retry';
import { withTimeout } from './timeout';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ResilientHttpService {
  private readonly logger = new Logger(ResilientHttpService.name);
  private readonly circuitBreakers = new Map<string, CircuitBreaker>();
  private readonly retryPolicy: RetryPolicy;

  constructor(private readonly httpService: HttpService) {
    this.retryPolicy = new RetryPolicy({
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      backoffMultiplier: 2,
    });
  }

  async get<T>(url: string, options?: { timeout?: number }): Promise<T> {
    const serviceName = new URL(url).hostname;
    const circuitBreaker = this.getOrCreateCircuitBreaker(serviceName);

    return this.retryPolicy.execute(async () => {
      return circuitBreaker.execute(async () => {
        const operation = firstValueFrom(this.httpService.get<T>(url));
        return withTimeout(operation, options?.timeout ?? 5000, `GET ${url}`);
      });
    }, `HTTP GET ${url}`);
  }

  private getOrCreateCircuitBreaker(serviceName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(
        serviceName,
        new CircuitBreaker(serviceName, {
          failureThreshold: 5,
          successThreshold: 2,
          timeout: 60000,
          monitoringPeriod: 120000,
        }),
      );
    }
    return this.circuitBreakers.get(serviceName)!;
  }
}
```

## Testing Resilience

### 1. Unit Tests

```typescript
describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      monitoringPeriod: 5000,
    });
  });

  it('should open after threshold failures', async () => {
    const failingOp = jest.fn().mockRejectedValue(new Error('Failed'));

    // Fail 3 times
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failingOp)).rejects.toThrow();
    }

    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
  });

  it('should reject requests when open', async () => {
    // Open the circuit
    const failingOp = jest.fn().mockRejectedValue(new Error('Failed'));
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failingOp)).rejects.toThrow();
    }

    // Should reject without calling operation
    await expect(circuitBreaker.execute(failingOp)).rejects.toThrow('Circuit breaker test is OPEN');
    expect(failingOp).toHaveBeenCalledTimes(3); // Not called again
  });

  it('should transition to half-open after timeout', async () => {
    jest.useFakeTimers();

    // Open the circuit
    const failingOp = jest.fn().mockRejectedValue(new Error('Failed'));
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failingOp)).rejects.toThrow();
    }

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    // Should try half-open
    const successOp = jest.fn().mockResolvedValue('success');
    await circuitBreaker.execute(successOp);

    expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);

    jest.useRealTimers();
  });
});
```

### 2. Integration Tests with Chaos

```typescript
describe('ProductService Resilience', () => {
  let service: ProductService;
  let pricingService: jest.Mocked<PricingService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PricingService,
          useValue: {
            getPrice: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ProductService);
    pricingService = module.get(PricingService);
  });

  it('should handle pricing service timeout gracefully', async () => {
    // Simulate slow response
    pricingService.getPrice.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(100), 10000)),
    );

    const result = await service.getProductDetails('prod-1');

    // Should use fallback price
    expect(result.price).toBe(0); // Default fallback
  });

  it('should handle pricing service failure gracefully', async () => {
    pricingService.getPrice.mockRejectedValue(new Error('Service down'));

    const result = await service.getProductDetails('prod-1');

    // Should still return product with fallback
    expect(result).toBeDefined();
    expect(result.price).toBe(0);
  });
});
```

## Monitoring & Observability

```typescript
// src/backend/common/resilience/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { PrometheusService } from '@/common/monitoring/prometheus.service';

@Injectable()
export class ResilienceMetricsService {
  constructor(private readonly prometheus: PrometheusService) {}

  recordCircuitBreakerState(name: string, state: CircuitState): void {
    this.prometheus.gauge('circuit_breaker_state', {
      name,
      state,
    });
  }

  recordRetryAttempt(operation: string, attempt: number, success: boolean): void {
    this.prometheus.counter('retry_attempts_total', {
      operation,
      attempt: attempt.toString(),
      success: success.toString(),
    });
  }

  recordTimeout(operation: string): void {
    this.prometheus.counter('timeouts_total', {
      operation,
    });
  }

  recordBulkheadRejection(name: string): void {
    this.prometheus.counter('bulkhead_rejections_total', {
      name,
    });
  }
}
```

## Best Practices

### 1. Set Appropriate Timeouts

```typescript
// ✅ Different timeouts for different operations
const TIMEOUTS = {
  DATABASE_QUERY: 5000, // 5s for DB
  EXTERNAL_API: 10000, // 10s for external APIs
  REPORT_GENERATION: 60000, // 60s for heavy operations
  HEALTH_CHECK: 2000, // 2s for health checks
};
```

### 2. Use Fallbacks Wisely

```typescript
// ✅ Safe fallbacks
- Cached data (with staleness indicator)
- Default values (0, empty array)
- Degraded functionality (hide feature)

// ❌ Dangerous fallbacks
- Random/fake data
- Stale data without indication
- Silent failures
```

### 3. Monitor Everything

```typescript
// Track:
- Circuit breaker state changes
- Retry attempts and success rates
- Timeout occurrences
- Bulkhead rejections
- Fallback usage
```

### 4. Test Failure Scenarios

```typescript
// Test:
- Service timeouts
- Service unavailability
- Slow responses
- Partial failures
- Network issues
```

## Chaos Engineering Checklist

- [ ] ✅ Circuit breakers on external dependencies
- [ ] ✅ Retry logic with exponential backoff
- [ ] ✅ Timeouts on all network calls
- [ ] ✅ Bulkheads for resource-intensive operations
- [ ] ✅ Graceful degradation with fallbacks
- [ ] ✅ Monitoring and alerting
- [ ] ✅ Chaos testing in staging
- [ ] ✅ Runbooks for failure scenarios

## Expected Impact

**Before Resilience Patterns:**

- Service outages cascade to entire system
- No graceful degradation
- Poor user experience during failures

**After Resilience Patterns:**

- Isolated failures don't cascade
- System degrades gracefully
- Better user experience during issues

## Summary

Chaos Engineering = **Design for failure**

- ✅ Circuit breakers prevent cascading failures
- ✅ Retries handle transient errors
- ✅ Timeouts prevent hanging operations
- ✅ Bulkheads isolate resources
- ✅ Graceful degradation maintains functionality

**Goal: System remains functional even when dependencies fail**
