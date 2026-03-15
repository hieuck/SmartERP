# Deployment Guide

## Overview

This guide covers deployment procedures for Smart-ERP using automated CI/CD pipelines and manual deployment options.

## Deployment Environments

### 1. Development (Local)
- **Purpose**: Local development and testing
- **Access**: Developers only
- **Database**: Local PostgreSQL
- **URL**: http://localhost:3000 (frontend), http://localhost:3001 (backend)

### 2. Staging
- **Purpose**: Pre-production testing and QA
- **Access**: Development team, QA team
- **Database**: Staging PostgreSQL (isolated)
- **URL**: https://staging.smarterp.com
- **API**: https://api-staging.smarterp.com
- **Auto-deploy**: On push to `develop` branch

### 3. Production
- **Purpose**: Live application for end users
- **Access**: All users
- **Database**: Production PostgreSQL (replicated)
- **URL**: https://app.smarterp.com
- **API**: https://api.smarterp.com
- **Deploy**: Manual approval required

## Automated Deployment (Recommended)

### Staging Deployment

**Trigger**: Push to `develop` branch

```bash
# 1. Merge feature to develop
git checkout develop
git merge feature/your-feature
git push origin develop

# 2. GitHub Actions automatically:
#    - Runs CI pipeline
#    - Builds Docker images
#    - Deploys to staging
#    - Runs health checks
#    - Notifies team

# 3. Verify deployment
curl https://api-staging.smarterp.com/api/health
```

**Pipeline Steps:**
1. Quality gates (CI must pass)
2. Build & push Docker images
3. Deploy to staging environment
4. Health checks (API, Frontend, DB, Redis)
5. Notification

**Time**: ~5-7 minutes

### Production Deployment

**Trigger**: Manual approval required

```bash
# Option 1: Via GitHub UI
# 1. Go to: https://github.com/your-org/smart-erp/actions
# 2. Select "Deploy to Production"
# 3. Click "Run workflow"
# 4. Select branch: main
# 5. Type "deploy" in confirmation field
# 6. Click "Run workflow"

# Option 2: Push to main (after PR approval)
git checkout main
git merge develop
git push origin main
# Then follow Option 1 for manual confirmation
```

**Pipeline Steps:**
1. Quality gates (CI + Staging must pass)
2. Manual confirmation required
3. Build & push Docker images
4. Create backup (database, files, config)
5. Deploy to production
6. Smoke tests (all endpoints)
7. Monitor for 5 minutes
8. Create GitHub release
9. Notification

**Time**: ~10-15 minutes

## Manual Deployment (Fallback)

### Prerequisites

```bash
# 1. Install Docker and Docker Compose
docker --version
docker-compose --version

# 2. Clone repository
git clone https://github.com/your-org/smart-erp.git
cd smart-erp

# 3. Configure environment
cp .env.example .env
# Edit .env with production values
```

### Backend Deployment

```bash
cd src/backend

# 1. Install dependencies
npm ci

# 2. Build
npm run build

# 3. Run database migrations
npm run migration:run

# 4. Start application
npm run start:prod

# Or with Docker:
docker build -t smart-erp-backend .
docker run -d \
  --name backend \
  -p 3001:3001 \
  --env-file .env \
  smart-erp-backend
```

### Frontend Deployment

```bash
cd src/frontend

# 1. Install dependencies
npm ci

# 2. Build
npm run build

# 3. Serve with nginx
# Copy dist/ to nginx web root
cp -r dist/* /var/www/html/

# Or with Docker:
docker build -t smart-erp-frontend .
docker run -d \
  --name frontend \
  -p 3000:80 \
  smart-erp-frontend
```

### Docker Compose Deployment

```bash
# 1. Build images
docker-compose build

# 2. Start services
docker-compose up -d

# 3. Check status
docker-compose ps

# 4. View logs
docker-compose logs -f

# 5. Stop services
docker-compose down
```

## Database Migrations

### Running Migrations

```bash
cd src/backend

# 1. Generate migration (if needed)
npm run migration:generate -- -n MigrationName

# 2. Review migration file
# Check: database/migrations/timestamp-MigrationName.ts

# 3. Run migration
npm run migration:run

# 4. Verify migration
# Check database schema
```

### Rollback Migration

```bash
# Revert last migration
npm run migration:revert

# Revert multiple migrations
npm run migration:revert
npm run migration:revert
```

## Health Checks

### Automated Health Checks

Health checks run automatically after deployment:

```bash
# Backend API
curl https://api.smarterp.com/api/health

# Database connectivity
curl https://api.smarterp.com/api/health/db

# Redis connectivity
curl https://api.smarterp.com/api/health/redis

# Memory usage
curl https://api.smarterp.com/api/health/memory
```

### Manual Health Checks

```bash
# 1. Check backend
curl -f https://api.smarterp.com/api/health || echo "Backend unhealthy"

# 2. Check frontend
curl -f https://app.smarterp.com || echo "Frontend unhealthy"

# 3. Check database
docker exec -it postgres psql -U postgres -c "SELECT 1"

# 4. Check Redis
docker exec -it redis redis-cli ping

# 5. Check logs
docker logs backend --tail 100
docker logs frontend --tail 100
```

## Rollback Procedures

