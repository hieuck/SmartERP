# Smart-ERP Frontend Authentication - Implementation Fixes

**Status:** Ready for Implementation  
**Priority:** CRITICAL  
**Date:** March 2026

---

## Overview

This document provides detailed code examples for fixing all critical and high-priority authentication issues identified in the code review.

---

## CRITICAL FIXES (7)

### 1. Token Refresh Mechanism
**File:** `src/frontend/src/services/api/client.ts`

Implement token refresh queue pattern to retry failed requests with refreshed token before logging out.

**Key Points:**
- Queue failed requests while refreshing
- Retry original request with new token
- Only refresh once (prevent multiple refresh calls)
- Clear tokens and logout if refresh fails

### 2. Secure Token Storage
**File:** `src/frontend/src/store/slices/authSlice.ts`

Move tokens from localStorage to secure storage:
- Access token: Store in Redux (memory only)
- Refresh token: Store in HttpOnly cookie (backend sets)

**Key Points:**
- Don't store tokens in localStorage
- Use HttpOnly, Secure, SameSite cookies
- Backend must set cookies with proper flags

### 3. CSRF Protection
**File:** `src/frontend/src/services/api/client.ts`

Add CSRF token to request headers and implement double-submit cookie pattern.

**Key Points:**
- Extract CSRF token from meta tag
- Add to X-CSRF-Token header
- Backend validates token on state-changing requests

### 4. Input Sanitization
**File:** `src/frontend/src/pages/auth/LoginPage.tsx`

Sanitize user input before sending to API using DOMPurify.

**Key Points:**
- Sanitize email input
- Trim and lowercase email
- Don't sanitize password
- Install: `npm install dompurify @types/dompurify`

### 5. Error Boundary
**File:** `src/frontend/src/components/ErrorBoundary.tsx`

Create error boundary component to catch and display errors gracefully.

**Key Points:**
- Catch unhandled errors
- Display fallback UI
- Log errors to tracking service
- Allow user to retry

### 6. Session Timeout
**File:** `src/frontend/src/hooks/useSessionTimeout.ts`

Implement automatic logout after 30 minutes of inactivity.

**Key Points:**
- Track user activity (mouse, keyboard, scroll, touch)
- Reset timeout on activity
- Logout and redirect to login on timeout
- Use in App.tsx

### 7. Rate Limiting
**File:** `src/frontend/src/hooks/useRateLimit.ts`

Implement client-side rate limiting (5 attempts per 60 seconds).

**Key Points:**
- Track login attempts
- Prevent requests when limit exceeded
- Show remaining time
- Disable button when limited

---

## HIGH-PRIORITY FIXES (8)

### 8. Redirect After Login
Preserve intended destination after login using location.state.

### 9. Loading States
Add visual feedback during form submission (opacity, cursor).

### 10. Remember Me
Store email in localStorage when checkbox checked, load on mount.

### 11. Logout Confirmation
Add Modal.confirm before logout to prevent accidental logout.

### 12. Password Strength
Show password strength indicator (0-5 levels) with Progress component.

### 13. Two-Factor Authentication
Create TwoFactorPage for OTP verification after login.

### 14. Account Lockout
Handle 423 status code and display appropriate message.

### 15. Email Verification
Create EmailVerificationPage with code verification and resend.

---

## Implementation Order

1. **Day 1:** Fixes 1-3 (Token refresh, storage, CSRF)
2. **Day 2:** Fixes 4-7 (Sanitization, error boundary, timeout, rate limit)
3. **Day 3:** Fixes 8-15 (UX improvements, 2FA, email verification)

---

## Testing Strategy

- Unit tests for each hook
- Integration tests for auth flow
- E2E tests for complete login/logout
- Security tests for token refresh
- Performance tests for rate limiting

---

## Deployment

1. Implement all critical fixes
2. Run full test suite
3. Security audit
4. Staging deployment
5. Production deployment

---

**Implementation Guide:** March 2026  
**Status:** READY FOR DEVELOPMENT

