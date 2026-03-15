import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, _register, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  private readonly httpRequestDuration: Histogram;
  private readonly httpRequestTotal: Counter;
  private readonly dbQueryDuration: Histogram;
  private readonly cacheHitTotal: Counter;
  private readonly cacheMissTotal: Counter;
  private readonly slowQueryTotal: Counter;
  private readonly queryErrorTotal: Counter;
  private readonly gauges: Map<string, Gauge>;

  constructor() {
    this.registry = new Registry();

    // HTTP request duration histogram
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [this.registry],
    });

    // HTTP request counter
    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    // Database query duration
    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
      registers: [this.registry],
    });

    // Cache hit counter
    this.cacheHitTotal = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_key'],
      registers: [this.registry],
    });

    // Cache miss counter
    this.cacheMissTotal = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_key'],
      registers: [this.registry],
    });

    // Slow query counter
    this.slowQueryTotal = new Counter({
      name: 'slow_queries_total',
      help: 'Total number of slow queries',
      labelNames: ['method', 'url'],
      registers: [this.registry],
    });

    // Query error counter
    this.queryErrorTotal = new Counter({
      name: 'query_errors_total',
      help: 'Total number of query errors',
      labelNames: ['method', 'url', 'error_type'],
      registers: [this.registry],
    });

    // Dynamic gauges map
    this.gauges = new Map();
  }

  recordHttpRequest(method: string, route: string, status: number, duration: number): void {
    this.httpRequestDuration.labels(method, route, status.toString()).observe(duration);
    this.httpRequestTotal.labels(method, route, status.toString()).inc();
  }

  recordDbQuery(operation: string, table: string, duration: number): void {
    this.dbQueryDuration.labels(operation, table).observe(duration);
  }

  recordCacheHit(cacheKey: string): void {
    this.cacheHitTotal.labels(cacheKey).inc();
  }

  recordCacheMiss(cacheKey: string): void {
    this.cacheMissTotal.labels(cacheKey).inc();
  }

  recordQueryDuration(method: string, url: string, statusCode: number, duration: number): void {
    // Record as HTTP request
    this.recordHttpRequest(method, url, statusCode, duration / 1000);
  }

  incrementSlowQuery(method: string, url: string): void {
    this.slowQueryTotal.labels(method, url).inc();
  }

  incrementQueryError(method: string, url: string, errorType: string): void {
    this.queryErrorTotal.labels(method, url, errorType).inc();
  }

  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    const labelNames = labels ? Object.keys(labels) : [];
    const gaugeKey = `${name}_${labelNames.join('_')}`;

    if (!this.gauges.has(gaugeKey)) {
      const gauge = new Gauge({
        name,
        help: `Gauge metric for ${name}`,
        labelNames,
        registers: [this.registry],
      });
      this.gauges.set(gaugeKey, gauge);
    }

    const gauge = this.gauges.get(gaugeKey)!;
    if (labels) {
      gauge.set(labels, value);
    } else {
      gauge.set(value);
    }
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getRegistry(): Registry {
    return this.registry;
  }
}
