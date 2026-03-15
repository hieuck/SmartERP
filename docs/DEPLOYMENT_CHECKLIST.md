# Production Deployment Checklist

## Pre-Deployment Preparation

### 1. Environment Configuration
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Fill in all required environment variables
- [ ] Verify database credentials
- [ ] Verify Redis credentials
- [ ] Set secure JWT secrets (min 32 characters)
- [ ] Configure SMTP for email notifications
- [ ] Set up AWS S3 credentials (if using file storage)
- [ ] Configure Sentry DSN for error tracking
- [ ] Set CORS origins to production domains
- [ ] Enable security features (2FA, rate limiting, audit log)

### 2. Infrastructure Setup
- [ ] Provision production server (2 vCPU, 4GB RAM minimum)
- [ ] Set up PostgreSQL database (managed service recommended)
- [ ] Set up Redis cache (managed service recommended)
- [ ] Configure load balancer with SSL termination
- [ ] Set up S3 bucket for file storage
- [ ] Configure DNS records (A/CNAME)
- [ ] Obtain SSL certificate (Let's Encrypt or ACM)
- [ ] Set up VPC with public/private subnets (if using cloud)
- [ ] Configure security groups/firewall rules
- [ ] Set up NAT gateway for private subnets

### 3. Database Preparation
- [ ] Create production database
- [ ] Create database user with appropriate permissions
- [ ] Enable SSL connections
- [ ] Configure connection pooling (20 connections recommended)
- [ ] Set up automated backups (daily minimum)
- [ ] Test database connectivity from application server
- [ ] Verify database performance (query response time)

### 4. Code Quality Gates
- [ ] All CI tests passing (backend + frontend)
- [ ] Test coverage ≥80%
- [ ] No ESLint errors
- [ ] No TypeScript errors
- [ ] Security audit passed (npm audit)
- [ ] No high/critical vulnerabilities
- [ ] Code review completed
- [ ] Staging deployment tested successfully

### 5. Docker Images
- [ ] Build backend Docker image
- [ ] Build frontend Docker image
- [ ] Push images to container registry (GHCR/ECR/Docker Hub)
- [ ] Tag images with version (e.g., v1.0.0, production-latest)
- [ ] Verify image sizes (backend <500MB, frontend <100MB)
- [ ] Test images locally before deployment

### 6. Monitoring & Logging
- [ ] Configure Sentry for error tracking
- [ ] Set up Google Analytics 4 (optional)
- [ ] Configure Prometheus metrics collection
- [ ] Set up Grafana dashboards
- [ ] Configure Alertmanager for critical alerts
- [ ] Set up log aggregation (CloudWatch/ELK)
- [ ] Configure uptime monitoring (Pingdom/UptimeRobot)
- [ ] Set up alert notifications (email/Slack/PagerDuty)

## Deployment Steps

### 7. Pre-Deployment Backup
- [ ] Backup current production database (if exists)
- [ ] Backup current application files (if exists)
- [ ] Backup current configuration files
- [ ] Store backups in secure location (S3/separate server)
- [ ] Verify backup integrity
- [ ] Document rollback procedure

### 8. Database Migration
- [ ] Review migration files
- [ ] Test migrations on staging database
- [ ] Create database backup before migration
- [ ] Run migrations on production database
- [ ] Verify migration success
- [ ] Check for migration errors in logs
- [ ] Verify database schema matches expected state

### 9. Application Deployment
- [ ] Pull latest Docker images on production server
- [ ] Stop old containers (if exists)
- [ ] Start new containers with updated images
- [ ] Verify containers are running
- [ ] Check container logs for errors
- [ ] Verify environment variables loaded correctly
- [ ] Wait for application to be ready (health checks)

### 10. Health Checks
- [ ] Backend health: `curl https://api.domain.com/api/health`
- [ ] Frontend accessible: `curl https://app.domain.com`
- [ ] Database connectivity: Check `/api/health` response
- [ ] Redis connectivity: Check `/api/health` response
- [ ] Memory usage: Check `/api/health/live` response
- [ ] API endpoints responding: Test critical endpoints
- [ ] Authentication working: Test login flow
- [ ] File upload working: Test file operations (if applicable)

### 11. Smoke Tests
- [ ] User can register new account
- [ ] User can login with credentials
- [ ] User can view dashboard
- [ ] User can create entity (product/customer/order)
- [ ] User can update entity
- [ ] User can delete entity
- [ ] Search functionality working
- [ ] Pagination working
- [ ] Offline mode working (if applicable)
- [ ] Sync working after going online (if applicable)

### 12. Performance Verification
- [ ] API response time p95 <500ms
- [ ] Page load time <2s (first contentful paint)
- [ ] Time to interactive <3s
- [ ] No memory leaks (monitor for 30 minutes)
- [ ] No CPU spikes
- [ ] Database query performance acceptable
- [ ] Cache hit rate >50%
- [ ] No N+1 query issues

## Post-Deployment

### 13. Monitoring
- [ ] Monitor error rates in Sentry (should be <1%)
- [ ] Monitor API response times in Grafana
- [ ] Monitor server resources (CPU, memory, disk)
- [ ] Monitor database connections
- [ ] Monitor Redis memory usage
- [ ] Check application logs for errors
- [ ] Monitor user activity (if analytics enabled)
- [ ] Set up alerts for critical metrics

### 14. Documentation
- [ ] Update deployment documentation
- [ ] Document any issues encountered
- [ ] Document rollback procedure
- [ ] Update runbook with production specifics
- [ ] Share deployment report with team
- [ ] Update changelog
- [ ] Create GitHub release (if applicable)

### 15. Communication
- [ ] Notify team of successful deployment
- [ ] Notify stakeholders of new features
- [ ] Update status page (if applicable)
- [ ] Send deployment report to management
- [ ] Schedule post-deployment review meeting

### 16. Rollback Plan (If Issues Found)
- [ ] Document rollback procedure
- [ ] Keep old Docker images available
- [ ] Keep database backup accessible
- [ ] Test rollback procedure on staging
- [ ] Assign rollback responsibility
- [ ] Set rollback decision criteria (error rate >5%, response time >3s, etc.)

## Security Checklist

### 17. Security Verification
- [ ] HTTPS enabled and working
- [ ] SSL certificate valid
- [ ] HTTP redirects to HTTPS
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] JWT secrets are secure (not default values)
- [ ] Database credentials are secure
- [ ] Redis password set
- [ ] No sensitive data in logs
- [ ] No API keys in client-side code
- [ ] File upload validation working
- [ ] SQL injection protection verified
- [ ] XSS protection verified
- [ ] CSRF protection enabled

