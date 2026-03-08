# SmartERP Monitoring Stack

Complete monitoring solution for SmartERP production environment using Prometheus, Grafana, and Alertmanager.

## 📊 Overview

This monitoring stack provides:
- **Metrics Collection**: Prometheus scrapes metrics from SmartERP backend
- **Visualization**: Grafana dashboards for real-time monitoring
- **Alerting**: Alertmanager routes alerts to email, Slack, PagerDuty
- **Health Checks**: Kubernetes-ready health endpoints
- **Exporters**: PostgreSQL, Redis, Node metrics

## 🚀 Quick Start

### 1. Start Monitoring Stack

```bash
cd config/monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Access Dashboards

- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093

### 3. Configure Alerts

Edit `alertmanager.yml` to configure:
- Email SMTP settings
- Slack webhook URL
- PagerDuty service key

```yaml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@smarterp.com'
  smtp_auth_username: 'alerts@smarterp.com'
  smtp_auth_password: 'your-app-password'
```

## 📈 Available Metrics

### HTTP Metrics
- `http_request_duration_seconds` - Request duration histogram
- `http_requests_total` - Total request counter
- Labels: `method`, `route`, `status`

### Database Metrics
- `db_query_duration_seconds` - Query duration histogram
- `slow_queries_total` - Slow query counter (>1s)
- `query_errors_total` - Query error counter
- Labels: `operation`, `table`, `method`, `url`, `error_type`

### Cache Metrics
- `cache_hits_total` - Cache hit counter
- `cache_misses_total` - Cache miss counter
- Labels: `cache_key`

### System Metrics (via Node Exporter)
- `node_memory_*` - Memory usage
- `node_cpu_*` - CPU usage
- `node_filesystem_*` - Disk usage
- `node_network_*` - Network I/O

## 🚨 Alert Rules

### Critical Alerts (Immediate Action)
- **ServiceDown**: Backend service not responding (1min)
- **DatabaseDown**: PostgreSQL not responding (1min)
- **RedisDown**: Redis not responding (1min)
- **VeryHighAPIResponseTime**: p95 > 3s (2min)
- **HighErrorRate**: Error rate > 5% (5min)
- **CriticalMemoryUsage**: Memory > 95% (2min)
- **CriticalCPUUsage**: CPU > 95% (2min)
- **CriticalDiskUsage**: Disk > 95% (2min)

### Warning Alerts (Monitor)
- **HighAPIResponseTime**: p95 > 1s (5min)
- **HighSlowQueryRate**: >10 slow queries/min (5min)
- **HighDatabaseQueryDuration**: p95 > 500ms (5min)
- **LowCacheHitRate**: Hit rate < 50% (10min)
- **HighMemoryUsage**: Memory > 85% (5min)
- **HighCPUUsage**: CPU > 80% (5min)
- **HighDiskUsage**: Disk > 85% (5min)

## 📊 Grafana Dashboards

### SmartERP Production Dashboard

10 panels covering:
1. **API Response Time (p95)** - Track API performance
2. **Request Rate** - Monitor traffic
3. **Error Rate** - Track failures
4. **Database Query Duration (p95)** - DB performance
5. **Cache Hit Rate** - Cache efficiency
6. **Memory Usage** - System memory
7. **CPU Usage** - System CPU
8. **Disk Usage** - Storage capacity
9. **Slow Queries** - Performance issues
10. **Query Errors** - Database errors

### Importing Dashboards

1. Open Grafana (http://localhost:3001)
2. Login (admin/admin123)
3. Go to Dashboards → Import
4. Upload `grafana-dashboard.json`

## 🔧 Configuration

### Prometheus Scrape Targets

Edit `prometheus.yml` to add/modify scrape targets:

```yaml
scrape_configs:
  - job_name: 'smarterp-backend'
    metrics_path: '/api/metrics'
    static_configs:
      - targets:
          - 'backend:3000'  # Change to your backend URL
```

### Alert Routing

Edit `alertmanager.yml` to configure alert routing:

```yaml
route:
  receiver: 'team-email'
  routes:
    - match:
        severity: critical
      receiver: 'team-pagerduty'
```

### Alert Receivers

Configure receivers in `alertmanager.yml`:

```yaml
receivers:
  - name: 'team-email'
    email_configs:
      - to: 'team@smarterp.com'
  
  - name: 'team-slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#smarterp-alerts'
```

## 🏥 Health Checks

SmartERP provides 3 health check endpoints:

### 1. Comprehensive Health Check
```bash
curl http://localhost:3000/api/health
```

Checks:
- Database connectivity
- Redis connectivity
- Memory usage (heap < 300MB, RSS < 500MB)

Response:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" }
  }
}
```

### 2. Readiness Probe (Kubernetes)
```bash
curl http://localhost:3000/api/health/ready
```

Checks if service can accept traffic (database initialized).

### 3. Liveness Probe (Kubernetes)
```bash
curl http://localhost:3000/api/health/live
```

