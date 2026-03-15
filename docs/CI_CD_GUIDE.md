# CI/CD Pipeline Guide

## Overview

Smart-ERP uses GitHub Actions for CI/CD automation with comprehensive quality gates, automated testing, and deployment workflows.

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CI Pipeline (ci.yml)                     │
├─────────────────────────────────────────────────────────────┤
│  Backend                    │  Frontend                      │
│  ├─ Lint                    │  ├─ Lint                       │
│  ├─ Type Check              │  ├─ Type Check                 │
│  ├─ Build                   │  ├─ Build                      │
│  ├─ Unit Tests (≥80%)       │  ├─ Unit Tests (≥80%)          │
│  └─ Security Audit          │  └─ Security Audit             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Deploy Staging (deploy-staging.yml)             │
├─────────────────────────────────────────────────────────────┤
│  1. Quality Gates (CI must pass)                            │
│  2. Build & Push Docker Images                              │
│  3. Deploy to Staging                                        │
│  4. Health Checks (API, Frontend, DB, Redis)                │
│  5. Notify Team                                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│           Deploy Production (deploy-production.yml)          │
├─────────────────────────────────────────────────────────────┤
│  1. Quality Gates (CI + Staging must pass)                  │
│  2. Manual Confirmation (type "deploy")                     │
│  3. Build & Push Docker Images                              │
│  4. Deploy to Production                                     │
│  5. Smoke Tests (All endpoints)                             │
│  6. Monitor for 5 minutes                                    │
│  7. Create GitHub Release                                    │
│  8. Notify Team                                              │
└─────────────────────────────────────────────────────────────┘
```

## CI Pipeline (ci.yml)

### Triggers
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual trigger via `workflow_dispatch`

### Jobs

#### 1. Backend Lint
- ESLint with auto-fix disabled
- Must pass before build

#### 2. Backend Type Check
- TypeScript type checking
- Must pass before build

#### 3. Backend Build
- Compile TypeScript to JavaScript
- Upload build artifacts (7 days retention)

#### 4. Backend Tests
- Unit tests with Jest
- Coverage threshold: ≥80% (branches, functions, lines, statements)
- PostgreSQL and Redis services for integration tests
- Upload coverage to Codecov

#### 5. Frontend Lint
- ESLint with max 0 warnings
- Must pass before build

#### 6. Frontend Type Check
- TypeScript type checking with `tsc --noEmit`
- Must pass before build

#### 7. Frontend Build
- Vite build for production
- Environment variables injected
- Upload build artifacts (7 days retention)

#### 8. Frontend Tests
- Unit tests with Vitest
- Coverage threshold: ≥80%
- Upload coverage to Codecov

#### 9. Security Scan
- npm audit with `--audit-level=high`
- Checks for high and critical vulnerabilities
- Runs on both backend and frontend

#### 10. CI Summary
- Aggregates all job results
- Fails if any critical job fails
- Provides summary of pipeline status

### Quality Gates

All of the following must pass:
- ✅ Linting (no errors)
- ✅ Type checking (no errors)
- ✅ Build (successful)
- ✅ Tests (all passing)
- ✅ Coverage (≥80%)
- ✅ Security audit (no high/critical vulnerabilities)

### Running Locally

```bash
# Backend
cd src/backend
npm run lint
npm run type-check
npm run build
npm run test:coverage
npm run security:audit

# Frontend
cd src/frontend
npm run lint
npm run type-check
npm run build
npm run test:coverage
npm audit --audit-level=high
```

## Staging Deployment (deploy-staging.yml)

### Triggers
- Push to `develop` branch
- Manual trigger via `workflow_dispatch`

### Workflow

#### 1. Quality Gates
- Verifies CI pipeline passed
- Checks all quality metrics

#### 2. Build & Push Docker Images
- Builds backend and frontend Docker images
- Pushes to GitHub Container Registry (ghcr.io)
- Tags: `staging-latest`, `staging-{sha}`, `develop`
- Uses Docker layer caching for speed

#### 3. Deploy to Staging
- Pulls new Docker images
- Runs database migrations (if any)
- Restarts services with zero-downtime
- **Note**: Deployment steps are infrastructure-specific

#### 4. Health Checks
- Backend API: `https://api-staging.smarterp.com/api/health`
- Frontend: `https://staging.smarterp.com`
- Database: `https://api-staging.smarterp.com/api/health/db`
- Redis: `https://api-staging.smarterp.com/api/health/redis`

#### 5. Notification
- Reports deployment status
- Includes URLs and commit info

### Environment

- **Name**: staging
- **URL**: https://staging.smarterp.com
- **API**: https://api-staging.smarterp.com

## Production Deployment (deploy-production.yml)

### Triggers
- Push to `main` branch
- Manual trigger with confirmation

### Manual Deployment

```bash
# Via GitHub UI:
# 1. Go to Actions → Deploy to Production
# 2. Click "Run workflow"
# 3. Type "deploy" in confirmation field
# 4. Click "Run workflow"
```

### Workflow