## Compliance Checklist

### 18. Compliance & Legal
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Cookie consent implemented (if applicable)
- [ ] GDPR compliance verified (if applicable)
- [ ] Data retention policy configured
- [ ] User data export functionality working
- [ ] User data deletion functionality working
- [ ] Audit logging enabled

## Final Verification

### 19. Final Checks
- [ ] All checklist items completed
- [ ] No critical errors in logs
- [ ] No performance issues
- [ ] No security vulnerabilities
- [ ] Monitoring active and alerting
- [ ] Team notified
- [ ] Documentation updated
- [ ] Rollback plan ready

### 20. Sign-Off
- [ ] DevOps Engineer: _______________
- [ ] Backend Engineer: _______________
- [ ] Frontend Engineer: _______________
- [ ] QA Engineer: _______________
- [ ] Security Engineer: _______________
- [ ] Project Manager: _______________

---

## Emergency Contacts

- **DevOps Lead**: [Name] - [Email] - [Phone]
- **Backend Lead**: [Name] - [Email] - [Phone]
- **Database Admin**: [Name] - [Email] - [Phone]
- **Security Lead**: [Name] - [Email] - [Phone]
- **On-Call Engineer**: [Name] - [Email] - [Phone]

## Useful Commands

### Health Checks
```bash
# Backend health
curl https://api.domain.com/api/health

# Frontend
curl https://app.domain.com

# Database connectivity
curl https://api.domain.com/api/health/db

# Redis connectivity
curl https://api.domain.com/api/health/redis
```

### Docker Commands
```bash
# View running containers
docker ps

# View container logs
docker logs smart-erp-backend

# Restart container
docker restart smart-erp-backend

# Stop all containers
docker-compose down

# Start all containers
docker-compose up -d
```

### Database Commands
```bash
# Connect to database
psql -h <host> -U <user> -d <database>

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Check migration status
npm run migration:show
```

### Monitoring
```bash
# Check server resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check network connections
netstat -tulpn
```

---

**Version**: 1.0.0  
**Last Updated**: 2026-03-15  
**Next Review**: Before each production deployment
