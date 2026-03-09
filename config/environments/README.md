# Environment Configuration

**Version:** 1.0  
**Last Updated:** 2026-03-09  
**Owner:** DevOps Engineer

---

## 📋 Quick Start

### Development Setup

```bash
# 1. Copy template
cp config/environments/.env.development.template .env

# 2. Fill in values (optional for dev)
nano .env

# 3. Start application
npm run dev
```

### Staging Setup

```bash
# 1. Copy template
cp config/environments/.env.staging.template .env.staging

# 2. Fill in values (required!)
nano .env.staging

# 3. Deploy to staging
npm run deploy:staging
```

### Production Setup

```bash
# 1. Copy template
cp config/environments/.env.production.template .env.production

# 2. Fill in ALL values (CRITICAL!)
nano .env.production

# 3. Validate configuration
npm run config:validate

# 4. Deploy to production (requires approval)
npm run deploy:production
```

---

## 📁 File Structure

```
config/environments/
├── development.ts              # Development config
├── staging.ts                  # Staging config
├── production.ts               # Production config
├── index.ts                    # Config loader
├── validator.ts                # Config validator
├── .env.development.template   # Dev template
├── .env.staging.template       # Staging template
├── .env.production.template    # Production template
└── README.md                   # This file
```

---

## 🔧 Configuration Sections

### 1. Application

```typescript
app: {
  name: string; // Application name
  environment: string; // Environment name
  port: number; // Server port
  url: string; // Public URL
  debug: boolean; // Debug mode
}
```

### 2. Database

```typescript
database: {
  type: 'postgres'; // Database type
  host: string; // Database host
  port: number; // Database port
  username: string; // Database user
  password: string; // Database password
  database: string; // Database name
  synchronize: boolean; // Auto-sync schema (dev only!)
  logging: boolean; // Query logging
  ssl: boolean | object; // SSL configuration
  poolSize: number; // Connection pool size
}
```

### 3. Redis

```typescript
redis: {
  host: string;          // Redis host
  port: number;          // Redis port
  password?: string;     // Redis password (required in prod)
  db: number;            // Redis database number
  ttl: number;           // Default TTL in seconds
}
```

### 4. JWT

```typescript
jwt: {
  secret: string; // JWT secret (min 32 chars)
  expiresIn: string; // Token expiration
  refreshSecret: string; // Refresh token secret
  refreshExpiresIn: string; // Refresh token expiration
}
```

### 5. Email

```typescript
email: {
  host: string; // SMTP host
  port: number; // SMTP port
  secure: boolean; // Use TLS
  auth: {
    user: string; // SMTP username
    pass: string; // SMTP password
  }
  from: string; // From address
}
```

### 6. Storage

```typescript
storage: {
  type: 'local' | 'cloud';     // Storage type
  path?: string;               // Local path (if local)
  bucket?: string;             // S3 bucket (if cloud)
  region?: string;             // AWS region (if cloud)
  accessKeyId?: string;        // AWS key (if cloud)
  secretAccessKey?: string;    // AWS secret (if cloud)
}
```

### 7. Security

```typescript
security: {
  bcryptRounds: number; // Password hashing rounds
  sessionSecret: string; // Session secret
  corsOrigin: string; // CORS allowed origins
  rateLimiting: {
    enabled: boolean; // Enable rate limiting
    ttl: number; // Time window (seconds)
    max: number; // Max requests per window
  }
  csrf: {
    enabled: boolean; // Enable CSRF protection
  }
}
```

### 8. Features

```typescript
features: {
  enable2FA: boolean; // Two-factor authentication
  enableEmailVerification: boolean; // Email verification
  enableAuditLog: boolean; // Audit logging
  enableMetrics: boolean; // Metrics collection
}
```

### 9. Monitoring

```typescript
monitoring: {
  enabled: boolean;          // Enable monitoring
  sentryDsn?: string;       // Sentry DSN
}
```

---

## 🔒 Security Guidelines

### Secret Generation

