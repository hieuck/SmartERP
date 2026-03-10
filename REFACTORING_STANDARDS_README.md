# Smart-ERP Refactoring Standards & Code Consistency

**Date:** March 10, 2026  
**Status:** ✅ ACTIVE  
**Purpose:** Enforce consistent code patterns across ALL Smart-ERP components  
**Scope:** Backend, Frontend, Mobile, Shared, Database, Infrastructure

---

## 📋 Overview

Smart-ERP is in a refactoring phase. The codebase has mixed patterns from different development phases. This document establishes standards to ensure consistency going forward across ALL components.

### Problem Statement

**Backend:**
- ❌ Direct DB access in controllers
- ❌ Manual instantiation
- ❌ Raw promises
- ❌ `any` types
- ❌ No validation, error handling, tests, docs

**Frontend:**
- ❌ Class components
- ❌ Local state for global data
- ❌ API calls in components
- ❌ Inline styles
- ❌ No type safety

**Mobile:**
- ❌ Class components
- ❌ Inconsistent navigation
- ❌ Local state management
- ❌ No type safety

**Shared:**
- ❌ Types scattered everywhere
- ❌ Hardcoded values
- ❌ Duplicate utilities

**Database:**
- ❌ Unnamed migrations
- ❌ Hardcoded seeds
- ❌ No documentation

**Infrastructure:**
- ❌ Single-stage Docker builds
- ❌ Hardcoded configuration
- ❌ Disorganized docker-compose

### Solution

- ✅ NEW patterns for ALL components
- ✅ Gradual refactoring of old code
- ✅ Automated reminders via hooks
- ✅ Clear guidelines in steering files
- ✅ Universal and component-specific standards

---

## 🎯 Quick Start

### For Developers

1. **Read:** `.kiro/steering/smart-erp-refactoring-standards.md`
2. **Follow:** NEW patterns (not old ones)
3. **Check:** Code review checklist before committing
4. **Test:** Run `npm test` before pushing

### For Code Reviewers

1. **Use:** Code review checklist
2. **Enforce:** NEW patterns only
3. **Suggest:** Refactoring for old patterns
4. **Approve:** Only if standards met

### For Team Leads

1. **Monitor:** Hook reminders on file edits
2. **Track:** Refactoring progress
3. **Prioritize:** Phase 1 → Phase 4
4. **Support:** Team with refactoring

---

## 📚 Documentation

### Steering File
**Location:** `.kiro/steering/smart-erp-refactoring-standards.md`

Contains:
- ✅ Backend patterns (10 patterns with examples)
- ✅ Frontend patterns (5 patterns with examples)
- ✅ Mobile patterns (4 patterns with examples)
- ✅ Shared patterns (3 patterns with examples)
- ✅ Database patterns (3 patterns with examples)
- ✅ Infrastructure patterns (3 patterns with examples)
- ✅ Cross-component patterns (3 patterns with examples)
- 🔄 Refactoring checklist
- 📋 Code review checklist
- 🚀 Refactoring priority phases (all components)

### Hook
**Location:** `.kiro/hooks/smart-erp-refactoring-reminder.kiro.hook`

Triggers:
- When: File edited in ANY Smart-ERP component
  - Backend: `smart-erp/src/backend/**/*.ts`
  - Frontend: `smart-erp/src/frontend/**/*.ts`, `smart-erp/src/frontend/**/*.tsx`
  - Mobile: `smart-erp/src/mobile/**/*.ts`, `smart-erp/src/mobile/**/*.tsx`
  - Database: `smart-erp/database/**/*.sql`
  - Infrastructure: `smart-erp/config/**/*.ts`, `smart-erp/Dockerfile*`, `smart-erp/docker-compose*.yml`
- Action: Reminds developer to check standards
- Checks: Universal + component-specific checklist

---

## ✅ NEW PATTERNS (Use These)

### 1. Service Layer Architecture
Controllers → Services → Repositories → Database

### 2. Dependency Injection
Always use constructor injection, never manual instantiation

