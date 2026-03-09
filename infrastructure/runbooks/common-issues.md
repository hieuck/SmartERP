# SmartERP Infrastructure Runbooks

Common issues và troubleshooting procedures cho production environment.

---

## 🚨 CRITICAL ISSUES

### 1. Service Down / High Error Rate

**Symptoms:**

- API Gateway returning 5xx errors
- Prometheus alert: `ServiceDown` or `HighErrorRate`
- Users cannot access application

**Immediate Actions:**

```bash
# 1. Check pod status
kubectl get pods -n production

# 2. Check recent events
kubectl get events -n production --sort-by='.lastTimestamp' | tail -20

# 3. Check logs for errors
kubectl logs -n production deployment/api-gateway --tail=100 | grep ERROR

# 4. Check resource usage
kubectl top pods -n production
```

**Common Causes & Fixes:**

**A. Database Connection Issues**

```bash
# Check database connectivity
kubectl exec -n production deployment/api-gateway -- \
  curl -f postgres-primary:5432 || echo "Database unreachable"

# Restart database if needed
kubectl rollout restart deployment/postgres -n production

# Verify database is ready
kubectl wait --for=condition=ready pod -l app=postgres -n production --timeout=5m
```

**B. Memory/CPU Exhaustion**

```bash
# Check resource usage
kubectl top pods -n production

# Scale up if needed
kubectl scale deployment/api-gateway --replicas=5 -n production

# Or increase resource limits
kubectl set resources deployment/api-gateway \
  --limits=cpu=2000m,memory=2Gi \
  --requests=cpu=1000m,memory=1Gi \
  -n production
```

**C. Configuration Issues**

```bash
# Check ConfigMap
kubectl get configmap smarterp-config -n production -o yaml

# Check Secrets
kubectl get secret database-credentials -n production

# Restart pods to reload config
kubectl rollout restart deployment/api-gateway -n production
```

**Rollback Procedure:**

```bash
# If issue started after deployment, rollback immediately
cd .github/workflows
gh workflow run rollback.yml \
  -f environment=production \
  -f rollback_type=switch-version

# Monitor rollback
kubectl get pods -n production -w
```

**Escalation:**

- If not resolved in 15 minutes → Notify Tech Lead
- If not resolved in 30 minutes → Notify CTO
- If data loss risk → Notify all stakeholders immediately

---

### 2. Database Performance Degradation

**Symptoms:**

- Prometheus alert: `HighDatabaseQueryDuration`
- Slow API responses (p95 > 1s)
- High database CPU usage

**Immediate Actions:**

```bash
# 1. Check slow queries
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c \
  "SELECT pid, now() - query_start as duration, query
   FROM pg_stat_activity
   WHERE state = 'active' AND now() - query_start > interval '5 seconds'
   ORDER BY duration DESC LIMIT 10;"

# 2. Check database connections
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c \
  "SELECT count(*) FROM pg_stat_activity;"

# 3. Check table bloat
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c \
  "SELECT schemaname, tablename,
   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
   LIMIT 10;"
```

**Common Fixes:**

**A. Kill Long-Running Queries**

```bash
# Identify problematic query PID from above
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c \
  "SELECT pg_terminate_backend(PID_HERE);"
```

**B. Add Missing Indexes**

```bash
# Check missing indexes
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c \
  "SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE schemaname = 'public' AND n_distinct > 100
   ORDER BY n_distinct DESC LIMIT 20;"

# Create index (example)
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c \
  "CREATE INDEX CONCURRENTLY idx_orders_customer_id ON orders(customer_id);"
```

**C. Vacuum and Analyze**

```bash
# Run VACUUM ANALYZE
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c "VACUUM ANALYZE;"

# Check last vacuum time
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c \
  "SELECT schemaname, tablename, last_vacuum, last_autovacuum, last_analyze
   FROM pg_stat_user_tables
   ORDER BY last_vacuum DESC NULLS LAST;"
```

**D. Scale Database Resources**

```bash
# Increase database resources
kubectl set resources deployment/postgres \
  --limits=cpu=4000m,memory=8Gi \
  --requests=cpu=2000m,memory=4Gi \
  -n production

# Or scale to larger node
kubectl scale deployment/postgres --replicas=0 -n production
# Update deployment with larger instance type
kubectl scale deployment/postgres --replicas=1 -n production
```

---

### 3. High Memory Usage / OOM Kills

**Symptoms:**

- Prometheus alert: `HighMemoryUsage` or `CriticalMemoryUsage`
- Pods restarting frequently
- `OOMKilled` status in pod events

**Immediate Actions:**