```bash
# JWT secrets (48 characters)
openssl rand -base64 48

# Session secrets (48 characters)
openssl rand -base64 48

# Encryption keys (32 characters)
openssl rand -base64 32

# Database passwords (20+ characters)
openssl rand -base64 24
```

### Secret Requirements

| Secret Type    | Min Length | Rotation Period |
| -------------- | ---------- | --------------- |
| JWT Secret     | 48 chars   | 90 days         |
| Session Secret | 48 chars   | 90 days         |
| DB Password    | 20 chars   | 90 days         |
| API Keys       | 32 chars   | 180 days        |
| Encryption Key | 32 chars   | 365 days        |

### Never Commit Secrets

```bash
# Add to .gitignore
.env
.env.local
.env.production
.env.staging
*.key
*.pem
secrets/
```

---

## ✅ Validation

### Automatic Validation

Configuration is automatically validated on application startup:

```typescript
import { config } from '@/config/environments';
// Validation happens here ↑
// App won't start if validation fails
```

### Manual Validation

```bash
# Validate current configuration
npm run config:validate

# Check for missing environment variables
npm run config:check-env

# Test configuration loading
npm run config:test
```

### Validation Rules

**Development:**

- ✅ Basic field validation
- ✅ Format validation
- ⚠️ Weak secrets allowed

**Staging:**

- ✅ All development rules
- ✅ Medium security requirements
- ✅ SSL recommended
- ⚠️ Sandbox APIs allowed

**Production:**

- ✅ All staging rules
- ✅ Strict security requirements
- ✅ SSL required
- ✅ Strong secrets required (48+ chars)
- ✅ Production APIs only
- ✅ Monitoring required

---

## 🚀 Usage in Code

### Import Configuration

```typescript
import { config } from '@/config/environments';

// Access configuration
const dbHost = config.database.host;
const jwtSecret = config.jwt.secret;
const isProduction = config.app.environment === 'production';
```

### Type Safety

```typescript
import { ConfigType } from '@/config/environments';

// Use ConfigType for type checking
function initializeApp(config: ConfigType) {
  // TypeScript ensures config has all required fields
}
```

### Environment Detection

```typescript
import { config } from '@/config/environments';

if (config.app.environment === 'production') {
  // Production-specific logic
} else if (config.app.environment === 'staging') {
  // Staging-specific logic
} else {
  // Development-specific logic
}
```

---

## 🔧 Troubleshooting

### Config Validation Fails

**Error:**

```
❌ Configuration validation failed:
  - jwt.secret must be at least 32 characters long
```

**Solution:**

```bash
# Generate new secret
openssl rand -base64 48

# Update .env
JWT_SECRET=<paste-generated-secret>
```

### Missing Environment Variables

**Error:**

```
❌ Environment variable DB_PASSWORD is required in production
```

**Solution:**

```bash
# Check if variable is set
echo $DB_PASSWORD

# Set variable
export DB_PASSWORD=<your-password>

# Or add to .env file
echo "DB_PASSWORD=<your-password>" >> .env
```

### Database Connection Fails

**Error:**

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

```bash
# Check database is running
docker ps | grep postgres

# Check connection details
echo $DB_HOST
echo $DB_PORT

# Test connection
psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME
```

---

## 📚 Related Documentation

- **Deployment Guide:** `docs/deployment/config-management.md`
- **Security Guidelines:** `TECH-LEAD-FINAL-DECISION-2026-03-09-SECURITY-FIRST.md`
- **Infrastructure Requirements:** `DEVOPS-INFRASTRUCTURE-REQUIREMENTS-2026-03-09.md`

---

## 🎯 Best Practices

1. ✅ **Never commit secrets** - Use .gitignore
2. ✅ **Use strong secrets** - Minimum 48 characters
3. ✅ **Rotate secrets regularly** - Every 90 days
4. ✅ **Validate before deploy** - Run config:validate
5. ✅ **Use environment-specific configs** - Don't mix environments
6. ✅ **Document changes** - Update this README
7. ✅ **Test in staging first** - Never test in production

---

**Created:** 2026-03-09  
**Created By:** DevOps Engineer  
**Status:** ✅ Active