Checks if service is alive (returns uptime, memory stats).

## 🐳 Docker Compose Services

### Prometheus
- Port: 9090
- Config: `prometheus.yml`, `alerts.yml`
- Data: `prometheus-data` volume

### Grafana
- Port: 3001
- Credentials: admin/admin123
- Data: `grafana-data` volume

### Alertmanager
- Port: 9093
- Config: `alertmanager.yml`
- Data: `alertmanager-data` volume

### PostgreSQL Exporter
- Port: 9187
- Metrics: PostgreSQL database stats

### Redis Exporter
- Port: 9121
- Metrics: Redis cache stats

### Node Exporter
- Port: 9100
- Metrics: System resources (CPU, memory, disk, network)

## 🔍 Troubleshooting

### Prometheus Not Scraping Metrics

1. Check backend is running:
```bash
curl http://localhost:3000/api/metrics
```

2. Check Prometheus targets:
- Open http://localhost:9090/targets
- Verify all targets are "UP"

3. Check network connectivity:
```bash
docker-compose -f docker-compose.monitoring.yml logs prometheus
```

### Alerts Not Firing

1. Check alert rules:
- Open http://localhost:9090/alerts
- Verify rules are loaded

2. Check Alertmanager:
- Open http://localhost:9093
- Check alert status

3. Check Alertmanager logs:
```bash
docker-compose -f docker-compose.monitoring.yml logs alertmanager
```

### Grafana Dashboard Not Loading

1. Check Prometheus data source:
- Grafana → Configuration → Data Sources
- Add Prometheus: http://prometheus:9090

2. Re-import dashboard:
- Upload `grafana-dashboard.json`

### High Memory/CPU Usage

1. Check metrics:
```bash
curl http://localhost:3000/api/health/live
```

2. Check container stats:
```bash
docker stats
```

3. Scale resources if needed:
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2'
```

## 📚 Best Practices

### 1. Alert Fatigue Prevention
- Set appropriate thresholds
- Use `for` duration to avoid flapping
- Group related alerts
- Use inhibition rules

### 2. Dashboard Organization
- Create separate dashboards per team
- Use variables for filtering
- Set appropriate refresh intervals
- Add annotations for deployments

### 3. Metric Naming
- Follow Prometheus naming conventions
- Use consistent label names
- Document custom metrics
- Avoid high cardinality labels

### 4. Data Retention
- Configure retention in Prometheus:
```yaml
command:
  - '--storage.tsdb.retention.time=30d'
  - '--storage.tsdb.retention.size=50GB'
```

### 5. Security
- Enable authentication in Grafana
- Restrict Prometheus/Alertmanager access
- Use HTTPS in production
- Rotate credentials regularly

## 🚀 Production Deployment

### 1. Update Configuration

Replace localhost with production URLs:

**prometheus.yml**:
```yaml
scrape_configs:
  - job_name: 'smarterp-backend'
    static_configs:
      - targets:
          - 'production-backend.example.com:3000'
```

**alertmanager.yml**:
```yaml
global:
  smtp_smarthost: 'smtp.production.com:587'
  smtp_from: 'alerts@production.com'
```

### 2. Configure Secrets

Use environment variables or secrets management:

```bash
# .env file
SMTP_PASSWORD=your-smtp-password
PAGERDUTY_KEY=your-pagerduty-key
SLACK_WEBHOOK=your-slack-webhook
```

### 3. Enable HTTPS

Add reverse proxy (nginx/traefik) with SSL:

```nginx
server {
  listen 443 ssl;
  server_name grafana.example.com;
  
  ssl_certificate /etc/ssl/certs/cert.pem;
  ssl_certificate_key /etc/ssl/private/key.pem;
  
  location / {
    proxy_pass http://grafana:3000;
  }
}
```

### 4. Set Up Backups

Backup Grafana dashboards and Prometheus data:

```bash
# Backup Grafana
docker exec smarterp-grafana grafana-cli admin export-dashboard > backup.json

# Backup Prometheus data
docker run --rm -v prometheus-data:/data -v $(pwd):/backup alpine tar czf /backup/prometheus-backup.tar.gz /data
```

### 5. Configure Log Aggregation

Integrate with ELK/CloudWatch for centralized logging:

```yaml
# docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 📞 Support

For issues or questions:
- Check logs: `docker-compose -f docker-compose.monitoring.yml logs`
- Review metrics: http://localhost:9090
- Check health: http://localhost:3000/api/health
- Contact DevOps team: devops@smarterp.com

## 📖 References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Node Exporter](https://github.com/prometheus/node_exporter)
- [PostgreSQL Exporter](https://github.com/prometheus-community/postgres_exporter)
- [Redis Exporter](https://github.com/oliver006/redis_exporter)

---

**Version**: 1.0.0  
**Last Updated**: 2026-03-08  
**Maintained by**: DevOps Team