#### 1. Quality Gates
- Verifies CI pipeline passed
- Checks staging is healthy
- All quality metrics must pass

#### 2. Validate Input (Manual Trigger Only)
- Requires typing "deploy" to confirm
- Prevents accidental deployments

#### 3. Build & Push Docker Images
- Builds backend and frontend Docker images
- Pushes to GitHub Container Registry
- Tags: `production-latest`, `latest`, `prod-{sha}`, `main`

#### 4. Pre-Deployment
- Creates backup (database, files, config)
- Verifies backup integrity

#### 5. Deploy to Production
- Pulls new Docker images
- Runs database migrations (if any)
- Restarts services with zero-downtime
- **Note**: Deployment steps are infrastructure-specific

#### 6. Smoke Tests
- Backend API: `https://api.smarterp.com/api/health`
- Frontend: `https://app.smarterp.com`
- Database: `https://api.smarterp.com/api/health/db`
- Redis: `https://api.smarterp.com/api/health/redis`
- Memory: `https://api.smarterp.com/api/health/memory`

#### 7. Monitor Deployment
- Polls health endpoints every 30s for 5 minutes
- Checks error rates (Sentry integration)
- Checks performance metrics

#### 8. Create GitHub Release
- Generates release notes from commits
- Tags release as `v{run_number}`
- Includes deployment info and URLs

#### 9. Notification
- Reports deployment status
- Includes all URLs and metrics

### Environment

- **Name**: production
- **URL**: https://app.smarterp.com
- **API**: https://api.smarterp.com

### Rollback

If deployment fails:

```bash
# 1. Via GitHub UI:
# Go to Actions → Deploy to Production → Previous successful run → Re-run jobs

# 2. Via Docker:
# SSH to production server
docker pull ghcr.io/your-org/smart-erp-backend:prod-{previous-sha}
docker pull ghcr.io/your-org/smart-erp-frontend:prod-{previous-sha}
docker-compose up -d

# 3. Via Kubernetes:
kubectl rollout undo deployment/backend
kubectl rollout undo deployment/frontend
```

## Secrets Configuration

Required GitHub Secrets:

```bash
# Container Registry
GITHUB_TOKEN                 # Auto-provided by GitHub

# Code Coverage
CODECOV_TOKEN               # From codecov.io

# Monitoring (Optional)
VITE_SENTRY_DSN            # Frontend Sentry DSN
VITE_GA4_MEASUREMENT_ID    # Google Analytics 4

# Notifications (Optional)
SLACK_WEBHOOK_URL          # Slack notifications
```

### Setting Secrets

```bash
# Via GitHub UI:
# Settings → Secrets and variables → Actions → New repository secret

# Via GitHub CLI:
gh secret set CODECOV_TOKEN
gh secret set VITE_SENTRY_DSN
```

## Performance Optimization

### Docker Layer Caching

```yaml
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### npm Cache

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
    cache-dependency-path: src/backend/package-lock.json
```

### Parallel Jobs

- Backend and frontend jobs run in parallel
- Reduces total pipeline time by ~50%

## Troubleshooting

### CI Pipeline Fails

**Linting errors:**
```bash
npm run lint -- --fix
git add .
git commit -m "fix: linting errors"
```

**Type errors:**
```bash
npm run type-check
# Fix errors in code
```

**Test failures:**
```bash
npm test
# Fix failing tests
npm run test:coverage
```

**Coverage below 80%:**
```bash
npm run test:coverage
# Add more tests to increase coverage
```

### Deployment Fails

**Health check fails:**
```bash
# Check logs
docker logs backend
docker logs frontend

# Check health endpoints manually
curl https://api-staging.smarterp.com/api/health
```

**Docker build fails:**
```bash
# Build locally to debug
cd src/backend
docker build -t backend:test .

cd src/frontend
docker build -t frontend:test .
```

## Best Practices

### 1. Always Run CI Locally First

```bash
# Before pushing:
npm run lint
npm run type-check
npm run test:coverage
npm run build
```

### 2. Use Feature Branches

```bash
git checkout -b feature/new-feature
# Make changes
git push origin feature/new-feature
# Create PR to develop
```

### 3. Test in Staging First

- Always deploy to staging before production
- Verify all features work in staging
- Run manual tests in staging

### 4. Monitor After Deployment

- Check health endpoints
- Monitor error rates in Sentry
- Check performance metrics
- Review logs for errors

### 5. Keep Dependencies Updated

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Audit security
npm audit
npm audit fix
```

## Pipeline Metrics

### Target Metrics

- **CI Pipeline**: < 10 minutes
- **Staging Deployment**: < 5 minutes
- **Production Deployment**: < 10 minutes
- **Test Coverage**: ≥ 80%
- **Build Success Rate**: ≥ 95%

### Monitoring

- GitHub Actions dashboard
- Codecov for coverage trends
- Sentry for error rates
- Custom metrics in monitoring tools

## Support

For issues with CI/CD:

1. Check GitHub Actions logs
2. Review this guide
3. Check infrastructure documentation
4. Contact DevOps team

---

**Last Updated**: 2024
**Maintained By**: DevOps Team
