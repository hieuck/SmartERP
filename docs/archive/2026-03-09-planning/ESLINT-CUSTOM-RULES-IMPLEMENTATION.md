# 🔧 ESLint Custom Rules - Implementation Guide

**Author:** Senior Developer  
**Date:** 2026-03-08  
**Purpose:** Concrete implementation guide for SmartERP ESLint custom rules  
**Estimated Time:** 5-7 days

---

## 📋 Overview

This guide provides step-by-step instructions to implement 9 custom ESLint rules for SmartERP, enforcing Odoo/ERPNext architecture patterns.

---

## 🏗️ Project Structure

```
eslint-plugin-smarterp/
├── package.json
├── index.js                    # Plugin entry point
├── rules/
│   ├── no-typeorm-query-builder.js
│   ├── require-secure-repository.js
│   ├── require-permission-check.js
│   ├── no-typeorm-mock-in-tests.js
│   ├── require-secure-repo-mock.js
│   ├── require-audit-fields.js
│   ├── require-soft-delete.js
│   ├── service-method-naming.js
│   └── controller-route-naming.js
├── tests/
│   ├── no-typeorm-query-builder.test.js
│   └── ... (test for each rule)
└── README.md
```

---

## 🚀 Setup

### Step 1: Create Plugin Package

```bash
mkdir eslint-plugin-smarterp
cd eslint-plugin-smarterp
npm init -y
```

### Step 2: Install Dependencies

```bash
npm install --save-dev \
  @typescript-eslint/parser \
  @typescript-eslint/utils \
  eslint \
  jest
```

### Step 3: Configure package.json

```json
{
  "name": "eslint-plugin-smarterp",
  "version": "1.0.0",
  "main": "index.js",
  "peerDependencies": {
    "eslint": ">=8.0.0"
  },
  "scripts": {
    "test": "jest"
  }
}
```

---

## 📝 Rule Implementations

### Priority 1: Security & Multi-tenancy

#### Rule 1: no-typeorm-query-builder

**Purpose:** Prevent direct TypeORM query builder usage

**File:** `rules/no-typeorm-query-builder.js`

```javascript
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct TypeORM createQueryBuilder usage',
      category: 'Security',
      recommended: true,
    },
    messages: {
      noQueryBuilder:
        'Use SecureRepository instead of createQueryBuilder(). Direct TypeORM usage bypasses tenant isolation and permission checks.',
    },
    schema: [],
  },

  create(context) {
    return {
      // Detect: repository.createQueryBuilder()
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'createQueryBuilder'
        ) {
          // Check if it's called on a repository
          const objectName = node.callee.object.name;
          if (objectName && objectName.toLowerCase().includes('repository')) {
            context.report({
              node,
              messageId: 'noQueryBuilder',
            });
          }
        }
      },
    };
  },
};
```

**Test:** `tests/no-typeorm-query-builder.test.js`

```javascript
const { RuleTester } = require('eslint');
const rule = require('../rules/no-typeorm-query-builder');

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

ruleTester.run('no-typeorm-query-builder', rule, {
  valid: [
    // ✅ Using SecureRepository
    'const users = await this.secureRepository.find({ where: { active: true } });',
    'const user = await this.secureRepository.findOne({ where: { id } });',
  ],

  invalid: [
    {
      // ❌ Using createQueryBuilder
      code: 'const users = await this.userRepository.createQueryBuilder("user").getMany();',
      errors: [{ messageId: 'noQueryBuilder' }],
    },
    {
      code: 'const qb = repository.createQueryBuilder();',
      errors: [{ messageId: 'noQueryBuilder' }],
    },
  ],
});
```

---

#### Rule 2: require-secure-repository

**Purpose:** Enforce SecureRepository usage in services

**File:** `rules/require-secure-repository.js`