```bash
# 1. Check memory usage
kubectl top pods -n production

# 2. Check OOM kills
kubectl get pods -n production -o json | \
  jq '.items[] | select(.status.containerStatuses[].lastState.terminated.reason == "OOMKilled") | .metadata.name'

# 3. Check memory limits
kubectl get pods -n production -o json | \
  jq '.items[] | {name: .metadata.name, limits: .spec.containers[].resources.limits.memory}'
```

**Common Fixes:**

**A. Increase Memory Limits**

```bash
# Increase memory limits
kubectl set resources deployment/api-gateway \
  --limits=memory=4Gi \
  --requests=memory=2Gi \
  -n production
```

**B. Check for Memory Leaks**

```bash
# Get heap snapshot (Node.js)
kubectl exec -n production deployment/api-gateway -- \
  node --expose-gc --inspect=0.0.0.0:9229 &

# Port-forward and connect with Chrome DevTools
kubectl port-forward -n production deployment/api-gateway 9229:9229

# Analyze heap in Chrome DevTools: chrome://inspect
```

**C. Scale Horizontally**

```bash
# Scale out instead of up
kubectl scale deployment/api-gateway --replicas=10 -n production

# Enable HPA (Horizontal Pod Autoscaler)
kubectl autoscale deployment/api-gateway \
  --cpu-percent=70 \
  --min=3 \
  --max=20 \
  -n production
```

---

### 4. Disk Space Full

**Symptoms:**

- Prometheus alert: `HighDiskUsage` or `CriticalDiskUsage`
- Pods cannot write logs
- Database writes failing

**Immediate Actions:**

```bash
# 1. Check disk usage
kubectl exec -n production deployment/api-gateway -- df -h

# 2. Check largest files
kubectl exec -n production deployment/api-gateway -- \
  du -sh /* | sort -rh | head -10

# 3. Check log sizes
kubectl exec -n production deployment/api-gateway -- \
  du -sh /var/log/* | sort -rh | head -10
```

**Common Fixes:**

**A. Clean Up Logs**

```bash
# Truncate large log files
kubectl exec -n production deployment/api-gateway -- \
  sh -c "truncate -s 0 /var/log/application.log"

# Or rotate logs
kubectl exec -n production deployment/api-gateway -- \
  logrotate -f /etc/logrotate.conf
```

**B. Clean Up Docker Images**

```bash
# On each node
ssh node-1
docker system prune -a --volumes -f
```

**C. Increase Disk Size**

```bash
# Resize PVC (if supported by storage class)
kubectl patch pvc postgres-data -n production \
  -p '{"spec":{"resources":{"requests":{"storage":"200Gi"}}}}'

# Or migrate to larger volume
# 1. Create snapshot
# 2. Create new larger PVC from snapshot
# 3. Update deployment to use new PVC
```

---

## ⚠️ WARNING ISSUES

### 5. High API Response Time

**Symptoms:**

- Prometheus alert: `HighAPIResponseTime`
- p95 latency > 1s
- Users reporting slow performance

**Investigation:**

```bash
# 1. Check API metrics
curl http://prometheus:9090/api/v1/query?query=histogram_quantile\(0.95,rate\(http_request_duration_seconds_bucket\[5m\]\)\)

# 2. Check slow endpoints
kubectl logs -n production deployment/api-gateway --tail=1000 | \
  grep "duration" | sort -k5 -rn | head -20

# 3. Check database query performance
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c \
  "SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC LIMIT 10;"
```

**Optimization Steps:**

**A. Enable Caching**

```bash
# Check cache hit rate
curl http://prometheus:9090/api/v1/query?query=cache_hits_total/\(cache_hits_total+cache_misses_total\)

# If low, increase cache TTL or add more cache keys
# Update ConfigMap
kubectl edit configmap smarterp-config -n production
# Increase CACHE_TTL_MEDIUM from 1800 to 3600
```

**B. Add Database Indexes**

```bash
# Identify missing indexes
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c \
  "SELECT schemaname, tablename, attname
   FROM pg_stats
   WHERE schemaname = 'public' AND n_distinct > 100;"

# Create indexes
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c \
  "CREATE INDEX CONCURRENTLY idx_name ON table(column);"
```

**C. Scale Services**

```bash
# Scale API Gateway
kubectl scale deployment/api-gateway --replicas=5 -n production

# Scale backend services
kubectl scale deployment/product-service --replicas=3 -n production
kubectl scale deployment/order-service --replicas=3 -n production
```

---

### 6. Low Cache Hit Rate

**Symptoms:**

- Prometheus alert: `LowCacheHitRate`
- Cache hit rate < 50%
- High database load

**Investigation:**

