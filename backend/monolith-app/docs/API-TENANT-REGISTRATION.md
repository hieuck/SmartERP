# Tenant Registration API Documentation

## Overview

This document describes the tenant registration flow for the Smart ERP system. The registration process creates a new tenant (company) with an admin user and sets up a 14-day free trial.

---

## Endpoints

### 1. Register New Tenant

**Endpoint:** `POST /auth/register-tenant`

**Description:** Creates a new tenant (company) with an admin user. Automatically sets up a 14-day free trial.

**Request Body:**

```json
{
  "companyName": "ABC Company Ltd",
  "subdomain": "abc-company",
  "email": "admin@abc.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "0901234567"
}
```

**Field Validation:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| companyName | string | Yes | Not empty |
| subdomain | string | Yes | Lowercase, numbers, hyphens only. Must be unique. |
| email | string | Yes | Valid email format. Must be unique. |
| password | string | Yes | Min 8 chars, must contain uppercase, lowercase, and number |
| firstName | string | No | - |
| lastName | string | No | - |
| phone | string | No | - |

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "ABC Company Ltd",
      "subdomain": "abc-company",
      "plan": "free",
      "trialEndsAt": "2026-03-14T10:30:00.000Z"
    },
    "user": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "email": "admin@abc.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "emailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "emailVerificationToken": "770e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Error Responses:**

**400 Bad Request** - Validation error:
```json
{
  "statusCode": 400,
  "message": [
    "subdomain must contain only lowercase letters, numbers, and hyphens",
    "password must contain at least one uppercase letter, one lowercase letter, and one number"
  ],
  "error": "Bad Request"
}
```

**409 Conflict** - Subdomain already taken:
```json
{
  "statusCode": 409,
  "message": "Subdomain \"abc-company\" is already taken",
  "error": "Conflict"
}
```

**409 Conflict** - Email already exists:
```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

---

### 2. Verify Email

**Endpoint:** `GET /auth/verify-email?token={token}`

**Description:** Verifies user email using the token sent during registration.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| token | string | Yes | Email verification token from registration response |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Email verified successfully",
  "user": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "email": "admin@abc.com",
    "emailVerified": true
  }
}
```

**Already Verified Response (200):**

```json
{
  "success": true,
  "message": "Email already verified"
}
```

**Error Response (400):**

```json
{
  "statusCode": 400,
  "message": "Invalid or expired verification token",
  "error": "Bad Request"
}
```

---

## Complete Registration Flow

### Step-by-Step Process

```
1. User fills registration form
   ↓
2. POST /auth/register-tenant
   ↓
3. System creates:
   - Tenant record
   - Admin user
   - Free trial (14 days)
   ↓
4. System returns:
   - Access token (for immediate login)
   - Refresh token
   - Email verification token
   ↓
5. User receives email with verification link
   ↓
6. User clicks link → GET /auth/verify-email?token=xxx
   ↓
7. Email verified ✓
   ↓
8. User can access full system
```

---

## Example Usage

### Using cURL

**Register Tenant:**

```bash
curl -X POST http://localhost:3000/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Company",
    "subdomain": "test-company",
    "email": "admin@test.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Verify Email:**

```bash
curl -X GET "http://localhost:3000/auth/verify-email?token=770e8400-e29b-41d4-a716-446655440000"
```

### Using JavaScript (Axios)

```javascript
// Register tenant
const registerTenant = async () => {
  try {
    const response = await axios.post('/auth/register-tenant', {
      companyName: 'Test Company',
      subdomain: 'test-company',
      email: 'admin@test.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
    });

    const { accessToken, emailVerificationToken } = response.data.data;
    
    // Store access token
    localStorage.setItem('accessToken', accessToken);
    
    // Send verification email (in production)
    // await sendVerificationEmail(emailVerificationToken);
    
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error.response.data);
    throw error;
  }
};

// Verify email
const verifyEmail = async (token) => {
  try {
    const response = await axios.get(`/auth/verify-email?token=${token}`);
    return response.data;
  } catch (error) {
    console.error('Verification failed:', error.response.data);
    throw error;
  }
};
```

---

## Security Considerations

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Hashed with bcrypt (10 rounds)

### Subdomain Validation

- Only lowercase letters, numbers, and hyphens allowed
- Must be unique across all tenants
- Used as tenant identifier

### Email Verification

- Token is UUID v4 (cryptographically secure)
- Token stored in database
- Token cleared after verification
- No expiration (can be added if needed)

### Transaction Safety

- Tenant and user creation in single transaction
- Automatic rollback on any error
- No partial registrations possible

---

## Trial Configuration

### Default Trial Settings

| Setting | Value |
|---------|-------|
| Duration | 14 days |
| Plan | Free |
| Max Users | 5 |
| Max Storage | 1 GB |
| Features | ['basic'] |

### After Trial Expires

- User can upgrade to paid plan
- System shows upgrade prompt
- Access may be restricted (configurable)

---

## Testing

### Unit Tests

```bash
npm test -- auth.service.spec.ts
```

**Coverage:**
- ✅ Successful registration
- ✅ Duplicate subdomain error
- ✅ Duplicate email error
- ✅ Transaction rollback
- ✅ Email verification
- ✅ Invalid token error
- ✅ Already verified scenario

### Integration Tests

```bash
npm test -- tenant-registration-flow.spec.ts
```

**Coverage:**
- ✅ Complete registration flow
- ✅ Email verification flow
- ✅ Login after registration
- ✅ Tenant isolation
- ✅ Validation errors

---

## Troubleshooting

### Common Issues

**Issue:** "Subdomain already taken"
- **Solution:** Choose a different subdomain

**Issue:** "Email already exists"
- **Solution:** Use a different email or login with existing account

**Issue:** "Invalid verification token"
- **Solution:** Request new verification email (feature to be implemented)

**Issue:** "Password too weak"
- **Solution:** Ensure password meets requirements (8+ chars, uppercase, lowercase, number)

---

## Future Enhancements

### Planned Features

1. **Email Service Integration**
   - SendGrid or AWS SES
   - Automated verification emails
   - Welcome emails

2. **Token Expiration**
   - Add expiration time to verification tokens
   - Resend verification email endpoint

3. **Social Login**
   - Google OAuth
   - Microsoft OAuth
   - GitHub OAuth

4. **Phone Verification**
   - SMS verification
   - Two-factor authentication

5. **Custom Domains**
   - Allow custom domain mapping
   - SSL certificate management

---

## API Versioning

Current version: **v1**

Base URL: `http://localhost:3000` (development)

Production URL: `https://api.smarterp.vn` (to be configured)

---

## Support

For issues or questions:
- Email: support@smarterp.vn
- Documentation: https://docs.smarterp.vn
- GitHub Issues: https://github.com/smarterp/issues

---

**Last Updated:** 2026-02-28  
**Version:** 1.0.0  
**Status:** Production Ready
