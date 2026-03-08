---
name: devops-deployment-patterns
description: Best practices for Docker, Kubernetes, CI/CD, and monitoring in SmartERP infrastructure. Use when working on containerization, orchestration, deployment pipelines, or infrastructure monitoring.
---

# DevOps Deployment Patterns

## When to Use This Skill

Use this skill when working on:

- ✅ Docker configurations in `config/docker/`
- ✅ Kubernetes manifests in `config/kubernetes/`
- ✅ Nginx configurations in `config/nginx/`
- ✅ Monitoring setup (Prometheus, Grafana) in `config/monitoring/`
- ✅ CI/CD pipelines
- ✅ Backup and disaster recovery

## Tech Stack Overview

```json
{
  "containerization": "Docker + Docker Compose",
  "orchestration": "Kubernetes",
  "reverse-proxy": "Nginx",
  "monitoring": "Prometheus + Grafana + ELK Stack",
  "databases": "PostgreSQL, MongoDB, Redis, Elasticsearch",
  "message-queue": "RabbitMQ",
  "storage": "MinIO (S3-compatible)"
}
```

## Core Patterns

### 1. Docker Compose (Development)

**✅ Multi-Service Setup with Health Checks**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER}']
      interval: 10s
      timeout: 5s
      retries: 5
```

### 2. Kubernetes Deployment

**✅ Stateless App with Resource Limits**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: production
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: api-gateway
          image: smarterp/api-gateway:latest
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
```

### 3. Nginx Reverse Proxy

**✅ Production Config with SSL & Rate Limiting**

```nginx
upstream backend {
    least_conn;
    server backend-1:3000;
    server backend-2:3000;
}

server {
    listen 443 ssl http2;
    server_name smarterp.example.com;

    # Rate limiting
    limit_req zone=api_limit burst=20 nodelay;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Monitoring (Prometheus)

**✅ Scrape Config & Alert Rules**

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'backend'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['backend:3000']

# alerts.yml
groups:
  - name: backend_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
```

### 5. Backup Strategy

**✅ CronJob for Database Backup**

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
spec:
  schedule: '0 2 * * *' # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: postgres:15-alpine
              command:
                - /bin/sh
                - -c
                - pg_dumpall | gzip > /backups/backup.sql.gz
```

## Common Pitfalls

### ❌ No Resource Limits

```yaml
# BAD - Can consume all node resources
containers:
  - name: backend
    image: backend:latest

# GOOD
containers:
  - name: backend
    resources:
      limits:
        memory: '512Mi'
        cpu: '500m'
```

### ❌ No Health Checks

```yaml
# BAD - K8s doesn't know if app is healthy
containers:
  - name: backend

# GOOD
containers:
  - name: backend
    livenessProbe:
      httpGet:
        path: /health
```

### ❌ Secrets in ConfigMaps

```yaml
# BAD
kind: ConfigMap
data:
  PASSWORD: 'secret' # ❌ Exposed

# GOOD
kind: Secret
data:
  PASSWORD: c2VjcmV0 # Base64
```

## Checklist

- [ ] ✅ Resource limits set
- [ ] ✅ Health probes configured
- [ ] ✅ Secrets in Kubernetes Secrets
- [ ] ✅ Monitoring enabled
- [ ] ✅ Backup strategy in place
- [ ] ✅ SSL/TLS configured
- [ ] ✅ Rate limiting enabled

## Related Documentation

- [Docker Docs](https://docs.docker.com/)
- [Kubernetes Docs](https://kubernetes.io/docs/)
- [Prometheus Docs](https://prometheus.io/docs/)