### 3. Entity Relationships
Use TypeORM decorators for relationships

### 4. Validation
Use class-validator decorators on DTOs

### 5. Error Handling
Use custom exception classes

### 6. Async/Await
Always use async/await, never raw promises

### 7. Type Safety
Always use TypeScript types, avoid `any`

### 8. Module Organization
Domain-driven modules with clear boundaries

### 9. Testing
Unit tests for services, integration tests for controllers

### 10. Documentation
JSDoc for public APIs

---

## ❌ OLD PATTERNS (Don't Use These)

### 1. Direct Database Access in Controllers
❌ Don't inject repository in controller

### 2. Business Logic in Controllers
❌ Don't put business logic in controller methods

### 3. Manual Validation
❌ Don't validate manually in controller

### 4. Callback Hell / Promise Chains
❌ Don't use `.then().then().then()`

### 5. Using `any` Type
❌ Don't use `any` type

### 6. Inline SQL Queries
❌ Don't write raw SQL

### 7. Hardcoded Values
❌ Don't hardcode magic numbers

### 8. No Error Handling
❌ Don't skip error handling

### 9. No Tests
❌ Don't skip tests

### 10. Mixed Patterns
❌ Don't mix old and new patterns in same file

---

## 🔄 Refactoring Workflow

### Step 1: Identify Old Code
Look for patterns from the OLD PATTERNS list

### Step 2: Plan Refactoring
Use the refactoring checklist to plan changes

### Step 3: Refactor
Follow the NEW PATTERNS

### Step 4: Test
Run `npm test` to ensure tests pass

### Step 5: Review
Use code review checklist

### Step 6: Commit
Push with clear commit message

---

## 📋 Checklists

### Refactoring Checklist
- [ ] Move business logic from controller to service
- [ ] Replace manual instantiation with DI
- [ ] Replace promises with async/await
- [ ] Replace `any` types with proper types
- [ ] Add class-validator decorators
- [ ] Add custom exception classes
- [ ] Add JSDoc documentation
- [ ] Add unit tests
- [ ] Remove hardcoded values
- [ ] Add proper error handling
- [ ] Update module organization if needed
- [ ] Run tests: `npm test`
- [ ] Run linter: `npm run lint`

### Code Review Checklist
- [ ] Service layer used (not direct DB access)
- [ ] Dependency injection used (not manual instantiation)
- [ ] Async/await used (not raw promises)
- [ ] Proper TypeScript types (no `any`)
- [ ] Class-validator decorators on DTOs
- [ ] Custom exceptions used
- [ ] JSDoc documentation present
- [ ] Unit tests present
- [ ] No hardcoded values
- [ ] Proper error handling
- [ ] Consistent with module organization
- [ ] Tests passing
- [ ] Linter passing

---

## 🚀 Refactoring Phases

### Phase 1 (Immediate)
**Focus:** Core architecture
- [ ] Controllers - remove business logic
- [ ] Services - add missing services
- [ ] Repositories - create repository layer

**Timeline:** 2-4 weeks  
**Priority:** P0 (Critical)

### Phase 2 (Short-term)
**Focus:** Data validation and error handling
- [ ] DTOs - add class-validator decorators
- [ ] Exceptions - create custom exceptions
- [ ] Error handling - add try-catch blocks

**Timeline:** 2-4 weeks  
**Priority:** P1 (High)

### Phase 3 (Mid-term)
**Focus:** Testing and documentation
- [ ] Tests - add unit tests for services
- [ ] Documentation - add JSDoc
- [ ] Types - replace `any` with proper types

**Timeline:** 4-6 weeks  
**Priority:** P2 (Medium)

### Phase 4 (Long-term)
**Focus:** Optimization and cleanup
- [ ] Module organization - reorganize if needed
- [ ] Performance - optimize queries
- [ ] Security - add security checks

**Timeline:** 4-8 weeks  
**Priority:** P3 (Low)

---

## 📊 Progress Tracking

### Metrics to Track
- Number of files refactored
- Number of services created
- Number of tests added
- Code coverage percentage
- Linter violations remaining
- `any` type usage remaining