### Automated Rollback (GitHub Actions)

```bash
# 1. Go to GitHub Actions
# 2. Find last successful deployment
# 3. Click "Re-run jobs"
# 4. Confirm rollback
```

### Manual Rollback (Docker)

```bash
# 1. Find previous image tag
docker images | grep smart-erp

# 2. Pull previous version
docker pull ghcr.io/your-org/smart-erp-backend:prod-{previous-sha}
docker pull ghcr.io/your-org/smart-erp-frontend:prod-{previous-sha}

# 3. Stop current containers
docker-compose down

# 4. Update docker-compose.yml with previous tags

# 5. Start previous version
docker-compose up -d

# 6. Verify rollback
curl https://api.smarterp.com/api/health
```

### Database Rollback

```bash
# 1. Restore from backup
pg_restore -U postgres -d smart_erp backup.dump

# 2. Or revert migrations
cd src/backend
npm run migration:revert
```

## Monitoring After Deployment

### First 5 Minutes (Critical)

```bash
# 1. Check health endpoints every 30s
watch -n 30 'curl -f https://api.smarterp.com/api/health'

# 2. Monitor error rates
# Check Sentry dashboard

# 3. Check logs for errors
docker logs backend --tail 100 -f

# 4. Monitor performance
# Check response times in monitoring tools
```

### First Hour (Important)

- Monitor error rates in Sentry
- Check performance metrics
- Review user feedback
- Monitor database performance
- Check memory and CPU usage

### First Day (Standard)

- Review error trends
- Check performance trends
- Monitor user activity
- Review logs for warnings
- Check backup integrity

## Backup Procedures

### Automated Backups

Backups run automatically:
- **Database**: Daily at 2 AM UTC
- **Files**: Daily at 3 AM UTC
- **Retention**: 30 days

### Manual Backup

```bash
# Database backup
docker exec postgres pg_dump -U postgres smart_erp > backup-$(date +%Y%m%d).sql

# Or with pg_dump directly
pg_dump -h localhost -U postgres -d smart_erp -F c -f backup.dump

# Files backup
tar -czf files-backup-$(date +%Y%m%d).tar.gz uploads/

# Configuration backup
tar -czf config-backup-$(date +%Y%m%d).tar.gz .env docker-compose.yml
```

### Restore from Backup

```bash
# Database restore
docker exec -i postgres psql -U postgres smart_erp < backup-20240101.sql

# Or with pg_restore
pg_restore -U postgres -d smart_erp backup.dump

# Files restore
tar -xzf files-backup-20240101.tar.gz

# Configuration restore
tar -xzf config-backup-20240101.tar.gz
```

## Troubleshooting

### Deployment Fails

**Issue**: Docker build fails
```bash
# Solution: Build locally to debug
docker build -t test .
# Check Dockerfile syntax
# Verify dependencies
```

**Issue**: Health check fails
```bash
# Solution: Check logs
docker logs backend --tail 100
docker logs frontend --tail 100

# Check environment variables
docker exec backend env | grep DATABASE_URL

# Check database connectivity
docker exec backend npm run migration:run
```

**Issue**: Database migration fails
```bash
# Solution: Check migration file
cat database/migrations/latest-migration.ts

# Rollback and retry
npm run migration:revert
npm run migration:run
```

### Application Issues

**Issue**: 502 Bad Gateway
```bash
# Check backend is running
docker ps | grep backend

# Check backend logs
docker logs backend --tail 100

# Restart backend
docker restart backend
```

**Issue**: Database connection error
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string
echo $DATABASE_URL

# Test connection
docker exec postgres psql -U postgres -c "SELECT 1"
```

**Issue**: Redis connection error
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
docker exec redis redis-cli ping

# Restart Redis
docker restart redis
```

## Security Considerations

### Before Deployment

- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS enabled for all endpoints
- [ ] Database credentials rotated
- [ ] API keys rotated
- [ ] Security audit passed
- [ ] Dependencies updated
- [ ] No high/critical vulnerabilities

### After Deployment

- [ ] Verify HTTPS certificates
- [ ] Check security headers
- [ ] Test authentication
- [ ] Test authorization
- [ ] Review access logs
- [ ] Monitor for suspicious activity

## Performance Optimization

### Before Deployment

- [ ] Database indexes optimized
- [ ] Queries optimized (no N+1)
- [ ] Images optimized
- [ ] Bundle size optimized
- [ ] Caching configured
- [ ] CDN configured

### After Deployment

- [ ] Monitor response times
- [ ] Check database query performance
- [ ] Monitor memory usage
- [ ] Monitor CPU usage
- [ ] Check cache hit rates

## Deployment Checklist

See [deployment-checklist.md](./deployment-checklist.md) for detailed pre-deployment and post-deployment checklists.

## Support

For deployment issues:

1. Check GitHub Actions logs
2. Review this guide
3. Check [CI_CD_GUIDE.md](../CI_CD_GUIDE.md)
4. Contact DevOps team

## References

- [CI/CD Pipeline Guide](../CI_CD_GUIDE.md)
- [Deployment Checklist](./deployment-checklist.md)
- [Security Guidelines](./security-guidelines.md)
- [Config Management](./config-management.md)

---

**Last Updated**: 2024
**Maintained By**: DevOps Team
