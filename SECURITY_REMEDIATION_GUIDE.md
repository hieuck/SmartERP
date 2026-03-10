# Security Remediation Guide: Authentication System
**Priority:** CRITICAL  
**Target Completion:** Before Production Deployment

---

## 1. Remove Hardcoded Demo Credentials

### Current Issue
Demo credentials are hardcoded in the LoginPage component, visible to all users.

### Solution

**File:** `smart-erp/src/frontend/src/pages/auth/LoginPage.tsx`

Replace the demo credentials card with environment-based configuration:

```typescript
// Add at top of file
const SHOW_DEMO_CREDENTIALS = process.env.REACT_APP_SHOW_DEMO === 'true';
const DEMO_EMAIL = process.env.REACT_APP_DEMO_EMAIL || '';
const DEMO_PASSWORD = process.env.REACT_APP_DEMO_PASSWORD || '';

// Replace the demo card section (around line 115)
{SHOW_DEMO_CREDENTIALS && DEMO_EMAIL && (
  <Card style={{ marginTop: 24, borderRadius: 16, background: '#f6f8fa' }}>
    <Alert
      message="Demo Account"
      description="This is a limited demo account for testing purposes only"
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
    />
    <Title level={5} style={{ marginBottom: 16 }}>Tài khoản demo:</Title>
    <Space direction="vertical" size="small">
      <Text>📧 Email: {DEMO_EMAIL}</Text>
      <Text>🔑 Password: (provided separately)</Text>
    </Space>
  </Card>
)}
```

**Environment Configuration:**

Create `.env.development`:
```
REACT_APP_SHOW_DEMO=true
REACT_APP_DEMO_EMAIL=demo@test.com
```

Create `.env.production`:
```
REACT_APP_SHOW_DEMO=false
```

---

## 2. Implement HTTPS/TLS Enforcement

### Current Issue
No HTTPS enforcement in backend configuration.

### Solution

**File:** `smart-erp/src/backend/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import * as helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
  }));

  // ✅ Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(301, `https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }

  // ✅ Enable CORS with secure settings
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
```

---

## 3. Implement Comprehensive Subdomain Validation

### Current Issue
Insufficient subdomain validation allows reserved words and invalid formats.

### Solution

**File:** `smart-erp/src/frontend/src/pages/public/RegisterPage.tsx`

```typescript
// Add validation utilities
const RESERVED_SUBDOMAINS = [
  'admin', 'api', 'www', 'mail', 'ftp', 'smtp', 'pop', 'imap',
  'test', 'staging', 'dev', 'development', 'production', 'backup',
  'cdn', 'dashboard', 'app', 'auth', 'login', 'register', 'help',
  'support', 'docs', 'blog', 'shop', 'store', 'payment', 'billing',
];

const validateSubdomain = (subdomain: string): string | null => {
  subdomain = subdomain.trim();

  if (subdomain.length < 3) {
    return 'Subdomain must be at least 3 characters';
  }
  if (subdomain.length > 63) {
    return 'Subdomain must not exceed 63 characters';
  }

  if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
    return `Subdomain "${subdomain}" is reserved`;
  }

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
    return 'Invalid subdomain format';
  }

  if (subdomain.includes('--')) {
    return 'Subdomain cannot contain consecutive hyphens';
  }

  return null;
};
```

---

## 4. Implement CSRF Protection

### Current Issue
No CSRF token validation on state-changing operations.

### Solution

Install dependency:
```bash
npm install @nestjs/csrf
```

Add to auth controller:
```typescript
import { CsrfGuard } from '@nestjs/csrf';

@UseGuards(CsrfGuard)
@Post('login')
async login(@Request() req) {
  return this.authService.login(req.user);
}
```

---

## 5. Enforce Email Verification

### Current Issue
Users can access system without verifying email.

### Solution

```typescript
async login(user: Omit<UserEntity, 'password'>) {
  if (!user.emailVerified) {
    throw new ForbiddenException(
      'Please verify your email before logging in.'
    );
  }
  // ... rest of login logic
}
```

---

## 6. Implement Account Lockout

### Current Issue
No account lockout after failed login attempts.

### Solution

```typescript
private async trackFailedAttempt(email: string): Promise<void> {
  const key = `failed-attempts:${email}`;
  const attempts = (await this.cacheService.get(key)) || 0;
  const newAttempts = attempts + 1;

  if (newAttempts >= 5) {
    await this.cacheService.set(`account-lock:${email}`, true, 15 * 60);
  }

  await this.cacheService.set(key, newAttempts, 60 * 60);
}
```

---

## 7. Add Audit Logging

### Current Issue
No logging of authentication events.

### Solution

Create audit service and log all auth events:
- LOGIN_SUCCESS
- LOGIN_FAILED_USER_NOT_FOUND
- LOGIN_FAILED_INVALID_PASSWORD
- ACCOUNT_LOCKED
- TENANT_REGISTRATION
- PASSWORD_RESET

---

## 8. Configure Secure Cookies

### Current Issue
No secure cookie configuration.

### Solution

```typescript
res.cookie('accessToken', result.token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000,
  path: '/',
});
```

---

## Testing Checklist

- [ ] Demo credentials not visible in production
- [ ] HTTPS enforced
- [ ] Subdomain validation works
- [ ] CSRF protection active
- [ ] Email verification enforced
- [ ] Account lockout works
- [ ] Audit logs created
- [ ] Cookies are secure
- [ ] Security headers present
- [ ] Rate limiting works

---

## Deployment Checklist

- [ ] All critical vulnerabilities fixed
- [ ] Security tests passing
- [ ] HTTPS certificate installed
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Monitoring configured
- [ ] Incident response plan documented

---

**Status:** Ready for Implementation  
**Estimated Effort:** 2-3 sprints  
**Priority:** CRITICAL
