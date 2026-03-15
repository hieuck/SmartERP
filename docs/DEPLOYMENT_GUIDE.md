# SmartERP Production Deployment Guide

Complete step-by-step guide for deploying SmartERP to production environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Docker Deployment](#docker-deployment)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Health Verification](#health-verification)
8. [Monitoring Setup](#monitoring-setup)
9. [Troubleshooting](#troubleshooting)
10. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required Tools
- Docker 24+ and Docker Compose 2+
- Node.js 20+ (for local testing)
- PostgreSQL 15+ client
- Redis 7+ client
- kubectl (for Kubernetes deployment)
- Git

### Required Access
- Production server SSH access
- Database admin credentials
- Container registry access (GHCR/ECR/Docker Hub)
- DNS management access
- SSL certificate (Let's Encrypt or purchased)

---

## Infrastructure Setup

### Option 1: Single Server Deployment

**Recommended for**: <100 concurrent users

#### Server Specifications
- **CPU**: 2 vCPU minimum, 4 vCPU recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB SSD minimum
- **OS**: Ubuntu 22.04 LTS

#### Setup Steps

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Configure Firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Option 2: Cloud Deployment (AWS)

**Recommended for**: >100 concurrent users

#### AWS Resources

1. **RDS PostgreSQL**
```bash
aws rds create-db-instance \
  --db-instance-identifier smart-erp-db \
  --db-instance-class db.t3.small \
  --engine postgres \
  --engine-version 15.4 \
  --master-username erp_admin \
  --master-user-password <secure-password> \
  --allocated-storage 50 \
  --backup-retention-period 7
```

2. **ElastiCache Redis**
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id smart-erp-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

3. **EC2 Instance**
```bash
aws ec2 run-instances \
  --image-id ami-xxx \
  --instance-type t3.medium \
  --key-name your-key-pair
```

---

## Environment Configuration

### 1. Clone Repository
```bash
cd /opt
sudo git clone https://github.com/your-org/smart-erp.git
cd smart-erp
```

### 2. Create Production Environment File
```bash
cp .env.production.example .env.production
nano .env.production
```

### 3. Configure Critical Variables

```bash
# Application
NODE_ENV=production
APP_URL=https://erp.yourdomain.com

# Database
DB_HOST=<your-db-host>
DB_PORT=5432
DB_USERNAME=erp_admin
DB_PASSWORD=<secure-password>
DB_DATABASE=smart_erp_production
DB_SSL=true

# Redis
REDIS_HOST=<your-redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=<generate-secure-secret-min-32-chars>
JWT_REFRESH_SECRET=<generate-different-secret>
SESSION_SECRET=<generate-secure-secret>
ENCRYPTION_KEY=<generate-32-char-key>

# CORS
CORS_ORIGIN=https://erp.yourdomain.com
```

### 4. Generate Secure Secrets
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate encryption key
openssl rand -hex 16

# Generate session secret
openssl rand -base64 32
```

---

## Database Setup

### 1. Create Database
```bash
# Connect to PostgreSQL
psql -h <db-host> -U postgres

# Create database and user
CREATE DATABASE smart_erp_production;
CREATE USER erp_admin WITH ENCRYPTED PASSWORD '<secure-password>';
GRANT ALL PRIVILEGES ON DATABASE smart_erp_production TO erp_admin;
\q
```

### 2. Test Connection
```bash
psql -h <db-host> -U erp_admin -d smart_erp_production
\l
\q
```

### 3. Run Migrations
```bash
cd /opt/smart-erp/src/backend
npm ci --only=production
npm run migration:run
npm run migration:show
```

---

## Docker Deployment

### Method 1: Docker Compose (Single Server)

#### 1. Build Images
```bash
cd /opt/smart-erp

# Build backend
cd src/backend
docker build -t smart-erp-backend:latest .

# Build frontend
cd ../frontend
docker build -t smart-erp-frontend:latest .
```

#### 2. Start Services
```bash
cd /opt/smart-erp/config/docker
docker compose -f docker-compose.production.yml up -d

# Verify
docker ps
docker compose logs -f
```

#### 3. Verify Deployment
```bash
curl http://localhost:3000/api/health
curl http://localhost:80
```

### Method 2: Docker with External Database

```bash
# Update docker-compose.production.yml
# Remove postgres and redis services
# Update backend environment to use external endpoints

docker compose -f docker-compose.production.yml up -d backend frontend nginx
```

---

## Kubernetes Deployment

### 1. Push Images to Registry

```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag images
docker tag smart-erp-backend:latest ghcr.io/your-org/smart-erp-backend:v1.0.0
docker tag smart-erp-frontend:latest ghcr.io/your-org/smart-erp-frontend:v1.0.0

# Push images
docker push ghcr.io/your-org/smart-erp-backend:v1.0.0
docker push ghcr.io/your-org/smart-erp-frontend:v1.0.0
```

### 2. Configure Secrets
```bash
cd /opt/smart-erp/config/kubernetes

# Create secrets
kubectl create secret generic smart-erp-secrets \
  --from-env-file=../../.env.production \
  --namespace=production
```

### 3. Deploy
```bash
cd /opt/smart-erp/config/kubernetes
chmod +x deploy-production.sh
./deploy-production.sh
```

### 4. Verify
```bash
kubectl get pods -n production
kubectl get svc -n production
kubectl get ingress -n production
kubectl logs -f deployment/api-gateway -n production
```

---

## Health Verification

### 1. Backend Health
```bash
curl https://api.yourdomain.com/api/health

# Expected:
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

### 2. Frontend
```bash
curl https://app.yourdomain.com
# Should return 200 OK
```

### 3. Database Connectivity
```bash
curl https://api.yourdomain.com/api/health/db
psql -h <db-host> -U erp_admin -d smart_erp_production -c "SELECT 1;"
```

### 4. Redis Connectivity
```bash
curl https://api.yourdomain.com/api/health/redis
redis-cli -h <redis-host> -p 6379 -a <password> ping
```

### 5. SSL Certificate
```bash
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Monitoring Setup

### 1. Start Monitoring Stack
```bash
cd /opt/smart-erp/config/monitoring
docker compose -f docker-compose.monitoring.yml up -d
docker ps | grep -E "prometheus|grafana|alertmanager"
```

### 2. Access Dashboards
- **Grafana**: https://grafana.yourdomain.com (admin/admin123)
- **Prometheus**: https://prometheus.yourdomain.com
- **Alertmanager**: https://alertmanager.yourdomain.com

### 3. Configure Alerts
```bash
nano /opt/smart-erp/config/monitoring/alertmanager.yml

# Update SMTP settings
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@yourdomain.com'
  smtp_auth_username: 'alerts@yourdomain.com'
  smtp_auth_password: '<app-password>'

docker restart smart-erp-alertmanager
```

### 4. Import Grafana Dashboard
1. Open Grafana
2. Go to Dashboards → Import
3. Upload `grafana-dashboard.json`
4. Select Prometheus data source

---

## Troubleshooting

### Issue 1: Backend Not Starting

**Diagnosis**:
```bash
docker logs smart-erp-backend
```

**Solutions**:
```bash
# Verify database
psql -h <db-host> -U erp_admin -d smart_erp_production

# Verify Redis
redis-cli -h <redis-host> ping

# Check environment
docker exec smart-erp-backend env | grep DB_

# Restart
docker restart smart-erp-backend
```

### Issue 2: Database Migration Fails

**Diagnosis**:
```bash
cd /opt/smart-erp/src/backend
npm run migration:show
psql -h <db-host> -U erp_admin -d smart_erp_production -c "\dt"
```

**Solutions**:
```bash
# Revert migration
npm run migration:revert

# Re-run
npm run migration:run

# Restore from backup
psql -h <db-host> -U erp_admin -d smart_erp_production < backup.sql
```

### Issue 3: High Memory Usage

**Diagnosis**:
```bash
docker stats
curl https://api.yourdomain.com/api/health/live
```

**Solutions**:
```bash
# Increase memory limit in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G

docker compose up -d backend
```

### Issue 4: SSL Certificate Issues

**Diagnosis**:
```bash
openssl s_client -connect yourdomain.com:443
docker exec smart-erp-nginx nginx -t
```

**Solutions**:
```bash
# Renew certificate
certbot renew

# Or install new
sudo cp cert.pem /opt/smart-erp/config/nginx/ssl/
sudo cp key.pem /opt/smart-erp/config/nginx/ssl/
docker restart smart-erp-nginx
```

### Issue 5: Slow API Response

**Diagnosis**:
```bash
curl -w "@curl-format.txt" -o /dev/null -s https://api.yourdomain.com/api/health

# Check database
psql -h <db-host> -U erp_admin -d smart_erp_production
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;

# Check Redis
redis-cli -h <redis-host> --latency
```

**Solutions**:
- Add database indexes
- Increase connection pool
- Enable Redis caching
- Scale resources
- Optimize queries

---

## Rollback Procedures

### Scenario 1: Application Issues (Docker)

```bash
cd /opt/smart-erp/config/docker

# Stop current
docker compose down

# Pull previous version
docker pull ghcr.io/your-org/smart-erp-backend:v0.9.0
docker pull ghcr.io/your-org/smart-erp-frontend:v0.9.0

# Tag as latest
docker tag ghcr.io/your-org/smart-erp-backend:v0.9.0 smart-erp-backend:latest
docker tag ghcr.io/your-org/smart-erp-frontend:v0.9.0 smart-erp-frontend:latest

# Start
docker compose up -d

# Verify
curl https://api.yourdomain.com/api/health
```

### Scenario 2: Application Issues (Kubernetes)

```bash
cd /opt/smart-erp/config/kubernetes

# Use rollback script
./rollback.sh production switch

# Or manual
kubectl rollout undo deployment/api-gateway -n production
kubectl rollout undo deployment/frontend -n production

# Verify
kubectl get pods -n production
```

### Scenario 3: Database Migration Issues

```bash
cd /opt/smart-erp/src/backend

# Revert migration
npm run migration:revert

# Verify
npm run migration:show

# Restart
docker restart smart-erp-backend
```

### Scenario 4: Complete System Failure

```bash
# Stop services
docker compose down

# Restore database
psql -h <db-host> -U erp_admin -d smart_erp_production < backup.sql

# Restore files
cd /opt
sudo rm -rf smart-erp
sudo tar -xzf smart-erp-backup.tar.gz

# Start services
cd /opt/smart-erp/config/docker
docker compose up -d

# Verify
curl https://api.yourdomain.com/api/health
```

---

## Post-Deployment Tasks

### 1. Monitor for 24 Hours
- Check error rates in Sentry
- Monitor API response times
- Monitor server resources
- Check user feedback

### 2. Update Documentation
- Document issues encountered
- Update runbook
- Share deployment report

### 3. Schedule Review
- Review deployment process
- Identify improvements
- Update procedures

---

## Support & Resources

### Documentation
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Monitoring Guide](../config/monitoring/README.md)

### Emergency Contacts
- **DevOps Lead**: [Name] - [Email] - [Phone]
- **Backend Lead**: [Name] - [Email] - [Phone]
- **Database Admin**: [Name] - [Email] - [Phone]

### Useful Links
- Production Dashboard: https://grafana.yourdomain.com
- Error Tracking: https://sentry.io/your-org/smart-erp

---

**Version**: 1.0.0  
**Last Updated**: 2026-03-15  
**Maintained by**: DevOps Team