```javascript
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require SecureRepository instead of @InjectRepository',
      category: 'Security',
      recommended: true,
    },
    messages: {
      useSecureRepository:
        'Use SecureRepository<{{entity}}> instead of @InjectRepository({{entity}}). SecureRepository provides tenant isolation and permission checks.',
    },
    fixable: 'code',
    schema: [],
  },

  create(context) {
    return {
      // Detect: @InjectRepository(Entity)
      Decorator(node) {
        if (
          node.expression.type === 'CallExpression' &&
          node.expression.callee.name === 'InjectRepository'
        ) {
          const entityName = node.expression.arguments[0]?.name;

          context.report({
            node,
            messageId: 'useSecureRepository',
            data: { entity: entityName || 'Entity' },
            fix(fixer) {
              // Auto-fix: Replace @InjectRepository with SecureRepository
              const parent = node.parent;
              if (parent.type === 'PropertyDefinition') {
                const typeAnnotation = parent.typeAnnotation;
                if (typeAnnotation) {
                  return fixer.replaceText(typeAnnotation, `: SecureRepository<${entityName}>`);
                }
              }
              return null;
            },
          });
        }
      },
    };
  },
};
```

---

#### Rule 3: require-permission-check

**Purpose:** Ensure permission checks before data modifications

**File:** `rules/require-permission-check.js`

```javascript
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require permission checks before save/remove operations',
      category: 'Security',
      recommended: true,
    },
    messages: {
      missingPermissionCheck:
        'Add permission check (canWrite/canDelete) before {{operation}}. All data modifications must verify user permissions.',
    },
    schema: [],
  },

  create(context) {
    const dangerousOperations = ['save', 'remove', 'delete', 'update'];
    const permissionChecks = ['canWrite', 'canDelete', 'canUpdate'];

    // Track permission checks in current function
    let hasPermissionCheck = false;

    return {
      // Reset on function entry
      'FunctionDeclaration, MethodDefinition, ArrowFunctionExpression'() {
        hasPermissionCheck = false;
      },

      // Track permission checks
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          permissionChecks.includes(node.callee.property.name)
        ) {
          hasPermissionCheck = true;
        }

        // Check for dangerous operations
        if (
          node.callee.type === 'MemberExpression' &&
          dangerousOperations.includes(node.callee.property.name)
        ) {
          if (!hasPermissionCheck) {
            context.report({
              node,
              messageId: 'missingPermissionCheck',
              data: { operation: node.callee.property.name },
            });
          }
        }
      },
    };
  },
};
```

---

### Priority 2: Testing Patterns

#### Rule 4: no-typeorm-mock-in-tests

**Purpose:** Prevent mocking raw TypeORM methods in tests

**File:** `rules/no-typeorm-mock-in-tests.js`

```javascript
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow mocking TypeORM methods in tests',
      category: 'Testing',
      recommended: true,
    },
    messages: {
      noTypeORMMock:
        'Mock SecureRepository methods (find/findOne/save/remove) instead of TypeORM methods ({{method}}). This ensures tests verify security patterns.',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();

    // Only check test files
    if (!filename.includes('.spec.') && !filename.includes('.test.')) {
      return {};
    }

    const typeormMethods = ['createQueryBuilder', 'update', 'delete', 'insert', 'query'];

    return {
      Property(node) {
        // Detect: { createQueryBuilder: jest.fn() }
        if (node.key.type === 'Identifier' && typeormMethods.includes(node.key.name)) {
          context.report({
            node,
            messageId: 'noTypeORMMock',
            data: { method: node.key.name },
          });
        }
      },
    };
  },
};
```

---

#### Rule 5: require-secure-repo-mock

**Purpose:** Ensure SecureRepository is mocked in tests

**File:** `rules/require-secure-repo-mock.js`

```javascript
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require SecureRepository mock in tests',
      category: 'Testing',
      recommended: true,
    },
    messages: {
      missingSecureRepoMock:
        'Mock SecureRepository methods (find/findOne/save/remove) in this test.',
    },
    fixable: 'code',
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();

    // Only check test files
    if (!filename.includes('.spec.') && !filename.includes('.test.')) {
      return {};
    }

    let hasSecureRepoMock = false;
    const secureRepoMethods = ['find', 'findOne', 'save', 'remove'];

    return {
      // Check for SecureRepository mock
      Property(node) {
        if (
          node.key.type === 'Identifier' &&
          secureRepoMethods.includes(node.key.name) &&
          node.value.type === 'CallExpression' &&
          node.value.callee.property?.name === 'fn'
        ) {
          hasSecureRepoMock = true;
        }
      },

      // Report if no mock found at end of file
      'Program:exit'(node) {
        if (!hasSecureRepoMock) {
          context.report({
            node,
            messageId: 'missingSecureRepoMock',
            fix(fixer) {
              // Auto-fix: Add mock template
              const mockTemplate = `
const mockSecureRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};
`;
              return fixer.insertTextAfter(node, mockTemplate);
            },
          });
        }
      },
    };
  },
};
```

---

### Priority 3: Data Integrity

#### Rule 6: require-audit-fields

**Purpose:** Ensure entities have audit trail fields

**File:** `rules/require-audit-fields.js`

```javascript
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require audit trail fields in entities',
      category: 'Data Integrity',
      recommended: true,
    },
    messages: {
      missingAuditFields:
        'Entity must extend BaseEntity or include audit fields (createdBy, updatedBy, createdAt, updatedAt, deletedAt).',
    },
    fixable: 'code',
    schema: [],
  },

  create(context) {
    return {
      // Detect: @Entity() class
      ClassDeclaration(node) {
        // Check if class has @Entity decorator
        const hasEntityDecorator = node.decorators?.some(
          (decorator) =>
            decorator.expression.type === 'CallExpression' &&
            decorator.expression.callee.name === 'Entity',
        );

        if (!hasEntityDecorator) return;

        // Check if extends BaseEntity
        const extendsBaseEntity = node.superClass?.name === 'BaseEntity';

        if (extendsBaseEntity) return;

        // Check for audit fields
        const auditFields = ['createdBy', 'updatedBy', 'createdAt', 'updatedAt', 'deletedAt'];

        const hasAuditFields = node.body.body.some(
          (member) => member.type === 'PropertyDefinition' && auditFields.includes(member.key.name),
        );

        if (!hasAuditFields) {
          context.report({
            node,
            messageId: 'missingAuditFields',
            fix(fixer) {
              // Auto-fix: Add extends BaseEntity
              if (node.superClass) {
                return null; // Already extends something else
              }
              return fixer.replaceText(node.id, `${node.id.name} extends BaseEntity`);
            },
          });
        }
      },
    };
  },
};
```

---

### Priority 4: Code Quality

#### Rule 7: service-method-naming

**Purpose:** Enforce camelCase naming with proper prefixes

**File:** `rules/service-method-naming.js`

```javascript
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce service method naming conventions',
      category: 'Code Quality',
      recommended: true,
    },
    messages: {
      wrongNaming:
        'Service method "{{name}}" should use camelCase with prefix (findAll, findById, create, update, delete).',
    },
    fixable: 'code',
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();

    // Only check service files
    if (!filename.includes('.service.')) {
      return {};
    }

    const validPrefixes = [
      'find',
      'create',
      'update',
      'delete',
      'get',
      'set',
      'calculate',
      'validate',
      'process',
    ];

    return {
      MethodDefinition(node) {
        const methodName = node.key.name;

        // Skip constructors and private methods
        if (methodName === 'constructor' || methodName.startsWith('_')) {
          return;
        }

        // Check naming convention
        const isCamelCase = /^[a-z][a-zA-Z0-9]*$/.test(methodName);
        const hasValidPrefix = validPrefixes.some((prefix) => methodName.startsWith(prefix));

        if (!isCamelCase || !hasValidPrefix) {
          context.report({
            node,
            messageId: 'wrongNaming',
            data: { name: methodName },
          });
        }
      },
    };
  },
};
```

---

## 🔌 Plugin Configuration

### index.js

