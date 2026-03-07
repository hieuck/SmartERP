# SmartERP Admin Guide

**Last Updated**: 2026-03-07  
**Version**: 1.0.0

This guide provides administrators with essential information for managing and monitoring SmartERP.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Performance Monitoring](#performance-monitoring)
3. [Security Management](#security-management)
4. [GDPR Compliance](#gdpr-compliance)
5. [User Management](#user-management)
6. [Troubleshooting](#troubleshooting)

---

## System Overview

### Architecture

SmartERP uses a **Modular Monolith** architecture with:
- **Backend**: NestJS with 34+ business modules
- **Database**: PostgreSQL 15 with multi-tenancy (schema-based)
- **Cache**: Redis 7 for performance optimization
- **Storage**: MinIO for object storage

### Key Features

- Multi-tenancy with complete data isolation
- Role-based access control (RBAC)
- GDPR compliance (data export, deletion, consent)
- Performance optimization (caching, indexes, rate limiting)
- Comprehensive monitoring and logging

---

## Performance Monitoring

### Metrics Endpoints

SmartERP provides two metrics endpoints for monitoring:

#### 1. Prometheus Format

```bash
GET /metrics
```

Returns metrics in Prometheus format for integration with monitoring tools:
- Memory usage (heap, RSS, external)
- CPU usage
- Uptime
- Event loop lag
- HTTP request metrics

**Example Integration**:
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'smarterp'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

#### 2. JSON Format

```bash
GET /metrics/app
```

Returns application metrics in JSON format:
```json
{
  "memory": {
    "heapUsed": 45678912,
    "heapTotal": 67108864,
    "rss": 123456789,
    "external": 1234567
  },
  "cpu": {
    "user": 123456,
    "system": 78901
  },
  "uptime": 3600,
  "timestamp": "2026-03-07T10:00:00.000Z"
}
```

### Health Checks

```bash
GET /health
```

Returns system health status:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  },
  "details": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

### Performance Thresholds

Monitor these metrics and alert when thresholds are exceeded:

| Metric | Warning | Critical |
|--------|---------|----------|
| Memory Usage | > 80% | > 90% |
| CPU Usage | > 70% | > 85% |
| API Response Time (p95) | > 200ms | > 500ms |
| Database Connections | > 80% pool | > 95% pool |
| Redis Memory | > 80% | > 90% |

### Logging

SmartERP uses structured logging with the following levels:

- **ERROR**: Critical errors requiring immediate attention
- **WARN**: Warning conditions that should be reviewed
- **INFO**: Informational messages about system operation
- **DEBUG**: Detailed debugging information

**Log Format**:
```json
{
  "level": "info",
  "timestamp": "2026-03-07T10:00:00.000Z",
  "context": "HTTP",
  "message": "GET /api/products 200 45ms",
  "tenantId": "tenant-123",
  "userId": "user-456"
}
```

### Alert Configuration

Configure alerts for critical events:

1. **High Memory Usage**:
   ```typescript
   // Triggered when memory > 90%
   alertService.alertHighMemory(memoryUsage);
   ```

2. **Slow Response**:
   ```typescript
   // Triggered when response time > 500ms
   alertService.alertSlowResponse(endpoint, duration);
   ```

3. **Database Errors**:
   ```typescript
   // Triggered on database connection failures
   alertService.alertDatabaseError(error);
   ```

---

## Security Management

### CSRF Protection

SmartERP implements CSRF protection using Double Submit Cookie pattern:

1. **Frontend**: Request CSRF token
   ```typescript
   GET /csrf-token
   // Returns: { csrfToken: "abc123..." }
   ```

2. **Include in Requests**:
   ```typescript
   headers: {
     'X-CSRF-Token': csrfToken
   }
   ```

3. **Skip for Public Endpoints**:
   - Use `@SkipCsrf()` decorator for public APIs
   - GET/HEAD/OPTIONS requests automatically skip CSRF

### Rate Limiting

Default rate limits:
- **General**: 100 requests per minute per IP/user
- **Login**: 5 attempts per minute per IP
- **API**: Configurable per endpoint

**Custom Rate Limits**:
```typescript
@Throttle({ default: { limit: 10, ttl: 60000 } })
async sensitiveEndpoint() {
  // 10 requests per minute
}
```

### Security Headers

SmartERP uses Helmet.js for security headers:
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- X-XSS-Protection

### Security Audit Checklist

Regular security audits should include:

- [ ] Review user permissions and roles
- [ ] Check for unused accounts
- [ ] Verify CSRF protection is enabled
- [ ] Monitor rate limiting effectiveness
- [ ] Review security logs for suspicious activity
- [ ] Run `npm audit` for dependency vulnerabilities
- [ ] Test authentication and authorization
- [ ] Verify HTTPS is enforced in production

---

## GDPR Compliance

### Admin Responsibilities

As an administrator, you are responsible for:

1. **Reviewing Deletion Requests**:
   - Check pending requests daily
   - Respond within 30 days (GDPR requirement)
   - Verify user identity before approval

2. **Managing Consents**:
   - Ensure consent tracking is working
   - Update consent versions when policies change
   - Monitor consent revocations

3. **Data Export Requests**:
   - Monitor export processing
   - Ensure exports complete within 7 days
   - Verify download links expire properly

### GDPR Endpoints for Admins

```bash
# View pending deletion requests
GET /gdpr/admin/deletion/pending

# View all deletion requests
GET /gdpr/admin/deletion/all

# Approve/reject deletion request
PATCH /gdpr/admin/deletion/:id/approve
{
  "approved": true,
  "rejectionReason": "Optional if rejected"
}
```

### Data Retention Policies

Document and enforce data retention policies:

| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| User Data | Until deletion request | GDPR compliance |
| Audit Logs | 7 years | Legal requirement |
| Financial Records | 7 years | Tax compliance |
| Consent History | Indefinite | Proof of consent |

See [GDPR-COMPLIANCE-GUIDE.md](GDPR-COMPLIANCE-GUIDE.md) for detailed information.

---

## User Management

### User Roles

SmartERP supports role-based access control with these default roles:

| Role | Permissions | Use Case |
|------|-------------|----------|
| **admin** | Full system access | System administrators |
| **manager** | Business operations | Department managers |
| **user** | Basic access | Regular employees |
| **hr_manager** | HR operations | HR department |
| **accountant** | Financial operations | Accounting department |
| **warehouse_manager** | Inventory operations | Warehouse staff |

### Creating Users

```typescript
POST /users
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePassword123!",
  "roles": ["user"],
  "tenantId": "tenant-123"
}
```

### Managing Permissions

Permissions are managed at the role level:

1. **View Roles**: `GET /roles`
2. **Create Role**: `POST /roles`
3. **Assign Permissions**: `PATCH /roles/:id/permissions`
4. **Assign Role to User**: `PATCH /users/:id/roles`

### Multi-Tenancy

Each tenant has complete data isolation:

- **Schema-based**: Each tenant has separate database schema
- **Automatic filtering**: All queries automatically filter by tenantId
- **No cross-tenant access**: Users cannot access other tenants' data

**Creating Tenants**:
```typescript
POST /tenants
{
  "name": "Acme Corp",
  "subdomain": "acme",
  "plan": "enterprise"
}
```

---

## Troubleshooting

### Common Issues

#### 1. High Memory Usage

**Symptoms**: Memory usage > 90%, slow response times

**Solutions**:
- Check for memory leaks in application logs
- Restart application to clear memory
- Increase server memory if consistently high
- Review Redis cache size and eviction policy

#### 2. Slow API Response

**Symptoms**: Response time > 500ms

**Solutions**:
- Check database query performance
- Verify Redis cache is working
- Review database indexes
- Check for N+1 query problems
- Monitor database connection pool

#### 3. Database Connection Errors

**Symptoms**: "Connection pool exhausted" errors

**Solutions**:
- Increase database connection pool size
- Check for long-running queries
- Verify database server is healthy
- Review connection timeout settings

#### 4. Redis Connection Errors

**Symptoms**: Cache misses, "Redis connection failed"

**Solutions**:
- Verify Redis server is running
- Check Redis memory usage
- Review Redis connection settings
- Check network connectivity

#### 5. CSRF Token Errors

**Symptoms**: "Invalid CSRF token" errors

**Solutions**:
- Ensure frontend requests CSRF token
- Verify token is included in request headers
- Check cookie settings (SameSite, Secure)
- For public APIs, use `@SkipCsrf()` decorator

### Diagnostic Commands

```bash
# Check application health
curl http://localhost:3000/health

# View metrics
curl http://localhost:3000/metrics/app

# Check database connections
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis status
redis-cli INFO

# View application logs
docker-compose logs -f backend

# Check memory usage
docker stats
```

### Performance Optimization

If experiencing performance issues:

1. **Enable Query Logging**:
   ```typescript
   // typeorm.config.ts
   logging: true,
   logger: 'advanced-console',
   ```

2. **Check Slow Queries**:
   ```sql
   SELECT query, mean_exec_time
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

3. **Verify Indexes**:
   ```sql
   SELECT schemaname, tablename, indexname
   FROM pg_indexes
   WHERE schemaname = 'tenant_schema';
   ```

4. **Monitor Cache Hit Rate**:
   ```bash
   redis-cli INFO stats | grep keyspace
   ```

---

## Best Practices

### Daily Tasks

- [ ] Review system health dashboard
- [ ] Check error logs for critical issues
- [ ] Monitor performance metrics
- [ ] Review pending GDPR requests

### Weekly Tasks

- [ ] Review security logs
- [ ] Check database performance
- [ ] Verify backup completion
- [ ] Review user access logs
- [ ] Update documentation

### Monthly Tasks

- [ ] Security audit
- [ ] Performance review
- [ ] Capacity planning
- [ ] User access review
- [ ] Dependency updates (`npm audit`)

---

## Support

For additional help:

- **Technical Issues**: Check application logs and metrics
- **Security Concerns**: See [SECURITY.md](../../SECURITY.md)
- **GDPR Questions**: See [GDPR-COMPLIANCE-GUIDE.md](GDPR-COMPLIANCE-GUIDE.md)
- **Performance Issues**: Review monitoring dashboards

---

**Note**: This guide covers common administrative tasks. For detailed technical information, see the developer documentation.
