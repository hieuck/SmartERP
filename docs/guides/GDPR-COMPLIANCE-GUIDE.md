# GDPR Compliance Guide

**Last Updated**: 2026-03-07  
**Version**: 1.0.0

This guide explains how SmartERP complies with GDPR (General Data Protection Regulation) and how administrators can manage user data requests.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [User Rights](#user-rights)
3. [Consent Management](#consent-management)
4. [Data Export Requests](#data-export-requests)
5. [Data Deletion Requests](#data-deletion-requests)
6. [Admin Workflows](#admin-workflows)
7. [API Reference](#api-reference)

---

## Overview

SmartERP implements GDPR compliance features to protect user privacy and data rights:

- **Article 20**: Right to data portability (data export)
- **Article 17**: Right to erasure (data deletion)
- **Consent tracking**: Track user consents with full audit trail
- **Admin approval**: Deletion requests require admin approval
- **Multi-tenancy**: All data isolated by tenant

---

## User Rights

### Right to Data Portability (Article 20)

Users can request a copy of their personal data in machine-readable format (JSON, CSV, or PDF).

**Process**:
1. User submits export request via API or UI
2. System processes request asynchronously
3. Export file generated and stored securely
4. User receives download link (expires in 7 days)

### Right to Erasure (Article 17)

Users can request deletion of their personal data.

**Process**:
1. User submits deletion request with reason
2. Admin reviews and approves/rejects request
3. If approved, system anonymizes or deletes user data
4. Audit logs retained for compliance

---

## Consent Management

### Consent Types

SmartERP tracks 5 types of user consents:

1. **Terms of Service**: Agreement to platform terms
2. **Privacy Policy**: Agreement to data processing
3. **Marketing Emails**: Opt-in for marketing communications
4. **Data Processing**: Consent for data processing activities
5. **Cookies**: Consent for cookie usage

### Consent Tracking

Each consent record includes:
- Consent type
- Granted/revoked status
- Version of policy/terms
- IP address and user agent
- Timestamp of consent/revocation

### API Endpoints

```typescript
// Create or update consent
POST /gdpr/consent
{
  "type": "privacy_policy",
  "granted": true,
  "version": "1.0",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}

// Revoke consent
POST /gdpr/consent/:type/revoke

// Get user consents
GET /gdpr/consent

// Check consent status
GET /gdpr/consent/:type/status
```

---

## Data Export Requests

### User Workflow

1. **Submit Request**:
   ```typescript
   POST /gdpr/export
   {
     "format": "json" // or "csv", "pdf"
   }
   ```

2. **Check Status**:
   ```typescript
   GET /gdpr/export
   // Returns list of export requests with status
   ```

3. **Download Export**:
   ```typescript
   GET /gdpr/export/:id
   // Returns request details including download URL
   ```

### Export Status

- `pending`: Request submitted, waiting for processing
- `processing`: System is collecting and formatting data
- `completed`: Export ready for download
- `failed`: Export failed (check errorMessage)
- `expired`: Download link expired (7 days)

### What Data is Exported?

The export includes all personal data:
- User profile information
- Activity logs
- Created/modified records
- Consent history
- Related business data (orders, invoices, etc.)

---

## Data Deletion Requests

### User Workflow

1. **Submit Request**:
   ```typescript
   POST /gdpr/deletion
   {
     "reason": "I no longer use this service and want my data deleted"
   }
   ```

2. **Check Status**:
   ```typescript
   GET /gdpr/deletion
   // Returns list of deletion requests with status
   ```

### Deletion Status

- `pending`: Request submitted, waiting for admin review
- `approved`: Admin approved, waiting for processing
- `rejected`: Admin rejected (see rejectionReason)
- `processing`: System is deleting/anonymizing data
- `completed`: Data deletion complete
- `failed`: Deletion failed (check errorMessage)

### What Happens to Data?

When a deletion request is approved:

1. **Personal Data**: Deleted or anonymized
2. **Business Records**: Anonymized (e.g., "Deleted User #123")
3. **Audit Logs**: Retained for compliance (anonymized)
4. **Financial Records**: Retained per legal requirements (anonymized)

---

## Admin Workflows

### Reviewing Deletion Requests

Admins (with `admin` or `hr_manager` role) can review deletion requests:

1. **View Pending Requests**:
   ```typescript
   GET /gdpr/admin/deletion/pending
   // Returns list of pending deletion requests
   ```

2. **View All Requests**:
   ```typescript
   GET /gdpr/admin/deletion/all
   // Returns all deletion requests for tenant
   ```

3. **Approve/Reject Request**:
   ```typescript
   PATCH /gdpr/admin/deletion/:id/approve
   {
     "approved": true // or false
     "rejectionReason": "Optional reason if rejected"
   }
   ```

### Admin Responsibilities

Admins should:

1. **Review Requests Promptly**: GDPR requires response within 30 days
2. **Verify Identity**: Ensure request is from legitimate user
3. **Check Legal Obligations**: Some data must be retained (e.g., financial records)
4. **Document Decisions**: Provide clear rejection reasons if applicable
5. **Monitor Processing**: Ensure approved deletions complete successfully

### Best Practices

- **Response Time**: Aim to review requests within 7 days
- **Communication**: Notify users of approval/rejection
- **Verification**: Implement additional identity verification for sensitive requests
- **Retention Policies**: Document data retention policies clearly
- **Audit Trail**: Maintain logs of all GDPR-related actions

---

## API Reference

### Authentication

All GDPR endpoints require authentication via JWT token:

```typescript
Authorization: Bearer <jwt_token>
```

### User Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/gdpr/consent` | Create/update consent | User |
| POST | `/gdpr/consent/:type/revoke` | Revoke consent | User |
| GET | `/gdpr/consent` | Get user consents | User |
| GET | `/gdpr/consent/:type/status` | Check consent status | User |
| POST | `/gdpr/export` | Request data export | User |
| GET | `/gdpr/export` | List export requests | User |
| GET | `/gdpr/export/:id` | Get export details | User |
| POST | `/gdpr/deletion` | Request data deletion | User |
| GET | `/gdpr/deletion` | List deletion requests | User |
| GET | `/gdpr/deletion/:id` | Get deletion details | User |

### Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/gdpr/admin/deletion/pending` | Get pending deletions | Admin/HR |
| GET | `/gdpr/admin/deletion/all` | Get all deletions | Admin/HR |
| PATCH | `/gdpr/admin/deletion/:id/approve` | Approve/reject deletion | Admin/HR |

### Error Responses

```typescript
// 400 Bad Request
{
  "statusCode": 400,
  "message": "You already have a pending deletion request",
  "error": "Bad Request"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Export request not found",
  "error": "Not Found"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

---

## Compliance Checklist

### For Administrators

- [ ] Review deletion requests within 30 days (GDPR requirement)
- [ ] Maintain audit logs of all GDPR actions
- [ ] Document data retention policies
- [ ] Implement identity verification for sensitive requests
- [ ] Train staff on GDPR procedures
- [ ] Regular compliance audits

### For Developers

- [ ] All personal data queries filter by tenantId
- [ ] Consent checked before data processing
- [ ] Export includes all user personal data
- [ ] Deletion anonymizes data properly
- [ ] Audit logs retained for compliance
- [ ] API endpoints properly secured with RBAC

---

## Support

For questions about GDPR compliance:

- **Technical Issues**: Check API documentation
- **Legal Questions**: Consult with legal counsel
- **Implementation Help**: See developer guides

---

**Note**: This guide provides technical implementation details. For legal advice on GDPR compliance, consult with qualified legal counsel.
