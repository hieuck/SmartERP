# 📊 Smart ERP - Observability & Monitoring

Complete observability stack for Smart ERP with structured logging, metrics, and alerting.

---

## 🎯 Overview

This monitoring stack provides:
- **Structured Logging** - Winston with daily rotation
- **Metrics Collection** - Prometheus with custom metrics
- **Visualization** - Grafana dashboards
- **Alerting** - Alertmanager with Slack integration
- **System Metrics** - Node Exporter for system monitoring
- **Database Metrics** - PostgreSQL Exporter
- **Cache Metrics** - Redis Exporter

---

## 🚀 Quick Start

### 1. Start Monitoring Stack

```bash
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Access Dashboards

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093

### 3. Configure Alerts

Edit `alertmanager/alertmanager.yml` and add your Slack webhook:

```yaml
global:
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
```

---

## 📊 Metrics

### HTTP Metrics

- `smart_erp_http_request_duration_seconds` - Request duration histogram
- `smart_erp_http_requests_total` - Total HTTP requests counter
- `smart_erp_http_request_errors_total` - Total HTTP errors counter

**Labels:** method, route, status_code

### Database Metrics

- `smart_erp_db_query_duration_seconds` - Query duration histogram
- `smart_erp_db_connections_active` - Active connections gauge
- `smart_erp_db_query_errors_total` - Query errors counter

**Labels:** operation, table

### Business Metrics

- `smart_erp_orders_created_total` - Orders created counter
- `smart_erp_orders_completed_total` - Orders completed counter
- `smart_erp_revenue_total` - Total revenue counter
- `smart_erp_products_created_total` - Products created counter
- `smart_erp_customers_created_total` - Customers created counter

**Labels:** tenant_id

### System Metrics

- `smart_erp_active_users` - Active users gauge
- `smart_erp_active_tenants` - Active tenants gauge
- `smart_erp_process_cpu_seconds_total` - CPU usage
- `smart_erp_process_resident_memory_bytes` - Memory usage
- `smart_erp_nodejs_eventloop_lag_seconds` - Event loop lag

---

## 📈 Grafana Dashboards

### 1. System Overview
- CPU and memory usage
- HTTP request rate
- Error rate
- Database connections
- Event loop lag

### 2. API Performance
- Request duration percentiles (p50, p95, p99)
- Requests by status code
- Error rate by endpoint
- Slowest endpoints
- Most requested endpoints

### 3. Business Metrics
- Orders created/completed
- Revenue tracking
- Products and customers created
- Active users by tenant
- Completion rate

---

## 🚨 Alerts

### API Alerts

1. **HighErrorRate** (Critical)
   - Trigger: Error rate > 5% for 5 minutes
   - Action: Investigate error logs, check recent deployments

2. **SlowResponseTime** (Warning)
   - Trigger: p95 response time > 0.5s for 5 minutes
   - Action: Check slow query logs, review recent changes

3. **VerySlowResponseTime** (Critical)
   - Trigger: p95 response time > 2s for 5 minutes
   - Action: Immediate investigation, consider rollback

4. **HighRequestRate** (Warning)
   - Trigger: Request rate > 1000 req/s for 5 minutes
   - Action: Monitor system resources, prepare to scale

5. **APIDown** (Critical)
   - Trigger: API unreachable for 1 minute
   - Action: Check application logs, restart if needed

### System Alerts

1. **HighCPUUsage** (Warning)
   - Trigger: CPU > 80% for 5 minutes
   - Action: Identify CPU-intensive operations

2. **VeryHighCPUUsage** (Critical)
   - Trigger: CPU > 95% for 5 minutes
   - Action: Scale horizontally or optimize code

3. **HighMemoryUsage** (Warning)
   - Trigger: Memory > 1GB for 5 minutes
   - Action: Check for memory leaks

4. **VeryHighMemoryUsage** (Critical)
   - Trigger: Memory > 2GB for 5 minutes
   - Action: Restart application, investigate memory leak

5. **HighEventLoopLag** (Warning)
   - Trigger: Event loop lag > 0.1s for 5 minutes
   - Action: Identify blocking operations

6. **DatabaseConnectionPoolExhausted** (Critical)
   - Trigger: Active connections > 95 for 1 minute
   - Action: Increase pool size or fix connection leaks

---

## 📝 Logging

### Log Levels

- **ERROR** - Critical errors requiring immediate attention
- **WARN** - Warning messages for potential issues
- **INFO** - General informational messages
- **DEBUG** - Detailed debugging information
- **VERBOSE** - Very detailed logging

### Log Files

Logs are stored in `logs/` directory with daily rotation:

- `error-YYYY-MM-DD.log` - Error logs only
- `combined-YYYY-MM-DD.log` - All logs
- `exceptions-YYYY-MM-DD.log` - Uncaught exceptions
- `rejections-YYYY-MM-DD.log` - Unhandled promise rejections

**Retention:** 14 days

### Log Format

```json
{
  "level": "info",
  "message": "HTTP Request",
  "timestamp": "2026-02-28 10:30:45",
  "context": "HTTP",
  "method": "GET",
  "url": "/api/products",
  "statusCode": 200,
  "responseTime": 45,
  "userId": "uuid",
  "tenantId": "uuid",
  "correlationId": "uuid"
}
```

### Correlation IDs

Every request gets a unique correlation ID for tracing:
- Auto-generated if not provided
- Propagated in `X-Correlation-ID` header
- Included in all logs for that request
- Enables end-to-end request tracing

---

## 🔧 Configuration

### Environment Variables

```bash
# Logging
LOG_LEVEL=info                    # error, warn, info, debug, verbose

