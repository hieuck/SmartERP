# Production Config Management Guide

**Version:** 1.0  
**Last Updated:** 2026-03-09  
**Owner:** DevOps Engineer  
**Status:** ✅ Active

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Environment Structure](#environment-structure)
3. [Configuration Files](#configuration-files)
4. [Security Best Practices](#security-best-practices)
5. [Deployment Process](#deployment-process)
6. [Validation](#validation)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

SmartERP uses environment-specific configuration files to manage settings across different deployment environments. This approach ensures:

- ✅ **Separation of concerns** - Each environment has its own config
- ✅ **Type safety** - TypeScript configs with validation
- ✅ **Security** - Secrets never committed to git
- ✅ **Validation** - Automatic validation before deployment
- ✅ **Documentation** - Clear documentation for each setting

---

## 🏗️ Environment Structure

### Environments

| Environment     | Purpose                | Security Level | Auto-Deploy        |
| --------------- | ---------------------- | -------------- | ------------------ |
| **Development** | Local development      | Low            | N/A                |
| **Staging**     | Pre-production testing | Medium         | ✅ Yes             |
| **Production**  | Live system            | High           | ❌ Manual approval |

### Configuration Hierarchy

```
config/environments/
├── development.ts      # Development config
├── staging.ts          # Staging config
├── production.ts       # Production config
├── index.ts            # Config loader
├── validator.ts        # Config validator
├── .env.development.template
├── .env.staging.template
└── .env.production.template
```

---

## 📁 Configuration Files

### 1. TypeScript Config Files

**Location:** `config/environments/{environment}.ts`

**Purpose:** Define typed configuration objects

**Example:**

```typescript
// config/environments/production.ts
export const productionConfig: ConfigType = {
  app: {
    name: 'SmartERP',
    environment: 'production',
    port: parseInt(process.env.PORT || '3000', 10),
    url: process.env.APP_URL!,
  },
  database: {
    host: process.env.DB_HOST!,
    // ... more config
  },
  // ... more sections
};
```

**Key Features:**

- Type-safe configuration
- Environment variable mapping
- Default values for non-critical settings
- Required fields marked with `!` operator

### 2. Environment Variable Templates

**Location:** `config/environments/.env.{environment}.template`

**Purpose:** Document required environment variables

**Usage:**

```bash
# For development
cp config/environments/.env.development.template .env

# For staging
cp config/environments/.env.staging.template .env.staging

# For production
cp config/environments/.env.production.template .env.production
```

### 3. Config Loader

**Location:** `config/environments/index.ts`

**Purpose:** Load and validate configuration

**Usage in code:**

```typescript
import { config } from '@/config/environments';

// Access configuration
console.log(config.app.name);
console.log(config.database.host);
```

### 4. Config Validator

**Location:** `config/environments/validator.ts`

**Purpose:** Validate configuration before app starts

**Validation Rules:**

- **Common:** Required fields, format validation
- **Production:** Strict security requirements
- **Staging:** Medium security requirements

---

## 🔒 Security Best Practices

### 1. Secret Management

#### ❌ NEVER DO THIS:

```typescript
// DON'T hardcode secrets
const JWT_SECRET = 'my-secret-key';

// DON'T commit .env files
git add .env.production  // ❌ WRONG!
```

#### ✅ DO THIS:

```typescript
// Use environment variables
const JWT_SECRET = process.env.JWT_SECRET!;

// Add to .gitignore
.env
.env.production
.env.staging
.env.local
```

### 2. Generate Strong Secrets

**For JWT secrets, session secrets, encryption keys:**

```bash
# Generate 48-character random string
openssl rand -base64 48

# Generate 32-character random string
openssl rand -base64 32

# Generate UUID
uuidgen
```

**Requirements:**

- JWT secrets: Minimum 48 characters
- Session secrets: Minimum 48 characters
- Encryption keys: Exactly 32 characters
- Database passwords: Minimum 20 characters

### 3. Secret Storage

#### Development

- Store in `.env` file (gitignored)
- Use weak secrets for convenience

#### Staging/Production

**Option 1: Environment Variables (Kubernetes)**

```yaml
# kubernetes/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: smarterp-secrets
type: Opaque
data:
  jwt-secret: <base64-encoded-secret>
  db-password: <base64-encoded-password>
```

**Option 2: External Secrets Operator**

```yaml
# kubernetes/external-secret.yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: smarterp-secrets
spec:
  secretStoreRef:
    name: aws-secrets-manager
  target:
    name: smarterp-secrets
  data:
    - secretKey: jwt-secret
      remoteRef:
        key: smarterp/production/jwt-secret
```

**Option 3: HashiCorp Vault**

```bash
# Store secret in Vault
vault kv put secret/smarterp/production \
  jwt_secret="..." \
  db_password="..."

# Retrieve in deployment
vault kv get -field=jwt_secret secret/smarterp/production
```

### 4. Secret Rotation

**Schedule:**

- JWT secrets: Every 90 days
- Database passwords: Every 90 days
- API keys: Every 180 days
- Encryption keys: Every 365 days

**Process:**

1. Generate new secret
2. Update in secret store
3. Deploy with new secret
4. Verify application works
5. Revoke old secret

### 5. Access Control

**Who can access production secrets:**

- ✅ DevOps Engineer (full access)
- ✅ Tech Lead (read-only, emergency)
- ❌ Developers (no access)
- ❌ QA (no access)

**Audit logging:**

- Log all secret access
- Alert on unauthorized access
- Review logs monthly

---

## 🚀 Deployment Process

### Development Deployment

**Target:** Local machine

**Steps:**

```bash
# 1. Copy environment template
cp config/environments/.env.development.template .env

# 2. Fill in values (use weak secrets for dev)
nano .env

# 3. Start application
npm run dev
```

**Validation:** Automatic on startup

### Staging Deployment

**Target:** Staging Kubernetes cluster

**Steps:**

```bash
# 1. Prepare secrets
kubectl create secret generic smarterp-secrets \
  --from-env-file=.env.staging \
  --namespace=staging

# 2. Deploy application
helm upgrade --install smarterp ./charts/smarterp \
  --namespace=staging \
  --values=charts/smarterp/values-staging.yaml

# 3. Verify deployment
kubectl get pods -n staging
kubectl logs -f deployment/smarterp-backend -n staging

# 4. Run smoke tests
npm run test:smoke -- --env=staging
```

**Validation:**

- Automatic config validation on startup
- Smoke tests must pass
- QA approval required

### Production Deployment

**Target:** Production Kubernetes cluster

**Steps:**

```bash
# 1. Verify staging deployment
# Ensure staging is stable for 24+ hours

# 2. Prepare production secrets (use secret manager)
# Store secrets in AWS Secrets Manager / Vault

# 3. Create deployment PR
git checkout -b deploy/production-v1.2.3
# Update version, changelog
git push origin deploy/production-v1.2.3

# 4. Get approvals
# Required: Tech Lead + PM approval

# 5. Deploy to production
helm upgrade --install smarterp ./charts/smarterp \
  --namespace=production \
  --values=charts/smarterp/values-production.yaml

# 6. Monitor deployment
kubectl rollout status deployment/smarterp-backend -n production
kubectl get pods -n production

# 7. Run production smoke tests
npm run test:smoke -- --env=production

# 8. Monitor metrics
# Check Grafana dashboards for 1 hour
# Watch error rates, response times, resource usage

# 9. Notify stakeholders
# Send deployment notification to #smarterp-deployments
```

**Validation:**

- ✅ Config validation passes
- ✅ Smoke tests pass
- ✅ No errors in logs (15 minutes)
- ✅ Metrics within normal range
- ✅ Tech Lead approval
- ✅ PM approval

**Rollback Plan:**

```bash
# If deployment fails, rollback immediately
helm rollback smarterp -n production

# Verify rollback
kubectl get pods -n production
kubectl logs -f deployment/smarterp-backend -n production

# Notify team
# Post incident report in #smarterp-alerts
```

---

## ✅ Validation

### Automatic Validation

**When:** Application startup

**What:** Config validator checks:

- ✅ Required fields present
- ✅ Field formats valid
- ✅ Security requirements met
- ✅ Environment-specific rules

**Example output:**

```
✅ Configuration loaded for environment: production
✅ All validation checks passed
🚀 SmartERP starting...
```

**Failure example:**

```
❌ Configuration validation failed:
  - jwt.secret must be at least 32 characters long
  - database.ssl must be enabled in production
  - security.corsOrigin must not be "*" in production
Error: Invalid configuration. Please check your environment variables.
```

### Manual Validation

**Before deployment:**

```bash
# Validate configuration
npm run config:validate

# Check for missing environment variables
npm run config:check-env

# Test configuration loading
npm run config:test
```

### Validation Checklist

**Before Production Deployment:**

- [ ] All required environment variables set
- [ ] Secrets are strong (48+ characters)
- [ ] Database SSL enabled
- [ ] CORS origin is specific (not "\*")
- [ ] Rate limiting enabled
- [ ] CSRF protection enabled
- [ ] 2FA enabled
- [ ] Email verification enabled
- [ ] Monitoring enabled (Sentry)
- [ ] Backup enabled
- [ ] Payment gateways use production endpoints
- [ ] Shipping providers use production endpoints

---

## 🔧 Troubleshooting

### Issue 1: Config Validation Fails

**Symptom:**

```
❌ Configuration validation failed:
  - jwt.secret is required
```

**Solution:**

```bash
# Check if environment variable is set
echo $JWT_SECRET

# If not set, add to .env file
echo "JWT_SECRET=$(openssl rand -base64 48)" >> .env

# Restart application
npm run dev
```

### Issue 2: Database Connection Fails

**Symptom:**

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

```bash
# Check database is running
docker ps | grep postgres

# Check database config
echo $DB_HOST
echo $DB_PORT
echo $DB_USERNAME

# Test connection
psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE
```

### Issue 3: Redis Connection Fails

**Symptom:**

```
Error: Redis connection to localhost:6379 failed
```

**Solution:**

```bash
# Check Redis is running
docker ps | grep redis

# Check Redis config
echo $REDIS_HOST
echo $REDIS_PORT

# Test connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
```

### Issue 4: JWT Secret Too Short

**Symptom:**

```
❌ jwt.secret must be at least 32 characters long
```

**Solution:**

```bash
# Generate new strong secret
openssl rand -base64 48

# Update .env file
JWT_SECRET=<paste-generated-secret>

# Restart application
```

### Issue 5: CORS Error in Production

**Symptom:**

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**

```bash
# Check CORS_ORIGIN is set correctly
echo $CORS_ORIGIN

# Should be specific domain(s), not "*"
CORS_ORIGIN=https://erp.yourdomain.com,https://www.yourdomain.com

# Restart application
```

### Issue 6: Payment Gateway Sandbox in Production

**Symptom:**

```
❌ payment.vnpay.url should not use sandbox in production
```

**Solution:**

```bash
# Update to production endpoint
VNPAY_URL=https://pay.vnpay.vn/paymentv2/vpcpay.html

# Restart application
```

---

## 📊 Monitoring

### Config-Related Metrics

**Track in Grafana:**

- Config validation failures
- Missing environment variables
- Secret rotation age
- Config reload events

**Alerts:**

- Alert when config validation fails
- Alert when secrets are >80 days old
- Alert when using default/weak secrets

---

## 🔄 Maintenance

### Monthly Tasks

- [ ] Review secret rotation schedule
- [ ] Audit secret access logs
- [ ] Update config documentation
- [ ] Review and update validation rules

### Quarterly Tasks

- [ ] Rotate all production secrets
- [ ] Review and update security requirements
- [ ] Test disaster recovery with config restore
- [ ] Update config templates

---

## 📚 Related Documents

- **Infrastructure Requirements:** `DEVOPS-INFRASTRUCTURE-REQUIREMENTS-2026-03-09.md`
- **Security Guidelines:** `TECH-LEAD-FINAL-DECISION-2026-03-09-SECURITY-FIRST.md`
- **Deployment Runbook:** `infrastructure/runbooks/deployment.md`
- **Disaster Recovery:** `infrastructure/disaster-recovery/runbook.md`

---

## ✅ Success Criteria

**Config management is successful when:**

- ✅ All environments have separate configs
- ✅ Validation catches misconfigurations before deployment
- ✅ No secrets committed to git
- ✅ Production uses strong secrets (48+ chars)
- ✅ Config changes are documented
- ✅ Team understands config management process

---

**Document Version:** 1.0  
**Created:** 2026-03-09  
**Created By:** DevOps Engineer  
**Status:** ✅ Active  
**Next Review:** 2026-04-09

**SECURE, VALIDATED, DOCUMENTED! 🔒**
