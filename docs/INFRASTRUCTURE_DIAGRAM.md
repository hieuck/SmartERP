# SmartERP Infrastructure Architecture

## Production Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Internet / Users                            │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTPS (443)
                                 │
                    ┌────────────▼────────────┐
                    │   Load Balancer / CDN   │
                    │   - SSL Termination     │
                    │   - DDoS Protection     │
                    │   - Rate Limiting       │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
                │                                 │
    ┌───────────▼──────────┐         ┌──────────▼───────────┐
    │   Frontend (Nginx)   │         │   Backend (NestJS)   │
    │   - React SPA        │         │   - REST API         │
    │   - Static Assets    │         │   - WebSocket        │
    │   - Service Worker   │         │   - Health Checks    │
    │   Port: 80/443       │         │   Port: 3000         │
    └──────────────────────┘         └──────────┬───────────┘
                                                 │
                                                 │
                        ┌────────────────────────┼────────────────────────┐
                        │                        │                        │
                        │                        │                        │
            ┌───────────▼──────────┐ ┌──────────▼───────────┐ ┌─────────▼────────┐
            │  PostgreSQL Database │ │   Redis Cache        │ │   File Storage   │
            │  - Primary DB        │ │   - Session Store    │ │   - AWS S3       │
            │  - Automated Backup  │ │   - Query Cache      │ │   - User Uploads │
            │  Port: 5432          │ │   Port: 6379         │ │   - Documents    │
            └──────────────────────┘ └──────────────────────┘ └──────────────────┘
```

## Monitoring & Observability Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Monitoring Dashboard                             │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │    Grafana       │  │   Prometheus     │  │   Alertmanager   │     │
│  │  - Dashboards    │◄─┤  - Metrics       │◄─┤  - Alerts        │     │
│  │  - Visualization │  │  - Time Series   │  │  - Notifications │     │
│  │  Port: 3001      │  │  Port: 9090      │  │  Port: 9093      │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│                                ▲                                         │
│                                │ Scrape Metrics                          │
│                                │                                         │
│  ┌─────────────────────────────┴──────────────────────────────┐        │
│  │                    Application Metrics                      │        │
│  │  - HTTP Request Duration                                    │        │
│  │  - Database Query Performance                               │        │
│  │  - Cache Hit/Miss Rates                                     │        │
│  │  - Memory/CPU Usage                                         │        │
│  └─────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         Error Tracking                                   │
│                                                                          │
│  ┌──────────────────┐                                                   │
│  │     Sentry       │◄─── Application Errors                           │
│  │  - Error Logs    │◄─── Stack Traces                                 │
│  │  - Performance   │◄─── Performance Issues                           │
│  │  - Releases      │                                                   │
│  └──────────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture Options

### Option 1: Single Server (Small Scale)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Single Server (Ubuntu)                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Docker Compose Stack                       │    │
│  │                                                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │    │
│  │  │ Frontend │  │ Backend  │  │  Nginx   │            │    │
│  │  │Container │  │Container │  │Container │            │    │
│  │  └──────────┘  └──────────┘  └──────────┘            │    │
│  │                                                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │    │
│  │  │PostgreSQL│  │  Redis   │  │Monitoring│            │    │
│  │  │Container │  │Container │  │  Stack   │            │    │
│  │  └──────────┘  └──────────┘  └──────────┘            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Resources:                                                      │
│  - CPU: 4 vCPU                                                  │
│  - RAM: 8GB                                                     │
│  - Storage: 100GB SSD                                           │
│  - Network: 1Gbps                                               │
└─────────────────────────────────────────────────────────────────┘

Recommended for:
- <100 concurrent users
- <10GB data
- Development/Staging
- Small businesses
```