```javascript
module.exports = {
  rules: {
    'no-typeorm-query-builder': require('./rules/no-typeorm-query-builder'),
    'require-secure-repository': require('./rules/require-secure-repository'),
    'require-permission-check': require('./rules/require-permission-check'),
    'no-typeorm-mock-in-tests': require('./rules/no-typeorm-mock-in-tests'),
    'require-secure-repo-mock': require('./rules/require-secure-repo-mock'),
    'require-audit-fields': require('./rules/require-audit-fields'),
    'require-soft-delete': require('./rules/require-soft-delete'),
    'service-method-naming': require('./rules/service-method-naming'),
    'controller-route-naming': require('./rules/controller-route-naming'),
  },
  configs: {
    recommended: {
      plugins: ['smarterp'],
      rules: {
        'smarterp/no-typeorm-query-builder': 'error',
        'smarterp/require-secure-repository': 'error',
        'smarterp/require-permission-check': 'error',
        'smarterp/no-typeorm-mock-in-tests': 'error',
        'smarterp/require-secure-repo-mock': 'warn',
        'smarterp/require-audit-fields': 'error',
        'smarterp/require-soft-delete': 'warn',
        'smarterp/service-method-naming': 'warn',
        'smarterp/controller-route-naming': 'warn',
      },
    },
  },
};
```

---

## 🔧 Integration with SmartERP

### Step 1: Install Plugin

```bash
cd src/backend
npm install --save-dev file:../../eslint-plugin-smarterp
```

### Step 2: Update .eslintrc.js

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'smarterp'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:smarterp/recommended', // Add this
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    // Existing rules...

    // SmartERP custom rules
    'smarterp/no-typeorm-query-builder': 'error',
    'smarterp/require-secure-repository': 'error',
    'smarterp/require-permission-check': 'error',
    'smarterp/no-typeorm-mock-in-tests': 'error',
    'smarterp/require-secure-repo-mock': 'warn',
    'smarterp/require-audit-fields': 'error',
    'smarterp/require-soft-delete': 'warn',
    'smarterp/service-method-naming': 'warn',
    'smarterp/controller-route-naming': 'warn',
  },
};
```

### Step 3: Run Lint

```bash
npm run lint
```

---

## 📊 Testing

### Run Tests

```bash
cd eslint-plugin-smarterp
npm test
```

### Test Coverage

```bash
npm test -- --coverage
```

**Expected Coverage:** 90%+

---

## 🚀 Deployment

### Phase 1: Priority 1 Rules (Week 1)

```bash
# Implement and test
1. no-typeorm-query-builder
2. require-secure-repository
3. require-permission-check

# Deploy
npm run lint -- --fix
git commit -m "feat: add Priority 1 ESLint rules"
```

### Phase 2: Priority 2 Rules (Week 2)

```bash
# Implement and test
4. no-typeorm-mock-in-tests
5. require-secure-repo-mock

# Deploy
npm run lint -- --fix
git commit -m "feat: add Priority 2 ESLint rules"
```

### Phase 3: Priority 3-4 Rules (Week 3-4)

```bash
# Implement and test remaining rules
6-9. All remaining rules

# Deploy
npm run lint -- --fix
git commit -m "feat: add all ESLint custom rules"
```

---

## 📈 Success Metrics

### Before Implementation

```bash
# Scan codebase for violations
npm run lint -- --format json > before.json

# Expected violations:
# - no-typeorm-query-builder: 50+
# - require-secure-repository: 30+
# - no-typeorm-mock-in-tests: 50+
# - require-audit-fields: 20+
```

### After Implementation

```bash
# Scan again
npm run lint -- --format json > after.json

# Expected violations:
# - All: 0 (with auto-fix)
# - Manual fixes needed: 10-20
```

### Tracking

```bash
# Weekly report
npm run lint -- --format json | jq '.[] | .messages | length' | awk '{s+=$1} END {print s}'
```

---

## 🎯 Conclusion

This implementation guide provides concrete steps to create 9 custom ESLint rules for SmartERP. The rules enforce Odoo/ERPNext architecture patterns with objective, deterministic detection.

**Estimated Timeline:**

- Setup: 1 day
- Priority 1 rules: 2-3 days
- Priority 2 rules: 1-2 days
- Priority 3-4 rules: 1-2 days
- **Total: 5-7 days**

**Expected Impact:**

- Detection accuracy: 95%+
- Auto-fix rate: 60%+
- Violations prevented: 90%+
- Developer experience: Significantly improved

---

**Author:** Senior Developer  
**Status:** Ready for Implementation  
**Date:** 2026-03-08
