# Deployment Checklist

**Version:** 1.0  
**Last Updated:** 2026-03-09  
**Owner:** DevOps Engineer

---

## 📋 Pre-Deployment Checklist

### 0. CI/CD Pipeline

- [ ] CI pipeline passed (all tests, linting, type-check)
- [ ] Coverage ≥80% (backend and frontend)
- [ ] Security audit passed (no high/critical vulnerabilities)
- [ ] Build artifacts generated successfully
- [ ] Docker images built and pushed to registry

### 1. Configuration Validation

- [ ] All environment variables set
- [ ] Configuration validation passes (`npm run config:validate`)
- [ ] No missing environment variables (`npm run config:check-env`)
- [ ] Secrets are strong (48+ characters)
- [ ] No default/test secrets in production
- [ ] CORS origin is specific (not "\*")
- [ ] SSL/TLS enabled for database
- [ ] SSL/TLS enabled for Redis

### 2. Security Checks

- [ ] Rate limiting enabled
- [ ] CSRF protection enabled
- [ ] 2FA enabled
- [ ] Email verification enabled
- [ ] Audit logging enabled
- [ ] Helmet.js security headers configured
- [ ] Password hashing rounds >= 10
- [ ] JWT expiration <= 15 minutes (production)
- [ ] Refresh token expiration <= 7 days

### 3. Database

- [ ] Database migrations up to date
- [ ] Database backup completed
- [ ] Database connection pool configured
- [ ] Database SSL enabled
- [ ] Database credentials rotated (if needed)
- [ ] Database performance tuned

### 4. Monitoring & Logging

- [ ] Sentry configured and tested
- [ ] Prometheus metrics enabled
- [ ] Grafana dashboards created
- [ ] Alert rules configured
- [ ] Log aggregation configured
- [ ] Error tracking tested

### 5. Testing

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Security tests pass
- [ ] Performance tests pass
- [ ] Smoke tests prepared

### 6. Infrastructure

- [ ] Kubernetes cluster ready
- [ ] Namespaces created
- [ ] Secrets configured
- [ ] ConfigMaps updated
- [ ] Ingress configured
- [ ] Load balancer configured
- [ ] Auto-scaling configured
- [ ] Resource limits set

### 7. Backup & Recovery

- [ ] Backup automation configured
- [ ] Backup tested and verified
- [ ] Disaster recovery plan documented
- [ ] Rollback procedure tested
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined

### 8. Documentation

- [ ] Deployment guide updated
- [ ] Configuration guide updated
- [ ] Runbooks updated
- [ ] API documentation updated
- [ ] CHANGELOG updated
- [ ] ROADMAP updated

---

## 🚀 Deployment Steps

### Automated Deployment (Recommended)

#### Staging Deployment

**Trigger:** Push to `develop` branch

```bash
# 1. Merge feature to develop
git checkout develop
git merge feature/your-feature
git push origin develop

# 2. GitHub Actions automatically:
#    - Runs CI pipeline (quality gates)
#    - Builds Docker images
#    - Deploys to staging
#    - Runs health checks
#    - Notifies team

# 3. Monitor deployment
# Go to: https://github.com/your-org/smart-erp/actions
# Watch "Deploy to Staging" workflow

# 4. Verify deployment
curl https://api-staging.smarterp.com/api/health
```

**Time:** ~5-7 minutes

#### Production Deployment

**Trigger:** Manual approval required

```bash
# 1. Ensure staging is stable (24+ hours)

# 2. Via GitHub UI:
# Go to: https://github.com/your-org/smart-erp/actions
# Select "Deploy to Production"
# Click "Run workflow"
# Type "deploy" to confirm
# Click "Run workflow"

# 3. Monitor deployment
# Watch workflow progress
# Pipeline will:
#    - Verify quality gates
#    - Check staging health
#    - Build Docker images
#    - Create backup
#    - Deploy to production
#    - Run smoke tests
#    - Monitor for 5 minutes
#    - Create GitHub release

# 4. Verify deployment
curl https://api.smarterp.com/api/health
```

**Time:** ~10-15 minutes

### Manual Deployment (Fallback)

#### Staging Deployment

#### 1. Pre-Deployment

```bash
# Validate configuration
cd src/backend
npm run config:validate

# Check environment variables
npm run config:check-env

# Run tests
npm run test
npm run test:e2e
```

#### 2. Deploy

```bash
# Build Docker image
docker build -t smarterp-backend:staging .

# Push to registry
docker push ghcr.io/smarterp/backend:staging

# Deploy to Kubernetes
kubectl apply -f kubernetes/staging/

# Wait for rollout
kubectl rollout status deployment/smarterp-backend -n staging
```

#### 3. Post-Deployment

```bash
# Check pods
kubectl get pods -n staging

# Check logs
kubectl logs -f deployment/smarterp-backend -n staging

# Run smoke tests
npm run test:smoke -- --env=staging

# Monitor metrics
# Check Grafana dashboard for 15 minutes
```

#### 4. Validation

- [ ] Application starts successfully
- [ ] Health check passes
- [ ] Database connection works
- [ ] Redis connection works
- [ ] API endpoints respond
- [ ] Authentication works
- [ ] No errors in logs
- [ ] Metrics are being collected

### Production Deployment

#### 1. Pre-Deployment (24 hours before)

