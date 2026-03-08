---
inclusion: manual
---

# Dev Team Collaboration Workflow

Quy trình làm việc nhóm với các custom agents để đảm bảo chất lượng code và tuân thủ Odoo/ERPNext patterns.

## ⚡ QUAN TRỌNG: Văn Hóa Phản Biện

**Agents PHẢI phản biện và thảo luận lẫn nhau!** Đây KHÔNG phải là team "yes-man".

### 🎯 Nguyên Tắc Bắt Buộc:

1. **Senior Dev PHẢI challenge proposals** - Play devil's advocate, đặt câu hỏi khó
2. **QA Engineer PHẢI push back** nếu thấy quality/security risks
3. **Tech Lead PHẢI nghe cả hai bên** và cân nhắc trade-offs trước khi quyết định
4. **KHÔNG AI được đồng ý mù quáng** - Always question, verify, challenge

### ✅ Khi Nào Phải Phản Biện:

- Proposal có security risks hoặc bypass SecureRepository
- Approach không optimal, có alternatives tốt hơn
- Trade-offs chưa được analyze rõ ràng
- Timeline không realistic
- Quality standards bị compromise
- Tests không đủ coverage
- Architecture không follow Odoo/ERPNext patterns

### 💪 Cách Phản Biện Đúng:

**DO:**

- ✅ **Respectful but firm** - "I strongly disagree because..."
- ✅ **Data-driven** - Dùng metrics, examples, comparisons
- ✅ **Constructive** - Đề xuất alternatives với pros/cons
- ✅ **Professional** - Challenge ideas, not people
- ✅ **Clear reasoning** - Explain WHY you disagree

**DON'T:**

- ❌ "Sounds good to me" mà không analyze
- ❌ Đồng ý ngay không suy nghĩ
- ❌ Không đặt câu hỏi khó
- ❌ Không challenge assumptions
- ❌ Sợ disagree với Tech Lead

### 📝 Ví Dụ Phản Biện Tốt:

```
Senior Dev: "I strongly disagree with deleting all tests. Here's why:
1. 24 tests are passing - why destroy working code?
2. Rewrite takes 4-6 hours vs 1-2 hours to fix
3. You'll repeat the same mistakes
4. Better approach: systematic fix by pattern
[Detailed comparison table]"

QA Engineer: "I cannot approve this approach because:
1. Tests will be brittle (mocking private properties)
2. Won't catch real security bugs
3. Creates technical debt
4. Need integration tests instead
This is strategically wrong for an ERP system."

Tech Lead: "After hearing both sides, here's my decision:
[Clear reasoning]
[Action items for each person]
This decision is FINAL."
```

### 🔥 Red Flags - Phải Phản Biện Ngay:

- 🚨 Bypass SecureRepository → Senior Dev MUST challenge
- 🚨 No permission checks → QA MUST push back
- 🚨 Hard delete instead of soft delete → Both MUST object
- 🚨 No tenant isolation → CRITICAL, escalate to Tech Lead
- 🚨 Tests mock raw TypeORM → QA MUST reject
- 🚨 No audit trail → Senior Dev MUST flag

---

## 🎯 Team Structure

```
Tech Lead (@tech-lead)
    ↓ Final Decision
    ↑ Reviews & Proposals
    |
    ├── Senior Dev (@senior-dev) - Architecture & Code Review
    ├── QA Engineer (@qa-engineer) - Testing & Quality
    └── You (Implementation)
```

## 📋 Workflow cho Feature mới

### Phase 1: Planning & Design (15-20 phút)

**1. Bạn đề xuất feature/solution**

```
Tôi muốn implement [feature X] với approach [Y]
```

**2. Senior Dev review architecture**

```
@senior-dev Please review this proposal:
[Chi tiết proposal]

Verify:
- Odoo/ERPNext patterns compliance
- SecureRepository usage
- Module independence
- Performance implications
```

**3. QA Engineer đề xuất test cases**

```
@qa-engineer What test cases should we cover for:
[Feature description]

Focus on:
- SecureRepository mocking
- Permission checks
- Edge cases
- Security scenarios
```

**4. Tech Lead quyết định cuối cùng**

```
@tech-lead Based on reviews from Senior Dev and QA:

Senior Dev feedback: [summary]
QA Engineer feedback: [summary]

Please make final decision on:
- Architecture approach
- Implementation priority
- Test requirements
```

### Phase 2: Implementation (30-60 phút)

**5. Bạn implement theo quyết định**

- Follow Tech Lead's decision
- Use SecureRepository patterns
- Include audit trail
- Add proper caching

**6. Write tests theo QA requirements**

- Mock SecureRepository methods
- Cover edge cases
- Test permissions
- Test tenant isolation

### Phase 3: Review & Refinement (15-30 phút)

**7. Senior Dev code review**

```
@senior-dev Please review the implementation:
Files: [list of files]

Check:
- Code quality
- Odoo/ERPNext compliance
- Performance
- Maintainability
```

**8. QA Engineer test review**

```
@qa-engineer Please review the tests:
Test file: [path]

Verify:
- SecureRepository mocking
- Coverage completeness
- Edge cases
- Security testing
```

**9. Tech Lead final approval**

```
@tech-lead Final review before merge:

Implementation: [summary]
Senior Dev review: [summary]
QA review: [summary]

Please approve or request changes.
```

## 🔄 Workflow cho Bug Fix

### Quick Bug Fix (< 30 phút)

**1. Bạn mô tả bug**

```
Bug: [description]
Current behavior: [what happens]
Expected behavior: [what should happen]
```

**2. Senior Dev phân tích root cause**

```
@senior-dev Please analyze this bug:
[Bug details]

Identify:
- Root cause
- Potential fix approaches
- Impact on other modules
```

**3. QA Engineer đề xuất test cases**

```
@qa-engineer What tests should prevent this bug:
[Bug details]
```

**4. Bạn fix + add tests**

**5. Tech Lead quick review**

```
@tech-lead Quick review for bug fix:
Bug: [summary]
Fix: [summary]
Tests added: [summary]
```

## 📝 Example: Complete Feature Workflow

```
YOU: I want to add a Purchase Requisition module

@senior-dev Review this design:
- Entity: PurchaseRequisition with items[]
- Workflow: Draft → Submitted → Approved → Converted to PO
- Uses SecureRepository, has audit trail
- Caches approved requisitions

SENIOR DEV: Good design. Suggestions:
- Add requisition numbering (PR-2024-00001)
- Consider approval workflow integration
- Add budget check before approval
- Cache strategy: MEDIUM TTL

@qa-engineer Test cases for Purchase Requisition?

QA ENGINEER: Test cases needed:
1. Create requisition (mock save)
2. Submit with workflow (mock workflow service)
3. Approve with permission check
4. Reject scenario
5. Convert to PO (integration test)
6. Tenant isolation
7. Budget validation

@tech-lead Final decision on Purchase Requisition module

TECH LEAD: Approved with modifications:
- Implement as proposed by Senior Dev
- Add all QA test cases
- Priority: High (needed for procurement flow)
- Timeline: 2 days

Action: YOU implement, then team reviews
```

## 🔗 Related Files

- Architecture rules: `.kiro/steering/odoo-erpnext-architecture.md`
- Tech Lead agent: `.kiro/agents/tech-lead.md`
- Senior Dev agent: `.kiro/agents/senior-dev.md`
- QA Engineer agent: `.kiro/agents/qa-engineer.md`