```bash
# 1. Check cache metrics
curl http://prometheus:9090/api/v1/query?query=cache_hits_total
curl http://prometheus:9090/api/v1/query?query=cache_misses_total

# 2. Check Redis status
kubectl exec -n production deployment/redis -- redis-cli INFO stats

# 3. Check cache keys
kubectl exec -n production deployment/redis -- redis-cli KEYS "*" | head -20
```

**Fixes:**

**A. Increase Cache TTL**

```bash
# Update ConfigMap
kubectl edit configmap smarterp-config -n production

# Increase TTL values:
# CACHE_TTL_SHORT: 300 → 600
# CACHE_TTL_MEDIUM: 1800 → 3600
# CACHE_TTL_LONG: 3600 → 7200

# Restart services to apply
kubectl rollout restart deployment/api-gateway -n production
```

**B. Add More Cache Keys**

```bash
# Review application code to add caching for:
# - Frequently accessed data (products, categories)
# - Expensive queries (reports, aggregations)
# - Static data (settings, configurations)
```

**C. Scale Redis**

```bash
# Increase Redis memory
kubectl set resources deployment/redis \
  --limits=memory=4Gi \
  --requests=memory=2Gi \
  -n production

# Or enable Redis Cluster for horizontal scaling
```

---

## 🔧 MAINTENANCE PROCEDURES

### 7. Planned Deployment

**Pre-Deployment Checklist:**

```bash
# 1. Verify staging deployment successful
curl https://staging.smarterp.com/health

# 2. Check current production status
kubectl get pods -n production
kubectl top pods -n production

# 3. Backup database
kubectl exec -n production deployment/postgres -- \
  pg_dump -U postgres smarterp | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz

# 4. Notify team
curl -X POST $SLACK_WEBHOOK \
  -d '{"text":"🚀 Production deployment starting in 5 minutes"}'
```

**Deployment:**

```bash
# Use GitHub Actions workflow
gh workflow run deploy.yml \
  -f environment=production \
  -f deployment_strategy=blue-green

# Monitor deployment
kubectl get pods -n production -w
```

**Post-Deployment Verification:**

```bash
# 1. Health check
curl https://smarterp.com/health

# 2. Smoke tests
curl https://smarterp.com/api/v1/health

# 3. Check error rate
curl http://prometheus:9090/api/v1/query?query=rate\(http_requests_total{status=~\"5..\"}[5m]\)

# 4. Monitor for 15 minutes
watch -n 10 'kubectl get pods -n production'

# 5. Notify team
curl -X POST $SLACK_WEBHOOK \
  -d '{"text":"✅ Production deployment completed successfully"}'
```

---

### 8. Database Maintenance

**Weekly Maintenance (Sunday 2 AM):**

```bash
# 1. VACUUM ANALYZE
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c "VACUUM ANALYZE;"

# 2. Reindex
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c "REINDEX DATABASE smarterp;"

# 3. Update statistics
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c "ANALYZE;"

# 4. Check bloat
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c \
  "SELECT schemaname, tablename,
   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

**Monthly Maintenance (1st Sunday):**

```bash
# 1. Full backup verification (automated via DR test)
gh workflow run dr-test-automation.yml -f test_type=database-restore

# 2. Review slow queries
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c \
  "SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC LIMIT 20;"

# 3. Optimize tables
kubectl exec -n production deployment/postgres -- \
  psql -U postgres -d smarterp -c "VACUUM FULL ANALYZE;"
```

---

### 9. Certificate Renewal

**Check Certificate Expiry:**

```bash
# Check cert expiry
kubectl get certificate -n production

# Or check via openssl
echo | openssl s_client -servername smarterp.com -connect smarterp.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

**Renew Certificate (cert-manager):**

```bash
# Force renewal
kubectl delete certificaterequest -n production --all

# Verify new cert
kubectl describe certificate smarterp-tls -n production
```

---

## 📞 ESCALATION CONTACTS

| Issue Severity                     | Contact            | Response Time     |
| ---------------------------------- | ------------------ | ----------------- |
| **Critical** (Service Down)        | Tech Lead + DevOps | 15 minutes        |
| **High** (Performance Degradation) | DevOps             | 30 minutes        |
| **Medium** (Warning Alerts)        | DevOps             | 2 hours           |
| **Low** (Maintenance)              | DevOps             | Next business day |

**Contact Methods:**

- Slack: `#smarterp-alerts` (fastest)
- PagerDuty: Critical alerts only
- Email: devops@smarterp.com

---

**Last Updated:** 2026-03-09  
**Maintained By:** DevOps Team  
**Review Frequency:** Monthly
