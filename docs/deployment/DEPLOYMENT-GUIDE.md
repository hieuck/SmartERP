# 🚀 Production Deployment Guide

## Overview

Complete guide for deploying Smart ERP to production environment.

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04 LTS or later
- **CPU**: 4+ cores
- **RAM**: 8GB+ (16GB recommended)
- **Storage**: 100GB+ SSD
- **Network**: Static IP, Domain name

### Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local development)
- PostgreSQL 14+ (or use Docker)
- Redis 7+ (or use Docker)
- Nginx (or use Docker)

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Fill in all environment variables
- [ ] Generate secure secrets (JWT, encryption keys)
- [ ] Configure database credentials
- [ ] Configure email settings
- [ ] Configure AWS S3 (for file storage)
- [ ] Configure monitoring tools (Sentry, New Relic)

### 2. Domain & SSL
- [ ] Register domain name
- [ ] Point DNS to server IP
- [ ] Obtain SSL certificate (Let's Encrypt)
- [ ] Configure SSL in Nginx

### 3. Database Setup
- [ ] Create production database
- [ ] Create database user with appropriate permissions
- [ ] Enable SSL for database connections
- [ ] Configure connection pooling
- [ ] Set up automated backups

### 4. Security
- [ ] Change all default passwords
- [ ] Enable firewall (UFW)
- [ ] Configure fail2ban
- [ ] Set up SSH key authentication
- [ ] Disable root SSH login
- [ ] Enable automatic security updates

### 5. Monitoring
- [ ] Set up Prometheus
- [ ] Set up Grafana dashboards
- [ ] Configure alerts
- [ ] Set up log aggregation
- [ ] Configure uptime monitoring

## Deployment Methods

### Method 1: Docker Compose (Recommended)

#### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/smart-erp.git
cd smart-erp
```

#### Step 2: Configure Environment
```bash
cp .env.production.example .env.production
nano .env.production  # Edit configuration
```

#### Step 3: Build Images
```bash
docker-compose -f docker-compose.production.yml build
```

#### Step 4: Start Services
```bash
docker-compose -f docker-compose.production.yml up -d
```

#### Step 5: Run Migrations
```bash
docker-compose exec backend npm run migration:run
```

#### Step 6: Verify Deployment
```bash
# Check service status
docker-compose ps

# Check logs
docker-compose logs -f

# Test health endpoints
curl http://localhost:3000/health
curl http://localhost:80/health
```

### Method 2: Automated Deployment Script

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh production
```

The script will:
1. Check prerequisites
2. Backup database
3. Build Docker images
4. Stop old services
5. Start new services
6. Run migrations
7. Perform health checks
8. Show logs

### Method 3: Manual Deployment

#### Backend Deployment

```bash
cd backend

# Install dependencies
npm ci --production

# Build application
npm run build

# Run migrations
npm run migration:run

# Start with PM2
pm2 start dist/main.js --name smart-erp-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Frontend Deployment

```bash
cd frontend

# Install dependencies
npm ci

# Build application
npm run build

# Copy to Nginx
sudo cp -r dist/* /var/www/smart-erp/

# Restart Nginx
sudo systemctl restart nginx
```

## SSL Configuration

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d erp.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name erp.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/erp.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name erp.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Database Migration

### Running Migrations

```bash
# Using Docker
docker-compose exec backend npm run migration:run

# Using PM2
cd backend && npm run migration:run
```

### Rollback Migration

```bash
# Rollback last migration
npm run migration:revert
```

### Generate Migration

```bash
# Generate migration from entity changes
npm run migration:generate -- -n MigrationName
```

## Backup & Recovery

### Automated Backups

Backups run daily at 2 AM via cron:

```bash
# View backup logs
docker-compose logs backup

# Manual backup
docker-compose exec postgres pg_dump -U erp_user smart_erp_production > backup.sql
```

### Restore from Backup

```bash
# Stop services
docker-compose down

# Restore database
docker-compose exec -T postgres psql -U erp_user smart_erp_production < backup.sql

# Start services
docker-compose up -d
```

### Backup to S3

```bash
# Configure AWS credentials in .env.production
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=smart-erp-backups

# Backups will automatically upload to S3
```

## Monitoring

### Prometheus Metrics

Access: `http://your-server:9090`

Metrics collected:
- API response times
- Request rates
- Error rates
- Database connections
- Memory usage
- CPU usage

### Grafana Dashboards

Access: `http://your-server:3001`

Default credentials:
- Username: admin
- Password: (set in .env.production)

Dashboards:
- System Overview
- API Performance
- Database Performance
- Error Tracking

### Log Management

```bash
# View all logs
docker-compose logs

# View specific service
docker-compose logs backend

# Follow logs
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

## Scaling

### Horizontal Scaling

#### Load Balancer Configuration

```nginx
upstream backend_servers {
    least_conn;
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
}

server {
    location /api {
        proxy_pass http://backend_servers;
    }
}
```

#### Database Read Replicas

```yaml
# docker-compose.production.yml
postgres-replica:
  image: postgres:14-alpine
  environment:
    POSTGRES_MASTER_HOST: postgres
    POSTGRES_REPLICATION_MODE: slave
```

### Vertical Scaling

Update Docker Compose resource limits:

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 4G
      reservations:
        cpus: '1'
        memory: 2G
```

## Performance Optimization

### Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Analyze tables
ANALYZE products;
ANALYZE orders;

-- Vacuum
VACUUM ANALYZE;
```

### Redis Caching

```typescript
// Enable caching in production
@UseInterceptors(CacheInterceptor)
@CacheTTL(300) // 5 minutes
async getProducts() {
  // ...
}
```

### CDN Configuration

Use CloudFlare or AWS CloudFront for static assets:

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs backend

# Check container status
docker-compose ps

# Restart service
docker-compose restart backend
```

### Database Connection Issues

```bash
# Test database connection
docker-compose exec backend npm run typeorm -- query "SELECT 1"

# Check database logs
docker-compose logs postgres
```

### High Memory Usage

```bash
# Check memory usage
docker stats

# Restart services
docker-compose restart

# Increase memory limits in docker-compose.yml
```

### Slow Performance

```bash
# Check database queries
docker-compose exec postgres psql -U erp_user -d smart_erp_production -c "SELECT * FROM pg_stat_activity;"

# Enable query logging
# Add to postgresql.conf:
log_statement = 'all'
log_duration = on
```

## Security Hardening

### Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### Fail2Ban

```bash
# Install fail2ban
sudo apt install fail2ban

# Configure
sudo nano /etc/fail2ban/jail.local

[sshd]
enabled = true
maxretry = 3
bantime = 3600
```

### Regular Updates

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

## Rollback Procedure

### Quick Rollback

```bash
# Stop current version
docker-compose down

# Restore database backup
docker-compose exec -T postgres psql -U erp_user smart_erp_production < backups/latest.sql

# Start previous version
docker-compose up -d
```

### Git-based Rollback

```bash
# Find previous version
git log --oneline

# Checkout previous version
git checkout <commit-hash>

# Redeploy
./scripts/deploy.sh production
```

## Maintenance

### Regular Tasks

**Daily:**
- Check logs for errors
- Monitor system resources
- Verify backups completed

**Weekly:**
- Review security logs
- Check for updates
- Test backup restoration

**Monthly:**
- Update dependencies
- Review performance metrics
- Optimize database

**Quarterly:**
- Security audit
- Disaster recovery test
- Capacity planning

## Support

### Getting Help

- Documentation: https://docs.smarterp.com
- Support Email: support@smarterp.com
- Community Forum: https://community.smarterp.com
- GitHub Issues: https://github.com/yourusername/smart-erp/issues

### Emergency Contacts

- On-call Engineer: +1-XXX-XXX-XXXX
- DevOps Team: devops@smarterp.com
- Security Team: security@smarterp.com

---

**Last Updated**: 2026-02-27  
**Version**: 1.0.0