### Success Criteria
- ✅ 100% of new code follows NEW patterns
- ✅ 80%+ of old code refactored
- ✅ 80%+ code coverage
- ✅ 0 linter violations
- ✅ 0 `any` type usage

---

## 🎓 Examples

### Example 1: Refactoring a Controller

**Before (OLD):**
```typescript
@Controller('customers')
export class CustomerController {
  constructor(
    @InjectRepository(Customer)
    private repository: Repository<Customer>
  ) {}

  @Post()
  async create(@Body() dto: any) {
    if (!dto.name) throw new Error('Name required');
    if (dto.name.length < 3) throw new Error('Name too short');
    
    const customer = new Customer();
    customer.name = dto.name;
    customer.email = dto.email;
    return this.repository.save(customer);
  }
}
```

**After (NEW):**
```typescript
@Controller('customers')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Post()
  async create(@Body() dto: CreateCustomerDto) {
    return this.customerService.createCustomer(dto);
  }
}

@Injectable()
export class CustomerService {
  constructor(private customerRepository: CustomerRepository) {}

  async createCustomer(dto: CreateCustomerDto): Promise<Customer> {
    const existingCustomer = await this.customerRepository.findByEmail(dto.email);
    if (existingCustomer) {
      throw new CustomerAlreadyExistsException(dto.email);
    }
    return this.customerRepository.create(dto);
  }
}

export class CreateCustomerDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsEmail()
  email: string;
}
```

### Example 2: Refactoring Promise Chains

**Before (OLD):**
```typescript
createOrder(dto) {
  return this.customerService.getCustomer(dto.customerId)
    .then(customer => {
      return this.inventoryService.checkStock(dto.items)
        .then(items => {
          return this.orderRepository.create({ customer, items })
            .then(order => {
              return this.emailService.sendConfirmation(order)
                .then(() => order);
            });
        });
    });
}
```

**After (NEW):**
```typescript
async createOrder(dto: CreateOrderDto): Promise<Order> {
  const customer = await this.customerService.getCustomer(dto.customerId);
  const items = await this.inventoryService.checkStock(dto.items);
  const order = await this.orderRepository.create({ customer, items });
  await this.emailService.sendConfirmation(order);
  return order;
}
```

---

## 🔗 Related Documents

- `.kiro/steering/smart-erp-refactoring-standards.md` - Detailed standards
- `.kiro/hooks/smart-erp-refactoring-reminder.kiro.hook` - Automated reminders
- `smart-erp/docs/IMPLEMENTATION_ROADMAP_ODOO_COMPLIANCE.md` - Feature roadmap

---

## 📞 Questions?

### For Standards Questions
See: `.kiro/steering/smart-erp-refactoring-standards.md`

### For Refactoring Help
See: Examples section above

### For Code Review
Use: Code review checklist

### For Progress Tracking
See: Progress tracking section

---

## ✅ Checklist for Team

- [ ] Read this README
- [ ] Read `.kiro/steering/smart-erp-refactoring-standards.md`
- [ ] Understand NEW patterns
- [ ] Understand OLD patterns to avoid
- [ ] Use refactoring checklist for old code
- [ ] Use code review checklist for new code
- [ ] Run tests before committing
- [ ] Run linter before committing

---

## 🎯 Remember

**CONSISTENCY OVER FLEXIBILITY**

- ✅ All new code must follow NEW patterns
- ✅ Old code will be gradually refactored
- ✅ Don't mix patterns in same file
- ✅ Follow the checklists
- ✅ Run tests and linter
- ✅ Ask for help if unsure

---

**Last Updated:** March 10, 2026  
**Status:** ✅ ACTIVE  
**Applies To:** All Smart-ERP backend development

---

## 🚀 Next Steps

1. **Read** the steering file
2. **Understand** the patterns
3. **Follow** the checklists
4. **Refactor** old code gradually
5. **Maintain** consistency in new code

**Let's make Smart-ERP consistent and maintainable!**
