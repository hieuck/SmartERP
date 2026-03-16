# GitHub Actions Workflows

## Workflows

### ci.yml - Continuous Integration
- Runs on push/PR to main/develop
- Parallel backend & frontend jobs
- Uses reusable workflows
- Concurrency control enabled

### deploy-staging.yml - Staging Deployment
- Triggers on push to develop
- Runs CI first (quality gates)
- Builds & pushes Docker images
- Health checks after deployment

### deploy-production.yml - Production Deployment  
- Triggers on push to main or manual
- Requires "deploy" confirmation
- Creates GitHub releases
- Extended health monitoring

## Reusable Workflows

- **reusable-lint.yml** - ESLint + TypeScript check
- **reusable-test.yml** - Tests with PostgreSQL/Redis
- **reusable-build.yml** - Build + artifact upload

## Key Features

- ✅ Concurrency control (cancel outdated runs)
- ✅ Caching (npm, node_modules, Docker layers)
- ✅ Parallel execution
- ✅ 70% less code duplication
- ✅ Reusable workflows

## Secrets Required

- `CODECOV_TOKEN` (optional)
- `VITE_SENTRY_DSN`
- `VITE_GA4_MEASUREMENT_ID`
- `GITHUB_TOKEN` (auto-provided)

## Usage

**Staging:**
```bash
git push origin develop
```

**Production:**
```bash
git push origin main
# Or manual trigger with "deploy" confirmation
```

## Monitoring

- Staging: https://staging.smarterp.com
- Production: https://app.smarterp.com
- Health: https://api.smarterp.com/api/health
