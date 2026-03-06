# 🚀 Quick Start - Observability Stack

Get Smart ERP monitoring up and running in 5 minutes!

---

## Prerequisites

- Docker and Docker Compose installed
- Smart ERP application running on port 3000
- Ports available: 3001, 9090, 9093, 9100, 9187, 9121

---

## Step 1: Start Monitoring Stack (1 minute)

```bash
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

This starts 6 containers:
- Prometheus (metrics collection)
- Grafana (visualization)
- Alertmanager (alerting)
- Node Exporter (system metrics)
- Postgres Exporter (database metrics)
- Redis Exporter (cache metrics)

---

## Step 2: Verify Services (1 minute)

Check all services are running:

```bash
docker-compose -f docker-compose.monitoring.yml ps
```

All services should show "Up" status.

---

## Step 3: Access Dashboards (1 minute)

Open in your browser:

### Grafana (Main Dashboard)
- URL: http://localhost:3001
- Username: `admin`
- Password: `admin`
- Change password on first login (or skip)

### Prometheus (Metrics Explorer)
- URL: http://localhost:9090
- No authentication required

### Alertmanager (Alert Manager)
- URL: http://localhost:9093
- No authentication required

---

## Step 4: View Metrics (1 minute)

### In Grafana:

1. Click "Dashboards" in left menu
2. Open "Smart ERP" folder
3. Choose a dashboard:
   - **System Overview** - CPU, memory, requests
   - **API Performance** - Response times, errors
   - **Business Metrics** - Orders, revenue, users

### In Prometheus:

1. Go to http://localhost:9090
2. Click "Graph" tab
3. Try these queries:
   ```
   smart_erp_http_requests_total
   smart_erp_orders_created_total
   rate(smart_erp_http_request_duration_seconds_sum[5m])
   ```

---

## Step 5: Test Metrics Collection (1 minute)

### Generate some traffic:

```bash
# Make some API requests
curl http://localhost:3000/api/health
curl http://localhost:3000/api/products
curl http://localhost:3000/api/customers
```

### View metrics:

```bash
# View raw metrics
curl http://localhost:3000/api/metrics

# Or open in browser
open http://localhost:3000/api/metrics
```

You should see metrics like:
```
smart_erp_http_requests_total{method="GET",route="/api/health",status_code="200"} 1
smart_erp_http_request_duration_seconds_sum{method="GET",route="/api/health"} 0.045
```

---

## 🎉 You're Done!

Your observability stack is now running!

### What's Working:

✅ **Logging** - Structured logs in `logs/` directory  
✅ **Metrics** - Prometheus collecting metrics every 10s  
✅ **Dashboards** - Grafana showing real-time data  
✅ **Alerts** - Alertmanager ready to send notifications  
✅ **Exporters** - System, DB, and cache metrics  

---

## 📊 Next Steps

### 1. Configure Slack Alerts (5 minutes)

Edit `alertmanager/alertmanager.yml`:

```yaml
global:
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
```

Restart Alertmanager:
```bash
docker-compose -f docker-compose.monitoring.yml restart alertmanager
```

### 2. Customize Dashboards (10 minutes)

In Grafana:
1. Open a dashboard
2. Click "Dashboard settings" (gear icon)
3. Click "JSON Model"
4. Edit and save
5. Or create new panels with "Add panel"

### 3. Add More Metrics (15 minutes)

In your code:

```typescript
import { MetricsService } from './common/metrics/metrics.service';

@Injectable()
export class YourService {
  constructor(private metrics: MetricsService) {}

  async yourMethod() {
    // Record business event
    this.metrics.recordOrderCreated(tenantId);
    this.metrics.recordRevenue(tenantId, amount);
  }
}
```

### 4. Test Alerts (5 minutes)

Trigger an alert:

```bash
# Generate high load (triggers HighRequestRate alert)
for i in {1..1000}; do
  curl http://localhost:3000/api/health &
done
```

Check Alertmanager:
- Go to http://localhost:9093
- You should see "HighRequestRate" alert firing

---

## 🔧 Troubleshooting

### Services not starting?

```bash
# Check logs
docker-compose -f docker-compose.monitoring.yml logs

# Check specific service
docker-compose -f docker-compose.monitoring.yml logs grafana
```

### Grafana not showing data?

1. Check Prometheus is running: http://localhost:9090
2. Check data source in Grafana:
   - Settings → Data Sources → Prometheus
   - Click "Test" button
   - Should show "Data source is working"

### Metrics not appearing?

1. Check application is running: http://localhost:3000/api/health
2. Check metrics endpoint: http://localhost:3000/api/metrics
3. Check Prometheus targets: http://localhost:9090/targets
   - Should show "smart-erp-backend" as UP

### Alerts not firing?

1. Check alert rules: http://localhost:9090/alerts
2. Check Alertmanager: http://localhost:9093
3. Verify Slack webhook URL in `alertmanager/alertmanager.yml`

---

## 📝 Common Commands

### Start monitoring stack
```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### Stop monitoring stack
```bash
docker-compose -f docker-compose.monitoring.yml down
```

### View logs
```bash
docker-compose -f docker-compose.monitoring.yml logs -f
```

### Restart a service
```bash
docker-compose -f docker-compose.monitoring.yml restart grafana
```

### Remove all data (fresh start)
```bash
docker-compose -f docker-compose.monitoring.yml down -v
```

---

## 🎯 Success Checklist

- [ ] All 6 containers running
- [ ] Grafana accessible at http://localhost:3001
- [ ] Prometheus accessible at http://localhost:9090
- [ ] Metrics endpoint working: http://localhost:3000/api/metrics
- [ ] Dashboards showing data in Grafana
- [ ] Logs being written to `logs/` directory
- [ ] Alerts configured (optional)
- [ ] Team trained on dashboards (optional)

---

## 📚 Learn More

- [Full Monitoring Documentation](./README.md)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Alert Rules Reference](./prometheus/alerts/)

---

**Time to complete:** 5 minutes  
**Difficulty:** Easy  
**Status:** Production Ready ✅