### Option 2: Cloud Deployment (AWS)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud                                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                         VPC (10.0.0.0/16)                       │    │
│  │                                                                  │    │
│  │  ┌─────────────────────────────────────────────────────────┐  │    │
│  │  │              Public Subnet (10.0.1.0/24)                 │  │    │
│  │  │                                                           │  │    │
│  │  │  ┌──────────────────┐      ┌──────────────────┐        │  │    │
│  │  │  │  Application     │      │   NAT Gateway    │        │  │    │
│  │  │  │  Load Balancer   │      │                  │        │  │    │
│  │  │  │  (ALB)           │      └──────────────────┘        │  │    │
│  │  │  └──────────────────┘                                   │  │    │
│  │  │           │                                              │  │    │
│  │  └───────────┼──────────────────────────────────────────────┘  │    │
│  │              │                                                  │    │
│  │  ┌───────────▼──────────────────────────────────────────────┐  │    │
│  │  │              Private Subnet (10.0.2.0/24)                 │  │    │
│  │  │                                                           │  │    │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │    │
│  │  │  │   EC2        │  │   EC2        │  │   EC2        │  │  │    │
│  │  │  │  Backend     │  │  Backend     │  │  Frontend    │  │  │    │
│  │  │  │  Instance 1  │  │  Instance 2  │  │  Instance    │  │  │    │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │    │
│  │  │                                                           │  │    │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │    │
│  │  │  │     RDS      │  │ ElastiCache  │  │      S3      │  │  │    │
│  │  │  │  PostgreSQL  │  │    Redis     │  │  File Store  │  │  │    │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Additional Services:                                                    │
│  - Route 53 (DNS)                                                       │
│  - CloudFront (CDN)                                                     │
│  - ACM (SSL Certificates)                                               │
│  - CloudWatch (Monitoring)                                              │
│  - S3 (Backups)                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Recommended for:
- >100 concurrent users
- >10GB data
- Production environment
- High availability required
- Auto-scaling needed
```

### Option 3: Kubernetes Deployment

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Kubernetes Cluster (EKS/GKE/AKS)                    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    Ingress Controller (Nginx)                   │    │
│  │                    - SSL Termination                            │    │
│  │                    - Load Balancing                             │    │
│  └────────────────────────────┬───────────────────────────────────┘    │
│                                │                                         │
│  ┌────────────────────────────┴───────────────────────────────────┐    │
│  │                      Production Namespace                       │    │
│  │                                                                  │    │
│  │  ┌─────────────────────────────────────────────────────────┐  │    │
│  │  │              Backend Deployment (3 replicas)             │  │    │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │  │    │
│  │  │  │ Backend  │  │ Backend  │  │ Backend  │              │  │    │
│  │  │  │  Pod 1   │  │  Pod 2   │  │  Pod 3   │              │  │    │
│  │  │  └──────────┘  └──────────┘  └──────────┘              │  │    │
│  │  └─────────────────────────────────────────────────────────┘  │    │
│  │                                                                  │    │
│  │  ┌─────────────────────────────────────────────────────────┐  │    │
│  │  │             Frontend Deployment (2 replicas)             │  │    │
│  │  │  ┌──────────┐  ┌──────────┐                             │  │    │
│  │  │  │Frontend  │  │Frontend  │                             │  │    │
│  │  │  │  Pod 1   │  │  Pod 2   │                             │  │    │
│  │  │  └──────────┘  └──────────┘                             │  │    │
│  │  └─────────────────────────────────────────────────────────┘  │    │
│  │                                                                  │    │
│  │  ┌─────────────────────────────────────────────────────────┐  │    │
│  │  │                  StatefulSets                            │  │    │
│  │  │  ┌──────────┐  ┌──────────┐                             │  │    │
│  │  │  │PostgreSQL│  │  Redis   │                             │  │    │
│  │  │  │StatefulSet│  │StatefulSet│                            │  │    │
│  │  │  └──────────┘  └──────────┘                             │  │    │
│  │  └─────────────────────────────────────────────────────────┘  │    │
│  │                                                                  │    │
│  │  ┌─────────────────────────────────────────────────────────┐  │    │
│  │  │              ConfigMaps & Secrets                        │  │    │
│  │  │  - Environment Variables                                 │  │    │
│  │  │  - Database Credentials                                  │  │    │
│  │  │  - API Keys                                              │  │    │
│  │  └─────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Features:                                                               │
│  - Horizontal Pod Autoscaling (HPA)                                     │
│  - Rolling Updates                                                       │
│  - Blue-Green Deployment                                                 │
│  - Health Checks (Liveness/Readiness)                                   │
│  - Resource Limits & Requests                                            │
└─────────────────────────────────────────────────────────────────────────┘

Recommended for:
- >500 concurrent users
- >100GB data
- Enterprise production
- High availability critical
- Auto-scaling required
- Multi-region deployment
```

## Network Flow

### User Request Flow

