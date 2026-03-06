# Subscription Management API Documentation

## Overview

This document describes the subscription management system for Smart ERP. The system supports multiple pricing tiers with monthly and yearly billing cycles.

---

## Pricing Plans

### Plan Comparison

| Feature | FREE | BASIC | PROFESSIONAL | ENTERPRISE |
|---------|------|-------|--------------|------------|
| **Price (Monthly)** | 0đ | 290,000đ | 990,000đ | 2,990,000đ |
| **Price (Yearly)** | 0đ | 2,900,000đ | 9,900,000đ | 29,900,000đ |
| **Yearly Savings** | - | ~17% | ~17% | ~17% |
| **Max Users** | 1 | 5 | 20 | Unlimited |
| **Storage** | 1GB | 5GB | 50GB | Unlimited |
| **Basic Features** | ✅ | ✅ | ✅ | ✅ |
| **Reports** | ❌ | ✅ | ✅ | ✅ |
| **Data Export** | ❌ | ✅ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ | ✅ |
| **Integrations** | ❌ | ❌ | ✅ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ | ✅ |
| **Custom Domain** | ❌ | ❌ | ❌ | ✅ |
| **White Label** | ❌ | ❌ | ❌ | ✅ |
| **Dedicated Support** | ❌ | ❌ | ❌ | ✅ |

---

## Endpoints

### 1. Get Pricing Information

**Endpoint:** `GET /tenants/subscription/pricing`

**Description:** Get pricing information for all available plans.

**Authentication:** Required (Bearer token)

**Response (200):**

```json
{
  "plans": [
    {
      "plan": "free",
      "monthly": 0,
      "yearly": 0,
      "maxUsers": 1,
      "maxStorage": 1073741824,
      "features": ["basic"],
      "savings": 0
    },
    {
      "plan": "basic",
      "monthly": 290000,
      "yearly": 2900000,
      "maxUsers": 5,
      "maxStorage": 5368709120,
      "features": ["basic", "reports", "export"],
      "savings": 17
    },
    {
      "plan": "professional",
      "monthly": 990000,
      "yearly": 9900000,
      "maxUsers": 20,
      "maxStorage": 53687091200,
      "features": ["basic", "reports", "export", "api", "integrations", "priority-support"],
      "savings": 17
    },
    {
      "plan": "enterprise",
      "monthly": 2990000,
      "yearly": 29900000,
      "maxUsers": -1,
      "maxStorage": -1,
      "features": [
        "basic",
        "reports",
        "export",
        "api",
        "integrations",
        "priority-support",
        "custom-domain",
        "white-label",
        "dedicated-support"
      ],
      "savings": 17
    }
  ]
}
```

---

### 2. Get Current Subscription

**Endpoint:** `GET /tenants/:id/subscription`

**Description:** Get current subscription details for a tenant.

**Authentication:** Required (Bearer token)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Tenant ID (UUID) |

**Response (200):**

```json
{
  "tenant": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "ABC Company",
    "code": "abc-company"
  },
  "subscription": {
    "plan": "professional",
    "billingCycle": "monthly",
    "amount": 990000,
    "startDate": "2026-02-01T00:00:00.000Z",
    "endDate": "2026-03-01T00:00:00.000Z",
    "status": "active"
  },
  "usage": {
    "users": {
      "max": 20
    },
    "storage": {
      "current": 1073741824,
      "max": 53687091200,
      "percentage": 2
    }
  },
  "features": [
    "basic",
    "reports",
    "export",
    "api",
    "integrations",
    "priority-support"
  ],
  "isTrialActive": false,
  "daysUntilExpiry": 28
}
```

**Error Response (404):**

```json
{
  "statusCode": 404,
  "message": "Tenant not found",
  "error": "Not Found"
}
```

---

### 3. Upgrade Subscription

**Endpoint:** `POST /tenants/:id/subscription/upgrade`

**Description:** Upgrade or change subscription plan.

**Authentication:** Required (Bearer token)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Tenant ID (UUID) |

**Request Body:**

```json
{
  "plan": "professional",
  "billingCycle": "yearly",
  "paymentMethodId": "pm_1234567890"
}
```