# Metrics
METRICS_ENABLED=true              # Enable/disable metrics collection

# Alerting
SLACK_WEBHOOK_URL=https://...     # Slack webhook for alerts
PAGERDUTY_SERVICE_KEY=...         # PagerDuty service key (optional)
```

### Prometheus Scraping

Metrics are exposed at `/api/metrics` endpoint:

```yaml
scrape_configs:
  - job_name: 'smart-erp-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 10s
```

---

## 📊 Usage Examples

### Recording Business Events

```typescript
import { MetricsService } from './common/metrics/metrics.service';

@Injectable()
export class OrderService {
  constructor(private readonly metrics: MetricsService) {}

  async create(dto: CreateOrderDto, tenantId: string) {
    const order = await this.orderRepository.save(dto);
    
    // Record metrics
    this.metrics.recordOrderCreated(tenantId);
    this.metrics.recordRevenue(tenantId, order.total);
    
    return order;
  }
}
```

### Logging with Context

```typescript
import { LoggerService } from './common/logger/logger.service';

@Injectable()
export class ProductService {
  private logger = new LoggerService('ProductService');

  async create(dto: CreateProductDto, tenantId: string, userId: string) {
    this.logger.log('Creating product', {
      tenantId,
      userId,
      sku: dto.sku,
    });
    
    const product = await this.productRepository.save(dto);
    
    this.logger.logBusinessEvent('product.created', {
      productId: product.id,
      name: product.name,
    }, userId, tenantId);
    
    return product;
  }
}
```

---

## 🎯 Best Practices

### Logging

1. **Use appropriate log levels**
   - ERROR: Errors requiring immediate attention
   - WARN: Potential issues
   - INFO: Important business events
   - DEBUG: Detailed debugging info

2. **Include context**
   - Always include tenantId and userId
   - Add correlation IDs for tracing
   - Include relevant business data

3. **Avoid sensitive data**
   - Never log passwords
   - Mask credit card numbers
   - Sanitize PII

### Metrics

1. **Use labels wisely**
   - Keep cardinality low (<100 unique values)
   - Use tenant_id for multi-tenant metrics
   - Avoid user_id as label (too high cardinality)

2. **Choose right metric type**
   - Counter: Monotonically increasing (orders, revenue)
   - Gauge: Can go up/down (active users, connections)
   - Histogram: Distribution (response times, query duration)

3. **Record business metrics**
   - Track key business events
   - Monitor conversion rates
   - Measure user engagement

### Alerting

1. **Set meaningful thresholds**
   - Based on historical data
   - Account for normal variations
   - Avoid alert fatigue

2. **Provide actionable information**
   - Clear alert descriptions
   - Include runbook links
   - Suggest remediation steps

3. **Test alerts regularly**
   - Verify alert delivery
   - Practice incident response
   - Update runbooks

---

## 🔍 Troubleshooting

### High Memory Usage

1. Check for memory leaks:
```bash
# Get heap snapshot
curl http://localhost:3000/api/health/heap-snapshot > heap.heapsnapshot
```

2. Analyze with Chrome DevTools
3. Look for retained objects
4. Fix memory leaks in code

### Slow Queries

1. Check slow query logs:
```bash
tail -f logs/combined-*.log | grep "duration"
```

2. Identify slow queries
3. Add database indexes
4. Optimize query logic

### High Error Rate

1. Check error logs:
```bash
tail -f logs/error-*.log
```

2. Group errors by type
3. Identify root cause
4. Deploy fix

---

## 📚 Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 🎓 Training

### For Developers

1. Review logging best practices
2. Learn to use LoggerService
3. Understand metric types
4. Practice recording business events

### For Operations

1. Access Grafana dashboards
2. Understand alert rules
3. Practice incident response
4. Review runbooks

### For Management

1. Review business metrics dashboard
2. Understand key metrics
3. Set business goals
4. Monitor progress

---

**Last Updated:** 2026-02-28  
**Version:** 1.0.0  
**Status:** Production Ready