```
1. User Request
   │
   ├─► DNS Resolution (Route 53 / CloudFlare)
   │
   ├─► CDN (CloudFront / Cloudflare) [Static Assets]
   │
   ├─► Load Balancer (ALB / Nginx Ingress)
   │   - SSL Termination
   │   - Health Check
   │   - Rate Limiting
   │
   ├─► Frontend (Nginx)
   │   - Serve React SPA
   │   - Service Worker (Offline)
   │
   └─► Backend (NestJS)
       │
       ├─► Authentication Middleware
       │   - JWT Validation
       │   - Session Check
       │
       ├─► Rate Limiting Middleware
       │
       ├─► Business Logic
       │   │
       │   ├─► Database (PostgreSQL)
       │   │   - CRUD Operations
       │   │   - Transactions
       │   │
       │   ├─► Cache (Redis)
       │   │   - Session Store
       │   │   - Query Cache
       │   │
       │   └─► File Storage (S3)
       │       - Upload Files
       │       - Download Files
       │
       └─► Response
           - JSON Data
           - HTTP Status
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        Security Layers                           │
│                                                                  │
│  Layer 1: Network Security                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ - Firewall Rules                                        │    │
│  │ - Security Groups                                       │    │
│  │ - VPC Isolation                                         │    │
│  │ - DDoS Protection                                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Layer 2: Application Security                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ - HTTPS/TLS 1.3                                         │    │
│  │ - CORS Configuration                                    │    │
│  │ - Rate Limiting                                         │    │
│  │ - Input Validation                                      │    │
│  │ - SQL Injection Protection                              │    │
│  │ - XSS Protection                                        │    │
│  │ - CSRF Protection                                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Layer 3: Authentication & Authorization                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ - JWT Tokens                                            │    │
│  │ - Refresh Tokens                                        │    │
│  │ - Role-Based Access Control (RBAC)                     │    │
│  │ - 2FA (Optional)                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Layer 4: Data Security                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ - Database Encryption at Rest                           │    │
│  │ - SSL/TLS for Database Connections                     │    │
│  │ - Encrypted Backups                                     │    │
│  │ - Secrets Management                                    │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Backup & Disaster Recovery

```
┌─────────────────────────────────────────────────────────────────┐
│                    Backup Strategy                               │
│                                                                  │
│  Database Backups:                                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ - Automated Daily Backups (3:00 AM)                    │    │
│  │ - Retention: 30 days                                    │    │
│  │ - Storage: S3 with versioning                           │    │
│  │ - Encryption: AES-256                                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Application Backups:                                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ - Docker Images: Tagged and stored in registry         │    │
│  │ - Configuration: Version controlled in Git              │    │
│  │ - Secrets: Encrypted in secrets manager                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Disaster Recovery:                                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ - RTO (Recovery Time Objective): 1 hour                │    │
│  │ - RPO (Recovery Point Objective): 24 hours             │    │
│  │ - Backup Testing: Monthly                               │    │
│  │ - Rollback Procedure: Documented                        │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Scaling Strategy

### Horizontal Scaling

```
Load Increase → Add More Instances

Backend Scaling:
- Current: 1 instance
- Medium Load: 3 instances
- High Load: 5+ instances
- Auto-scaling based on CPU/Memory

Frontend Scaling:
- Current: 1 instance
- Medium Load: 2 instances
- High Load: 3+ instances
- CDN for static assets

Database Scaling:
- Read Replicas for read-heavy workloads
- Connection pooling
- Query optimization
```

### Vertical Scaling

```
Performance Issues → Upgrade Resources

Server Upgrade Path:
1. Small: 2 vCPU, 4GB RAM
2. Medium: 4 vCPU, 8GB RAM
3. Large: 8 vCPU, 16GB RAM
4. X-Large: 16 vCPU, 32GB RAM

Database Upgrade Path:
1. db.t3.small: 2 vCPU, 2GB RAM
2. db.t3.medium: 2 vCPU, 4GB RAM
3. db.t3.large: 2 vCPU, 8GB RAM
4. db.r5.large: 2 vCPU, 16GB RAM
```

## Cost Estimation

### Option 1: Single Server (Monthly)
- Server (4 vCPU, 8GB): $40-80
- Storage (100GB SSD): $10
- Bandwidth (1TB): $10
- **Total: ~$60-100/month**

### Option 2: AWS Cloud (Monthly)
- EC2 (t3.medium x2): $60
- RDS (db.t3.small): $30
- ElastiCache (cache.t3.micro): $15
- ALB: $20
- S3 Storage: $10
- CloudFront: $10
- **Total: ~$145/month**

### Option 3: Kubernetes (Monthly)
- EKS Cluster: $75
- Worker Nodes (t3.medium x3): $90
- RDS (db.t3.medium): $60
- ElastiCache (cache.t3.small): $30
- ALB: $20
- S3 Storage: $10
- **Total: ~$285/month**

---

**Version**: 1.0.0  
**Last Updated**: 2026-03-15  
**Maintained by**: DevOps Team