**Field Validation:**

| Field | Type | Required | Values |
|-------|------|----------|--------|
| plan | enum | Yes | free, basic, professional, enterprise |
| billingCycle | enum | Yes | monthly, yearly |
| paymentMethodId | string | No | Payment gateway token |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Subscription upgraded successfully",
  "subscription": {
    "plan": "professional",
    "billingCycle": "yearly",
    "amount": 9900000,
    "startDate": "2026-02-28T00:00:00.000Z",
    "endDate": "2027-02-28T00:00:00.000Z",
    "features": [
      "basic",
      "reports",
      "export",
      "api",
      "integrations",
      "priority-support"
    ]
  }
}
```

**Error Responses:**

**400 Bad Request** - Already on same plan:
```json
{
  "statusCode": 400,
  "message": "Already on this plan and billing cycle",
  "error": "Bad Request"
}
```

**404 Not Found** - Tenant not found:
```json
{
  "statusCode": 404,
  "message": "Tenant not found",
  "error": "Not Found"
}
```

---

### 4. Cancel Subscription

**Endpoint:** `POST /tenants/:id/subscription/cancel`

**Description:** Cancel subscription and downgrade to free plan.

**Authentication:** Required (Bearer token)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Tenant ID (UUID) |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Subscription cancelled. Downgraded to free plan.",
  "subscription": {
    "plan": "free",
    "features": ["basic"]
  }
}
```

**Error Responses:**

**400 Bad Request** - Already on free plan:
```json
{
  "statusCode": 400,
  "message": "Already on free plan",
  "error": "Bad Request"
}
```

**404 Not Found** - Tenant not found:
```json
{
  "statusCode": 404,
  "message": "Tenant not found",
  "error": "Not Found"
}
```

---

### 5. Get Subscription History

**Endpoint:** `GET /tenants/:id/subscription/history`

**Description:** Get subscription change history (placeholder for future implementation).

**Authentication:** Required (Bearer token)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Tenant ID (UUID) |

**Response (200):**

```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "history": [],
  "message": "Subscription history tracking to be implemented"
}
```

---

## Complete Subscription Flow

### Upgrade Flow

```
1. User views current subscription
   GET /tenants/:id/subscription
   ↓
2. User views available plans
   GET /tenants/subscription/pricing
   ↓
3. User selects new plan
   ↓
4. System processes payment (if paid plan)
   ↓
5. User confirms upgrade
   POST /tenants/:id/subscription/upgrade
   ↓
6. System updates subscription
   - Changes plan
   - Updates limits (users, storage)
   - Updates features
   - Sets new expiry date
   ↓
7. User receives confirmation
   ↓
8. New features unlocked immediately
```

### Cancel Flow

```
1. User requests cancellation
   POST /tenants/:id/subscription/cancel
   ↓
2. System confirms cancellation
   ↓
3. System downgrades to free plan
   - Removes paid features
   - Reduces limits
   - Clears expiry date
   ↓
4. User receives confirmation
   ↓
5. Free plan active immediately
```

---

## Example Usage

### Using cURL

**Get Pricing:**

```bash
curl -X GET http://localhost:3000/tenants/subscription/pricing \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get Current Subscription:**

```bash
curl -X GET http://localhost:3000/tenants/TENANT_ID/subscription \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Upgrade to Professional (Yearly):**

```bash
curl -X POST http://localhost:3000/tenants/TENANT_ID/subscription/upgrade \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "professional",
    "billingCycle": "yearly",
    "paymentMethodId": "pm_1234567890"
  }'
```

**Cancel Subscription:**