```bash
# Ensure staging is stable
# Staging should be running without issues for 24+ hours

# Create deployment PR
git checkout -b deploy/production-v1.2.3

# Update version
npm version patch  # or minor, major

# Update CHANGELOG
# Add release notes

# Commit and push
git add .
git commit -m "chore: prepare production deployment v1.2.3"
git push origin deploy/production-v1.2.3

# Request approvals
# Tech Lead + PM approval required
```

#### 2. Deployment Day

**Morning (09:00 AM):**

```bash
# Final validation
npm run config:validate
npm run config:check-env
npm run test
npm run test:e2e

# Backup database
./scripts/backup-database.sh production

# Verify backup
./scripts/verify-backup.sh
```

**Deployment Window (10:00 AM - 12:00 PM):**

```bash
# 1. Build and push image
docker build -t smarterp-backend:v1.2.3 .
docker push ghcr.io/smarterp/backend:v1.2.3

# 2. Update Kubernetes manifests
# Update image tag to v1.2.3

# 3. Deploy to production
kubectl apply -f kubernetes/production/

# 4. Monitor rollout
kubectl rollout status deployment/smarterp-backend -n production

# 5. Check pods
kubectl get pods -n production

# 6. Check logs (watch for errors)
kubectl logs -f deployment/smarterp-backend -n production
```

**Post-Deployment (12:00 PM - 01:00 PM):**

```bash
# Run smoke tests
npm run test:smoke -- --env=production

# Monitor metrics
# Watch Grafana dashboards for 1 hour
# Check:
# - Error rate
# - Response time
# - CPU usage
# - Memory usage
# - Database connections
# - Redis connections

# Verify functionality
# Test critical user flows:
# - Login
# - Create order
# - Process payment
# - Generate report
```

#### 3. Post-Deployment Monitoring

**First Hour:**

- [ ] No errors in logs
- [ ] Error rate < 0.1%
- [ ] Response time < 500ms (p95)
- [ ] CPU usage < 70%
- [ ] Memory usage < 80%
- [ ] All health checks passing

**First Day:**

- [ ] Monitor metrics every 2 hours
- [ ] Check error logs every 4 hours
- [ ] Review user feedback
- [ ] Monitor support tickets

**First Week:**

- [ ] Daily metrics review
- [ ] Weekly performance report
- [ ] User satisfaction survey

#### 4. Rollback (if needed)

```bash
# If deployment fails, rollback immediately

# Option 1: Helm rollback
helm rollback smarterp -n production

# Option 2: Kubectl rollback
kubectl rollout undo deployment/smarterp-backend -n production

# Verify rollback
kubectl get pods -n production
kubectl logs -f deployment/smarterp-backend -n production

# Notify team
# Post incident report in #smarterp-alerts

# Schedule post-mortem
# Analyze what went wrong
# Document lessons learned
```

---

## 🚨 Emergency Procedures

### Critical Issue Detected

1. **Assess severity**
   - Critical: Immediate rollback
   - High: Fix forward if possible
   - Medium: Monitor and fix in next release

2. **Notify stakeholders**
   - Tech Lead
   - PM
   - QA
   - Affected users

3. **Take action**
   - Rollback if critical
   - Apply hotfix if possible
   - Scale resources if performance issue

4. **Document incident**
   - What happened
   - When it happened
   - Impact
   - Resolution
   - Lessons learned

### Rollback Decision Matrix

| Severity | Error Rate | Response Time | Action              |
| -------- | ---------- | ------------- | ------------------- |
| Critical | >5%        | >5s           | Immediate rollback  |
| High     | 1-5%       | 2-5s          | Rollback or hotfix  |
| Medium   | 0.5-1%     | 1-2s          | Monitor and fix     |
| Low      | <0.5%      | <1s           | Fix in next release |

---

## 📊 Success Metrics

### Deployment Success Criteria

- ✅ Zero downtime deployment
- ✅ Error rate < 0.1%
- ✅ Response time < 500ms (p95)
- ✅ All smoke tests pass
- ✅ No critical bugs reported
- ✅ User satisfaction maintained

### Performance Benchmarks

| Metric               | Target    | Alert Threshold |
| -------------------- | --------- | --------------- |
| Error Rate           | <0.1%     | >0.5%           |
| Response Time (p95)  | <500ms    | >1s             |
| CPU Usage            | <70%      | >85%            |
| Memory Usage         | <80%      | >90%            |
| Database Connections | <80% pool | >95% pool       |
| Uptime               | >99.9%    | <99.5%          |

---

## 📚 Related Documents

- **CI/CD Pipeline Guide:** `docs/CI_CD_GUIDE.md`
- **Deployment Guide:** `docs/deployment/DEPLOYMENT_GUIDE.md`
- **Config Management:** `docs/deployment/config-management.md`
- **Security Guidelines:** `TECH-LEAD-FINAL-DECISION-2026-03-09-SECURITY-FIRST.md`
- **Infrastructure Requirements:** `DEVOPS-INFRASTRUCTURE-REQUIREMENTS-2026-03-09.md`
- **Disaster Recovery:** `infrastructure/disaster-recovery/runbook.md`

---

**Created:** 2026-03-09  
**Created By:** DevOps Engineer  
**Status:** ✅ Active  
**Next Review:** After each deployment
