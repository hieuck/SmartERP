# ADR-XXX: [Decision Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded by ADR-YYY]  
**Date:** YYYY-MM-DD  
**Deciders:** [List names: Tech Lead, SA, etc.]  
**Technical Story:** [Link to issue/ticket if applicable]

---

## Context and Problem Statement

[Describe the architectural challenge or decision that needs to be made. Include relevant background information and constraints.]

**Example:**

> We need to ensure tenant isolation across all database queries in our multi-tenant ERP system. Currently, 53% of services use raw TypeORM repositories, which bypass tenant checks and create security risks.

## Decision Drivers

- [Driver 1: e.g., Security requirement for GDPR compliance]
- [Driver 2: e.g., Performance impact on query execution]
- [Driver 3: e.g., Developer experience and ease of use]
- [Driver 4: e.g., Alignment with Odoo/ERPNext patterns]

## Considered Options

### Option 1: [Name of Option]

**Description:**
[Detailed description of this approach]

**Pros:**

- ✅ [Positive aspect 1]
- ✅ [Positive aspect 2]
- ✅ [Positive aspect 3]

**Cons:**

- ❌ [Negative aspect 1]
- ❌ [Negative aspect 2]

**Implementation Effort:** [Low | Medium | High]  
**Risk Level:** [Low | Medium | High]

---

### Option 2: [Name of Option]

**Description:**
[Detailed description of this approach]

**Pros:**

- ✅ [Positive aspect 1]
- ✅ [Positive aspect 2]

**Cons:**

- ❌ [Negative aspect 1]
- ❌ [Negative aspect 2]

**Implementation Effort:** [Low | Medium | High]  
**Risk Level:** [Low | Medium | High]

---

### Option 3: [Name of Option]

[Same structure as above]

---

## Decision Outcome

**Chosen option:** Option X - [Name]

**Rationale:**
[Explain in detail why this option was selected over the others. Reference the decision drivers and how this option best addresses them.]

**Example:**

> We chose SecureRepository pattern because it provides automatic tenant isolation (addresses Driver 1), has minimal performance overhead (addresses Driver 2), and aligns with ERPNext's permission system (addresses Driver 4).

## Consequences

### Positive Consequences

- ✅ [Positive consequence 1]
- ✅ [Positive consequence 2]
- ✅ [Positive consequence 3]

### Negative Consequences

- ⚠️ [Negative consequence 1 + mitigation strategy]
- ⚠️ [Negative consequence 2 + mitigation strategy]

### Risks and Mitigations

| Risk     | Probability    | Impact         | Mitigation           |
| -------- | -------------- | -------------- | -------------------- |
| [Risk 1] | [Low/Med/High] | [Low/Med/High] | [How we'll mitigate] |
| [Risk 2] | [Low/Med/High] | [Low/Med/High] | [How we'll mitigate] |

## Implementation Plan

**Timeline:** [X days/weeks]  
**Effort Estimate:** [X person-days]  
**Dependencies:** [List any dependencies]

**Implementation Steps:**

1. **Phase 1: [Name]** (Days 1-X)
   - [ ] Task 1
   - [ ] Task 2
   - [ ] Task 3

2. **Phase 2: [Name]** (Days X-Y)
   - [ ] Task 1
   - [ ] Task 2

3. **Phase 3: [Name]** (Days Y-Z)
   - [ ] Task 1
   - [ ] Task 2

**Rollback Plan:**
[Describe how to revert this decision if needed]

## Validation and Success Criteria

**Success Criteria:**

- [ ] [Measurable criterion 1]
- [ ] [Measurable criterion 2]
- [ ] [Measurable criterion 3]

**Monitoring Metrics:**

- [Metric 1: e.g., SecureRepository adoption rate > 95%]
- [Metric 2: e.g., Zero tenant data leakage incidents]
- [Metric 3: e.g., API response time < 200ms]

**Testing Strategy:**

- [How will we validate this decision works as expected?]

## Compliance and Standards

**Odoo/ERPNext Alignment:**

- [How does this align with Odoo patterns?]
- [How does this align with ERPNext patterns?]

**Security Standards:**

- [GDPR compliance considerations]
- [Multi-tenancy requirements]
- [Permission system requirements]

## References

**Related ADRs:**

- [ADR-XXX: Related decision]
- [ADR-YYY: Another related decision]

**Documentation:**

- [Link to technical documentation]
- [Link to implementation guide]
- [Link to Odoo/ERPNext research]

**Implementation:**

- [Link to PR/commit]
- [Link to test results]

**External Resources:**

- [Link to relevant articles/papers]
- [Link to similar implementations]

---

## Notes

[Any additional notes, discussions, or context that doesn't fit above]

---

**Last Updated:** YYYY-MM-DD  
**Review Date:** YYYY-MM-DD (6 months from acceptance)  
**Reviewers:** [Names of people who reviewed this ADR]