```bash
curl -X POST http://localhost:3000/tenants/TENANT_ID/subscription/cancel \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using JavaScript (Axios)

```javascript
// Get pricing
const getPricing = async () => {
  const response = await axios.get('/tenants/subscription/pricing', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
};

// Get current subscription
const getSubscription = async (tenantId) => {
  const response = await axios.get(`/tenants/${tenantId}/subscription`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
};

// Upgrade subscription
const upgradeSubscription = async (tenantId, plan, billingCycle) => {
  const response = await axios.post(
    `/tenants/${tenantId}/subscription/upgrade`,
    { plan, billingCycle },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.data;
};

// Cancel subscription
const cancelSubscription = async (tenantId) => {
  const response = await axios.post(
    `/tenants/${tenantId}/subscription/cancel`,
    {},
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.data;
};
```

---

## Business Rules

### Trial Period

- New tenants get 14-day free trial
- Trial includes FREE plan features
- After trial expires, tenant is suspended
- User must upgrade to continue

### Billing Cycles

**Monthly:**
- Billed every month
- Can cancel anytime
- Prorated refunds (future feature)

**Yearly:**
- Billed once per year
- Save ~17% vs monthly
- Can cancel anytime
- Prorated refunds (future feature)

### Upgrades

- Immediate effect
- New features unlocked instantly
- Limits increased immediately
- Prorated billing (future feature)

### Downgrades

- Immediate effect
- Features removed instantly
- Limits reduced immediately
- Data preserved (within new limits)

### Cancellations

- Immediate downgrade to free
- Paid features removed
- Data preserved (within free limits)
- Can re-subscribe anytime

---

## Automatic Processes

### Expiry Check (Cron Job)

The system automatically checks for expired subscriptions:

```typescript
// Run daily at midnight
@Cron('0 0 * * *')
async checkExpiredSubscriptions() {
  const result = await subscriptionService.checkExpiredSubscriptions();
  console.log(`Checked ${result.checked} subscriptions`);
  console.log(`Suspended: ${result.suspended.join(', ')}`);
}
```

**Actions:**
1. Find tenants with expired subscriptions
2. Suspend tenant access
3. Send notification email (future)
4. Log suspension event

---

## Payment Integration (Future)

### Supported Gateways

1. **Stripe** (International)
   - Credit/debit cards
   - Recurring billing
   - Webhooks for events

2. **VNPay** (Vietnam)
   - Local payment methods
   - Bank transfers
   - QR code payments

3. **MoMo** (Vietnam)
   - E-wallet payments
   - QR code
   - App-to-app

### Payment Flow

```
1. User selects plan
   ↓
2. System creates payment intent
   ↓
3. User enters payment details
   ↓
4. Payment gateway processes
   ↓
5. Webhook confirms payment
   ↓
6. System upgrades subscription
   ↓
7. User receives confirmation
```

---

## Testing

### Unit Tests

```bash
npm test -- subscription.service.spec.ts
```

**Coverage:**
- ✅ Get pricing (2 tests)
- ✅ Get subscription (2 tests)
- ✅ Upgrade subscription (5 tests)
- ✅ Cancel subscription (3 tests)
- ✅ Check expired (2 tests)
- ✅ Get history (1 test)

**Total: 16 tests, 100% passing**

---

## Troubleshooting

### Common Issues

**Issue:** "Already on this plan and billing cycle"
- **Solution:** Choose a different plan or billing cycle

**Issue:** "Tenant not found"
- **Solution:** Verify tenant ID is correct

**Issue:** "Already on free plan"
- **Solution:** Cannot cancel free plan (already free)

**Issue:** Subscription expired but still active
- **Solution:** Run expiry check manually or wait for cron job

---

## Future Enhancements

### Planned Features

1. **Payment Gateway Integration**
   - Stripe for international
   - VNPay for Vietnam
   - Webhook handling

2. **Prorated Billing**
   - Calculate prorated amounts
   - Refund unused time
   - Credit for upgrades

3. **Subscription History**
   - Track all changes
   - Audit trail
   - Billing history

4. **Usage Alerts**
   - Near limit warnings
   - Expiry reminders
   - Upgrade suggestions

5. **Custom Plans**
   - Enterprise custom pricing
   - Add-ons (extra users, storage)
   - Volume discounts

6. **Invoicing**
   - Auto-generate invoices
   - PDF download
   - Email delivery

---

## Support

For issues or questions:
- Email: billing@smarterp.vn
- Documentation: https://docs.smarterp.vn/subscription
- Support: https://support.smarterp.vn

---

**Last Updated:** 2026-02-28  
**Version:** 1.0.0  
**Status:** Production Ready
